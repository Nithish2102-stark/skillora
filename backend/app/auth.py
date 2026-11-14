import logging
import ssl
from functools import lru_cache
from typing import Annotated, Any

import certifi
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings

logger = logging.getLogger(__name__)
bearer_scheme = HTTPBearer(auto_error=False)


@lru_cache
def _jwks_client() -> jwt.PyJWKClient:
    settings = get_settings()
    if not settings.supabase_jwt_jwks_url:
        raise RuntimeError("SUPABASE_JWT_JWKS_URL is not configured")
    return jwt.PyJWKClient(
        settings.supabase_jwt_jwks_url,
        ssl_context=ssl.create_default_context(cafile=certifi.where()),
    )


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> dict[str, Any]:
    settings = get_settings()
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token required")
    if not settings.supabase_jwt_issuer or not settings.supabase_jwt_jwks_url:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Supabase JWT verification is not configured")
    try:
        signing_key = _jwks_client().get_signing_key_from_jwt(credentials.credentials)
        claims = jwt.decode(
            credentials.credentials,
            signing_key.key,
            algorithms=[algorithm.strip() for algorithm in settings.supabase_jwt_algorithms.split(",") if algorithm.strip()],
            audience="authenticated",
            issuer=settings.supabase_jwt_issuer,
            options={"require": ["exp", "sub"]},
        )
        claims["_access_token"] = credentials.credentials
        return claims
    except jwt.ExpiredSignatureError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Access token expired. Sign in again.") from error
    except jwt.InvalidIssuerError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Access token issuer is invalid.") from error
    except jwt.InvalidSignatureError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Access token signature is invalid.") from error
    except jwt.InvalidAlgorithmError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Access token algorithm is not supported.") from error
    except jwt.PyJWKClientError as error:
        logger.warning("Supabase JWKS retrieval failed: %s", type(error).__name__)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Token verification service is temporarily unavailable.") from error
    except RuntimeError as error:
        logger.error("Supabase JWT verification configuration failed: %s", error)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Token verification is not configured.") from error
    except jwt.PyJWTError as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Access token is invalid.") from error


CurrentUser = Annotated[dict[str, Any], Depends(get_current_user)]
