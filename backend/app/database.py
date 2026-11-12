from __future__ import annotations

import os
from collections.abc import AsyncIterator
from time import perf_counter
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine


def _normalize_database_url(raw_url: str) -> str:
    url = make_url(raw_url)
    if url.drivername in {"postgres", "postgresql"}:
        url = url.set(drivername="postgresql+asyncpg")
    query = dict(url.query)
    sslmode = query.pop("sslmode", None)
    if sslmode in {"require", "verify-ca", "verify-full"}:
        query["ssl"] = "require"
    elif sslmode == "disable":
        query["ssl"] = "disable"
    return url.set(query=query).render_as_string(hide_password=False)


_raw_database_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or os.getenv("POSTGRES_PRISMA_URL")
engine = (
    create_async_engine(
        _normalize_database_url(_raw_database_url),
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        pool_recycle=300,
    )
    if _raw_database_url
    else None
)
SessionFactory = async_sessionmaker(engine, expire_on_commit=False) if engine else None


async def get_db() -> AsyncIterator[AsyncSession]:
    if SessionFactory is None:
        raise HTTPException(status_code=503, detail="Database connection is not configured")
    async with SessionFactory() as session:
        yield session


async def get_optional_db() -> AsyncIterator[AsyncSession | None]:
    if SessionFactory is None:
        yield None
        return
    async with SessionFactory() as session:
        yield session


async def database_status() -> dict[str, Any]:
    if engine is None:
        return {"status": "OFFLINE", "schema": "UNCONFIGURED", "latencyMs": None}

    started = perf_counter()
    try:
        async with engine.connect() as connection:
            result = await connection.execute(
                text(
                    "SELECT "
                    "to_regclass('public.incidents') IS NOT NULL AS incidents, "
                    "to_regclass('public.shelters') IS NOT NULL AS shelters, "
                    "to_regclass('public.weather_data') IS NOT NULL AS weather_data, "
                    "to_regclass('public.audit_logs') IS NOT NULL AS audit_logs"
                )
            )
            schema = result.mappings().one()
        ready = all(schema.values())
        return {
            "status": "ONLINE" if ready else "DEGRADED",
            "schema": "READY" if ready else "MIGRATION_REQUIRED",
            "latencyMs": round((perf_counter() - started) * 1000, 1),
        }
    except (SQLAlchemyError, OSError):
        return {"status": "OFFLINE", "schema": "UNAVAILABLE", "latencyMs": None}


async def close_database() -> None:
    if engine is not None:
        await engine.dispose()
