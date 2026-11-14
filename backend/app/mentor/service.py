import asyncio
from collections import defaultdict, deque
from time import monotonic
from typing import Any

from google import genai

from app.core.config import Settings
from app.mentor.context import LearnerContext, SupabaseContextLoader
from app.mentor.graph import GeminiProvider, build_mentor_graph
from app.mentor.models import CourseRecommendation, MentorChatRequest, MentorChatResponse


class MentorNotConfiguredError(RuntimeError):
    pass


class MentorUnavailableError(RuntimeError):
    pass


class MentorRateLimitError(RuntimeError):
    pass


class GoogleGeminiProvider(GeminiProvider):
    def __init__(self, settings: Settings):
        if not settings.gemini_api_key:
            raise MentorNotConfiguredError("AI Mentor is not configured.")
        self.settings = settings

    async def generate(self, prompt: str) -> str:
        client = genai.Client(api_key=self.settings.gemini_api_key)
        try:
            response = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model=self.settings.gemini_model,
                    contents=prompt,
                ),
                timeout=self.settings.mentor_request_timeout_seconds,
            )
        except asyncio.TimeoutError as error:
            raise MentorUnavailableError("AI Mentor timed out.") from error
        except Exception as error:
            raise MentorUnavailableError("AI Mentor is temporarily unavailable.") from error
        text = getattr(response, "text", None)
        if not isinstance(text, str) or not text.strip():
            raise MentorUnavailableError("AI Mentor returned no usable response.")
        return text.strip()


class InMemoryRateLimiter:
    def __init__(self, limit: int):
        self.limit = max(1, limit)
        self.events: defaultdict[str, deque[float]] = defaultdict(deque)

    def check(self, user_id: str) -> None:
        now = monotonic()
        events = self.events[user_id]
        while events and now - events[0] >= 60:
            events.popleft()
        if len(events) >= self.limit:
            raise MentorRateLimitError("Mentor request limit reached. Try again shortly.")
        events.append(now)


def _recommendations(context: LearnerContext) -> list[CourseRecommendation]:
    gaps = [gap.casefold() for gap in context.skill_gaps]
    enrolled = {str(item.get("course_id")) for item in context.enrollments}
    ranked: list[tuple[int, dict[str, Any]]] = []
    for course in context.courses:
        if str(course.get("id")) in enrolled:
            continue
        haystack = " ".join(
            str(course.get(field, ""))
            for field in ("title", "description", "category")
        ).casefold()
        score = sum(1 for gap in gaps if gap in haystack)
        if score:
            ranked.append((score, course))
    ranked.sort(key=lambda item: (-item[0], str(item[1].get("title", ""))))
    return [
        CourseRecommendation(
            id=str(course["id"]),
            title=str(course.get("title", "Course")),
            description=course.get("description"),
            reason=f"Matches saved skill gap(s): {', '.join(context.skill_gaps[:3])}.",
        )
        for _, course in ranked[:3]
    ]


async def chat(
    request: MentorChatRequest,
    user: dict[str, Any],
    settings: Settings,
    limiter: InMemoryRateLimiter,
) -> MentorChatResponse:
    user_id = str(user.get("sub", ""))
    access_token = user.get("_access_token")
    if not user_id or not isinstance(access_token, str):
        raise MentorUnavailableError("Authenticated user context is unavailable.")
    limiter.check(user_id)
    loader = SupabaseContextLoader(settings, access_token, user_id)
    gemini = GoogleGeminiProvider(settings)
    graph = build_mentor_graph(loader, gemini)
    result = await graph.ainvoke({
        "message": request.message,
        "history": [message.model_dump() for message in request.history],
    })
    context = result["context"]
    return MentorChatResponse(
        message=result["response"],
        intent=result.get("intent", "general"),
        recommendations=_recommendations(context),
    )
