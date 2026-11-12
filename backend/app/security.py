from __future__ import annotations

import asyncio
import os
from functools import lru_cache
from typing import Annotated, Any
from urllib.parse import urlsplit

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_optional_db
from .models import Role, UserProfile, UserRoleAssignment


NEON_AUTH_BASE_URL = os.getenv("NEON_AUTH_BASE_URL") or os.getenv("VITE_NEON_AUTH_URL")
ROLE_ALIASES = {
    "admin": "CENTRAL_AUTHORITY",
    "central_authority": "CENTRAL_AUTHORITY",
    "national_admin": "CENTRAL_AUTHORITY",
    "state_authority": "STATE_AUTHORITY",
    "state_admin": "STATE_AUTHORITY",
    "district_officer": "DISTRICT_OFFICER",
    "district_admin": "DISTRICT_OFFICER",
    "emergency_officer": "EMERGENCY_OFFICER",
    "responder": "EMERGENCY_OFFICER",
    "citizen": "CITIZEN",
    "user": "CITIZEN",
}
STAFF_ROLES = {"CENTRAL_AUTHORITY", "STATE_AUTHORITY", "DISTRICT_OFFICER", "EMERGENCY_OFFICER"}


class AuthenticatedUser(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    email: str | None = None
    name: str | None = None
    email_verified: bool = False
    roles: tuple[str, ...] = ("CITIZEN",)
    state_scope: str | None = None
    district_scope: str | None = None

    @property
    def primary_role(self) -> str:
        priority = ("CENTRAL_AUTHORITY", "STATE_AUTHORITY", "DISTRICT_OFFICER", "EMERGENCY_OFFICER", "CITIZEN")
        return next((role for role in priority if role in self.roles), "CITIZEN")

    def has_role(self, *allowed: str) -> bool:
        return any(role in self.roles for role in allowed)


@lru_cache(maxsize=1)
def _jwks_client() -> tuple[PyJWKClient, str]:
    if not NEON_AUTH_BASE_URL:
        raise RuntimeError("Neon Auth URL is not configured")
    parsed = urlsplit(NEON_AUTH_BASE_URL)
    if parsed.scheme != "https" and parsed.hostname not in {"localhost", "127.0.0.1"}:
        raise RuntimeError("Neon Auth URL must use HTTPS")
    issuer = f"{parsed.scheme}://{parsed.netloc}"
    jwks_url = f"{NEON_AUTH_BASE_URL.rstrip('/')}/.well-known/jwks.json"
    return PyJWKClient(jwks_url, cache_keys=True, timeout=5), issuer


def _verify_token_sync(token: str) -> dict[str, Any]:
    client, issuer = _jwks_client()
    signing_key = client.get_signing_key_from_jwt(token)
    algorithm = signing_key.algorithm_name
    if algorithm not in {"RS256", "ES256", "EdDSA"}:
        raise jwt.InvalidAlgorithmError("Unsupported Neon Auth signing algorithm")
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=[algorithm],
        issuer=issuer,
        options={"require": ["exp", "iat", "sub"], "verify_aud": False},
    )


def _normalize_role(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    return ROLE_ALIASES.get(value.strip().lower())


def _claim_roles(claims: dict[str, Any]) -> tuple[str, ...]:
    values: list[Any] = [claims.get("brg_role"), claims.get("role")]
    for key in ("roles", "brg_roles"):
        roles = claims.get(key)
        if isinstance(roles, list):
            values.extend(roles)
        elif isinstance(roles, str):
            values.extend(part.strip() for part in roles.split(","))
    normalized = {role for value in values if (role := _normalize_role(value))}
    return tuple(sorted(normalized)) or ("CITIZEN",)


def _claim_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    return isinstance(value, str) and value.strip().lower() in {"true", "1", "yes"}


async def _profile_access(session: AsyncSession | None, claims: dict[str, Any]) -> tuple[tuple[str, ...], str | None, str | None]:
    if session is None:
        return _claim_roles(claims), None, None

    auth_user_id = str(claims["sub"])
    try:
        statement = (
            select(Role.name, UserRoleAssignment.state_scope, UserRoleAssignment.district_scope)
            .join(UserRoleAssignment, UserRoleAssignment.role_name == Role.name)
            .join(UserProfile, UserProfile.id == UserRoleAssignment.user_id)
            .where(UserProfile.auth_user_id == auth_user_id)
        )
        rows = (await session.execute(statement)).all()
        if rows:
            assigned_roles = {row.name for row in rows}
            claimed_roles = set(_claim_roles(claims))
            missing_roles = claimed_roles - assigned_roles
            if missing_roles:
                profile = await session.scalar(select(UserProfile).where(UserProfile.auth_user_id == auth_user_id))
                if profile is not None:
                    for role_name in missing_roles:
                        if await session.get(Role, role_name) is not None:
                            session.add(UserRoleAssignment(user_id=profile.id, role_name=role_name))
                    await session.commit()
            roles = assigned_roles | claimed_roles
            priority = ("CENTRAL_AUTHORITY", "STATE_AUTHORITY", "DISTRICT_OFFICER", "EMERGENCY_OFFICER", "CITIZEN")
            primary_role = next((role for role in priority if role in roles), "CITIZEN")
            primary_assignment = next((row for row in rows if row.name == primary_role), rows[0])
            return tuple(sorted(roles)), primary_assignment.state_scope, primary_assignment.district_scope

        profile = await session.scalar(select(UserProfile).where(UserProfile.auth_user_id == auth_user_id))
        if profile is None:
            profile = UserProfile(
                auth_user_id=auth_user_id,
                email=claims.get("email"),
                display_name=claims.get("name"),
                email_verified=_claim_bool(claims.get("emailVerified", claims.get("email_verified"))),
            )
            session.add(profile)
            await session.flush()
            for role_name in _claim_roles(claims):
                if await session.get(Role, role_name) is not None:
                    session.add(UserRoleAssignment(user_id=profile.id, role_name=role_name))
            await session.commit()
        else:
            profile.email = claims.get("email") or profile.email
            profile.display_name = claims.get("name") or profile.display_name
            profile.email_verified = _claim_bool(claims.get("emailVerified", claims.get("email_verified")))
            profile.last_seen_at = func.now()
            await session.commit()
        return _claim_roles(claims), None, None
    except SQLAlchemyError:
        await session.rollback()
        return _claim_roles(claims), None, None


_bearer = HTTPBearer(auto_error=False)


async def authenticate_access_token(token: str, session: AsyncSession | None = None) -> AuthenticatedUser:
    try:
        claims = await asyncio.to_thread(_verify_token_sync, token)
    except RuntimeError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error
    except (jwt.PyJWTError, OSError, ValueError) as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token") from error

    if not claims.get("sub"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Access token has no subject")
    roles, state_scope, district_scope = await _profile_access(session, claims)
    return AuthenticatedUser(
        id=str(claims["sub"]),
        email=claims.get("email") if isinstance(claims.get("email"), str) else None,
        name=claims.get("name") if isinstance(claims.get("name"), str) else None,
        email_verified=_claim_bool(claims.get("emailVerified", claims.get("email_verified"))),
        roles=roles,
        state_scope=state_scope,
        district_scope=district_scope,
    )


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    session: Annotated[AsyncSession | None, Depends(get_optional_db)],
) -> AuthenticatedUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sign in is required")
    return await authenticate_access_token(credentials.credentials, session)


def require_roles(*allowed_roles: str):
    async def dependency(user: Annotated[AuthenticatedUser, Depends(get_current_user)]) -> AuthenticatedUser:
        if not user.has_role(*allowed_roles):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your account is not authorized for this action")
        return user

    return dependency
