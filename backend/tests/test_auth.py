from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import jwt
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from cryptography.hazmat.primitives.asymmetric import ec

from app import auth
from app.core.config import Settings


@pytest.fixture
def signing_keys() -> tuple[ec.EllipticCurvePrivateKey, ec.EllipticCurvePrivateKey]:
    return ec.generate_private_key(ec.SECP256R1()), ec.generate_private_key(ec.SECP256R1())


@pytest.fixture
def valid_claims() -> dict[str, object]:
    settings = Settings()
    return {
        "sub": "user-a",
        "aud": "authenticated",
        "iss": settings.supabase_jwt_issuer,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
    }


def _credentials(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


def _use_signing_key(monkeypatch: pytest.MonkeyPatch, key: object) -> None:
    monkeypatch.setattr(
        auth,
        "_jwks_client",
        lambda: SimpleNamespace(get_signing_key_from_jwt=lambda _: SimpleNamespace(key=key)),
    )


def test_valid_supabase_access_token(monkeypatch: pytest.MonkeyPatch, signing_keys, valid_claims) -> None:
    private_key, _ = signing_keys
    _use_signing_key(monkeypatch, private_key.public_key())
    token = jwt.encode(valid_claims, private_key, algorithm="ES256")

    claims = auth.get_current_user(_credentials(token))

    assert claims["sub"] == "user-a"
    assert claims["_access_token"] == token


def test_expired_token(monkeypatch: pytest.MonkeyPatch, signing_keys, valid_claims) -> None:
    private_key, _ = signing_keys
    _use_signing_key(monkeypatch, private_key.public_key())
    valid_claims["exp"] = datetime.now(timezone.utc) - timedelta(minutes=1)

    with pytest.raises(HTTPException, match="expired"):
        auth.get_current_user(_credentials(jwt.encode(valid_claims, private_key, algorithm="ES256")))


def test_invalid_signature(monkeypatch: pytest.MonkeyPatch, signing_keys, valid_claims) -> None:
    private_key, other_key = signing_keys
    _use_signing_key(monkeypatch, other_key.public_key())

    with pytest.raises(HTTPException, match="signature"):
        auth.get_current_user(_credentials(jwt.encode(valid_claims, private_key, algorithm="ES256")))


def test_incorrect_issuer(monkeypatch: pytest.MonkeyPatch, signing_keys, valid_claims) -> None:
    private_key, _ = signing_keys
    _use_signing_key(monkeypatch, private_key.public_key())
    valid_claims["iss"] = "https://wrong.example.invalid/auth/v1"

    with pytest.raises(HTTPException, match="issuer"):
        auth.get_current_user(_credentials(jwt.encode(valid_claims, private_key, algorithm="ES256")))


def test_unsupported_signing_algorithm(monkeypatch: pytest.MonkeyPatch, signing_keys, valid_claims) -> None:
    private_key, _ = signing_keys
    _use_signing_key(monkeypatch, private_key.public_key())

    with pytest.raises(HTTPException, match="algorithm"):
        auth.get_current_user(_credentials(jwt.encode(valid_claims, "not-a-jwt-key", algorithm="HS256")))


def test_missing_authorization_header() -> None:
    with pytest.raises(HTTPException, match="Bearer token required"):
        auth.get_current_user(None)
