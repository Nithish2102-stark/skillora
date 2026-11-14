import asyncio
from dataclasses import dataclass, field
from typing import Any

import httpx

from app.core.config import Settings


class MentorContextError(RuntimeError):
    """Raised when authenticated learner context cannot be retrieved."""


@dataclass(frozen=True)
class LearnerContext:
    profile: dict[str, Any] | None = None
    career_goal: dict[str, Any] | None = None
    skills: list[dict[str, Any]] = field(default_factory=list)
    requirements: list[dict[str, Any]] = field(default_factory=list)
    courses: list[dict[str, Any]] = field(default_factory=list)
    enrollments: list[dict[str, Any]] = field(default_factory=list)
    assessment_attempts: list[dict[str, Any]] = field(default_factory=list)
    learning_progress: list[dict[str, Any]] = field(default_factory=list)

    @property
    def skill_gaps(self) -> list[str]:
        saved = {
            str(skill.get("name", "")).casefold(): float(skill.get("proficiency", 0))
            for skill in self.skills
        }
        return [
            str(requirement.get("skill_name"))
            for requirement in self.requirements
            if saved.get(str(requirement.get("skill_name", "")).casefold(), 0)
            < float(requirement.get("required_proficiency", 0))
        ]


class SupabaseContextLoader:
    def __init__(self, settings: Settings, access_token: str, user_id: str):
        if not settings.supabase_url or not settings.supabase_anon_key:
            raise MentorContextError("Supabase context access is not configured.")
        self.settings = settings
        self.access_token = access_token
        self.user_id = user_id

    async def _select(
        self,
        client: httpx.AsyncClient,
        table: str,
        select: str,
        filters: dict[str, str] | None = None,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        params: dict[str, str | int] = {"select": select}
        for column, value in (filters or {}).items():
            params[column] = f"eq.{value}"
        if limit is not None:
            params["limit"] = limit
        try:
            response = await client.get(
                f"{self.settings.supabase_url.rstrip('/')}/rest/v1/{table}",
                params=params,
                headers={
                    "apikey": self.settings.supabase_anon_key,
                    "Authorization": f"Bearer {self.access_token}",
                },
            )
        except httpx.HTTPError as error:
            raise MentorContextError("Learner data could not be reached.") from error
        if response.status_code >= 400:
            raise MentorContextError("Learner data could not be retrieved.")
        payload = response.json()
        if not isinstance(payload, list):
            raise MentorContextError("Learner data returned an invalid response.")
        return payload

    async def load(self) -> LearnerContext:
        timeout = httpx.Timeout(self.settings.mentor_request_timeout_seconds)
        async with httpx.AsyncClient(timeout=timeout) as client:
            profiles, goals, skills, courses, enrollments, attempts, progress = await self._load_primary(client)
            goal = goals[0] if goals else None
            role_id = goal.get("career_role_id") if goal else None
            requirements = (
                await self._select(
                    client,
                    "career_required_skills",
                    "required_proficiency,priority,skill:skills(name)",
                    {"career_role_id": str(role_id)},
                )
                if role_id
                else []
            )
            assessments = await self._select(client, "assessments", "id,title")

        assessment_titles = {str(item["id"]): item.get("title", "Assessment") for item in assessments}
        normalized_requirements = [
            {
                "skill_name": item.get("skill", {}).get("name", "Unnamed skill"),
                "required_proficiency": item.get("required_proficiency", 0),
                "priority": item.get("priority", "medium"),
            }
            for item in requirements
        ]
        normalized_skills = [
            {
                "name": item.get("skill", {}).get("name", "Unnamed skill"),
                "category": item.get("skill", {}).get("category", "Uncategorized"),
                "proficiency": item.get("proficiency", 0),
                "target_proficiency": item.get("target_proficiency", 0),
            }
            for item in skills
        ]
        normalized_attempts = [
            {
                **item,
                "assessment_title": assessment_titles.get(str(item.get("assessment_id")), "Assessment"),
            }
            for item in attempts
        ]
        return LearnerContext(
            profile=profiles[0] if profiles else None,
            career_goal=goal,
            skills=normalized_skills,
            requirements=normalized_requirements,
            courses=courses,
            enrollments=enrollments,
            assessment_attempts=normalized_attempts,
            learning_progress=progress,
        )

    async def _load_primary(self, client: httpx.AsyncClient) -> tuple[list[dict[str, Any]], ...]:
        return await asyncio.gather(
            self._select(client, "profiles", "full_name,education,institution,degree,department,graduation_year,experience_level", {"id": self.user_id}, 1),
            self._select(client, "learner_career_goals", "career_role_id,target_date,career_role:career_roles(title,category,description)", {"user_id": self.user_id, "is_active": "true"}, 1),
            self._select(client, "learner_skills", "proficiency,target_proficiency,skill:skills(name,category)", {"user_id": self.user_id}),
            self._select(client, "courses", "id,title,description,category,difficulty,duration_hours", {"is_active": "true"}),
            self._select(client, "enrollments", "course_id,status,progress_percentage", {"user_id": self.user_id}),
            self._select(client, "assessment_attempts", "assessment_id,score,total_score,status,completed_at", {"user_id": self.user_id}),
            self._select(client, "learning_progress", "lesson_id,completion_status,time_spent_minutes", {"user_id": self.user_id}),
        )
