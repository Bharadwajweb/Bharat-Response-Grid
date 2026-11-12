from __future__ import annotations

import asyncio
import secrets
import time
from collections.abc import Mapping
from typing import Any

from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder
from starlette.websockets import WebSocketDisconnect

from .security import AuthenticatedUser, STAFF_ROLES


class RealtimeHub:
    def __init__(self) -> None:
        self._clients: dict[WebSocket, AuthenticatedUser] = {}
        self._tickets: dict[str, tuple[float, AuthenticatedUser]] = {}
        self._lock = asyncio.Lock()

    @property
    def connection_count(self) -> int:
        return len(self._clients)

    async def issue_ticket(self, user: AuthenticatedUser) -> str:
        ticket = secrets.token_urlsafe(32)
        async with self._lock:
            self._prune_tickets()
            self._tickets[ticket] = (time.monotonic() + 30, user)
        return ticket

    def _prune_tickets(self) -> None:
        now = time.monotonic()
        for ticket, (expires_at, _) in list(self._tickets.items()):
            if expires_at <= now:
                self._tickets.pop(ticket, None)

    async def consume_ticket(self, ticket: str) -> AuthenticatedUser | None:
        async with self._lock:
            self._prune_tickets()
            entry = self._tickets.pop(ticket, None)
        if entry is None or entry[0] <= time.monotonic():
            return None
        return entry[1]

    async def connect(self, websocket: WebSocket, user: AuthenticatedUser) -> None:
        await websocket.accept()
        self._clients[websocket] = user
        await websocket.send_json({"type": "CONNECTED", "data": {"userId": user.id}})

    def disconnect(self, websocket: WebSocket) -> None:
        self._clients.pop(websocket, None)

    async def serve(self, websocket: WebSocket, user: AuthenticatedUser) -> None:
        await self.connect(websocket, user)
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            self.disconnect(websocket)

    async def broadcast(self, event: str, payload: Mapping[str, Any]) -> None:
        message = {"type": event, "data": jsonable_encoder(payload)}
        stale: list[WebSocket] = []
        for websocket, user in list(self._clients.items()):
            if event in {"incident:created", "incident:updated", "shelter:updated", "resource:updated", "alert:created", "citizen-report:created"} and not user.has_role(*STAFF_ROLES):
                continue
            try:
                await websocket.send_json(message)
            except Exception:
                stale.append(websocket)
        for websocket in stale:
            self.disconnect(websocket)


realtime_hub = RealtimeHub()
