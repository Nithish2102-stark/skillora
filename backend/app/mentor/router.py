from fastapi import APIRouter, HTTPException, status

from app.auth import CurrentUser
from app.core.config import get_settings
from app.mentor.models import MentorChatRequest, MentorChatResponse, MentorHealthResponse
from app.mentor.service import (
    InMemoryRateLimiter,
    MentorNotConfiguredError,
    MentorRateLimitError,
    MentorUnavailableError,
    chat,
)

router = APIRouter(prefix="/mentor", tags=["mentor"])
_limiter = InMemoryRateLimiter(get_settings().mentor_rate_limit_per_minute)


@router.get("/health", response_model=MentorHealthResponse)
def mentor_health() -> MentorHealthResponse:
    settings = get_settings()
    return MentorHealthResponse(
        status="ok" if settings.gemini_api_key and settings.supabase_url and settings.supabase_anon_key else "degraded",
        gemini_configured=bool(settings.gemini_api_key),
        supabase_configured=bool(settings.supabase_url and settings.supabase_anon_key),
    )


@router.post("/chat", response_model=MentorChatResponse)
async def mentor_chat(request: MentorChatRequest, user: CurrentUser) -> MentorChatResponse:
    try:
        return await chat(request, user, get_settings(), _limiter)
    except MentorNotConfiguredError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error
    except MentorRateLimitError as error:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(error)) from error
    except MentorUnavailableError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Learner context is temporarily unavailable.") from error
