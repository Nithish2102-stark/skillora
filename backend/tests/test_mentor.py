import asyncio
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.config import Settings
from app.main import app
from app.mentor.context import LearnerContext, SupabaseContextLoader
from app.mentor.graph import build_mentor_graph, classify_intent
from app.mentor.models import MentorChatRequest
from app.mentor.models import MentorChatResponse
from app.mentor.service import (
    GoogleGeminiProvider,
    InMemoryRateLimiter,
    MentorNotConfiguredError,
    MentorUnavailableError,
    chat,
)


@pytest.mark.parametrize(
    ("message", "expected"),
    [
        ("Which skills should I improve?", "skills"),
        ("Recommend a course for me", "learning"),
        ("What career path fits my goal?", "career"),
        ("How am I progressing?", "progress"),
        ("What is in my profile?", "profile"),
    ],
)
def test_mentor_routes_messages(message: str, expected: str) -> None:
    assert classify_intent(message) == expected


def test_mentor_rejects_invalid_payload() -> None:
    with pytest.raises(ValidationError):
        MentorChatRequest(message="")


def test_mentor_requires_gemini_configuration() -> None:
    with pytest.raises(MentorNotConfiguredError):
        GoogleGeminiProvider(Settings(gemini_api_key=""))


def test_mentor_converts_gemini_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    class FailingModels:
        async def generate_content(self, **_: object) -> None:
            raise RuntimeError("upstream failure")

    monkeypatch.setattr(
        "app.mentor.service.genai.Client",
        lambda **_: SimpleNamespace(aio=SimpleNamespace(models=FailingModels())),
    )
    provider = GoogleGeminiProvider(Settings(gemini_api_key="test-key"))
    with pytest.raises(MentorUnavailableError):
        asyncio.run(provider.generate("hello"))


def test_supabase_query_is_scoped_to_verified_user() -> None:
    calls: list[dict[str, object]] = []

    class FakeResponse:
        status_code = 200

        def json(self) -> list[dict[str, str]]:
            return []

    class FakeClient:
        async def get(self, _: str, **kwargs: object) -> FakeResponse:
            calls.append(kwargs)
            return FakeResponse()

    loader = SupabaseContextLoader(Settings(supabase_url="https://example.supabase.co", supabase_anon_key="anon"), "verified-token", "user-a")
    asyncio.run(loader._select(FakeClient(), "profiles", "id", {"id": "user-a"}))
    assert calls[0]["params"] == {"select": "id", "id": "eq.user-a"}
    assert calls[0]["headers"] == {"apikey": "anon", "Authorization": "Bearer verified-token"}


def test_empty_context_can_receive_grounded_response() -> None:
    class EmptyLoader:
        async def load(self) -> LearnerContext:
            return LearnerContext()

    class FakeGemini:
        async def generate(self, prompt: str) -> str:
            assert "Saved skills: []" in prompt
            return "I do not have saved learner records yet."

    graph = build_mentor_graph(EmptyLoader(), FakeGemini())
    result = asyncio.run(graph.ainvoke({"message": "What should I learn?", "history": []}))
    assert result["response"] == "I do not have saved learner records yet."


def test_successful_chat_returns_grounded_course_recommendations(monkeypatch: pytest.MonkeyPatch) -> None:
    context = LearnerContext(
        skills=[{"name": "Python", "proficiency": 20}],
        requirements=[{"skill_name": "Python", "required_proficiency": 80}],
        courses=[{"id": "course-1", "title": "Python Foundations", "description": "Build Python skills", "category": "Programming"}],
    )

    class FakeLoader:
        def __init__(self, *_: object) -> None:
            pass

        async def load(self) -> LearnerContext:
            return context

    class FakeGemini:
        def __init__(self, *_: object) -> None:
            pass

        async def generate(self, _: str) -> str:
            return "Python is a saved skill gap. Start with the available foundations course."

    monkeypatch.setattr("app.mentor.service.SupabaseContextLoader", FakeLoader)
    monkeypatch.setattr("app.mentor.service.GoogleGeminiProvider", FakeGemini)
    response = asyncio.run(
        chat(
            MentorChatRequest(message="What should I learn?"),
            {"sub": "user-a", "_access_token": "verified-token"},
            Settings(
                supabase_url="https://example.supabase.co",
                supabase_anon_key="anon",
                gemini_api_key="test-key",
            ),
            InMemoryRateLimiter(10),
        )
    )
    assert response.message.startswith("Python is")
    assert response.recommendations[0].id == "course-1"


def test_chat_endpoint_requires_authentication() -> None:
    response = TestClient(app).post("/api/mentor/chat", json={"message": "Hello"})
    assert response.status_code == 401


def test_authenticated_mentor_request_reaches_service(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.auth import get_current_user

    async def fake_chat(*_: object, **__: object) -> MentorChatResponse:
        return MentorChatResponse(message="Authenticated response", intent="general", recommendations=[])

    monkeypatch.setattr("app.mentor.router.chat", fake_chat)
    app.dependency_overrides[get_current_user] = lambda: {"sub": "user-a", "_access_token": "verified-token"}
    try:
        response = TestClient(app).post("/api/mentor/chat", json={"message": "Hello"})
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["message"] == "Authenticated response"
