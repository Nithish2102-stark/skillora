from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class MentorChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)


class CourseRecommendation(BaseModel):
    id: str
    title: str
    description: str | None = None
    reason: str


class MentorChatResponse(BaseModel):
    message: str
    intent: str
    recommendations: list[CourseRecommendation] = Field(default_factory=list)


class MentorHealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    gemini_configured: bool
    supabase_configured: bool
