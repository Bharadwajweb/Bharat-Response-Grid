from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from .database import close_database, database_status
from .routes_auth import router as auth_router
from .routes_intelligence import router as intelligence_router
from .routes_operations import router as operations_router
from .routes_system import router as system_router

logger = logging.getLogger("brg.api")


def _allowed_origins() -> list[str]:
    values = [value.strip().rstrip("/") for value in os.getenv("FRONTEND_ORIGINS", "").split(",") if value.strip()]
    if os.getenv("ENVIRONMENT", "development").lower() != "production":
        values.extend(["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "http://127.0.0.1:4173"])
    return list(dict.fromkeys(values))


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    await close_database()


app = FastAPI(
    title="Bharat Response Grid API",
    version="0.2.0",
    description="Authenticated operational APIs with explicit live, cached, offline and simulation states.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    max_age=600,
)


@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(_: Request, error: SQLAlchemyError):
    logger.error("Database operation failed (%s)", type(error).__name__)
    return JSONResponse(status_code=503, content={"detail": "The operational database is unavailable or its migration is incomplete", "status": "DEGRADED"})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, error: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": error.errors(), "status": "ERROR"})


@app.get("/api/health")
async def health():
    database = await database_status()
    return {"status": "ONLINE" if database["status"] == "ONLINE" else "DEGRADED", "database": database}


app.include_router(auth_router)
app.include_router(intelligence_router)
app.include_router(operations_router)
app.include_router(system_router)
