from __future__ import annotations

import asyncio
from collections.abc import Mapping
from typing import Any

from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder
from starlette.websockets import WebSocketDisconnect

from .security import AuthenticatedUser, STAFF_ROLES


class RealtimeHub:
    def __init__(self) -> None:
        self._clients: dict[WebSocket, AuthenticatedUser] = {}

    @property
    def connection_count(self) -> int:
        return len(self._clients)

    async def connect(self, websocket: WebSocket, user: AuthenticatedUser) -> None:
        await websocket.accept(subprotocol="brg-auth")
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
        staff_events = {"incident:created", "incident:updated", "shelter:updated", "resource:updated", "alert:created", "citizen-report:created", "mission:created", "mission:status", "communication:message"}
        for websocket, user in list(self._clients.items()):
            if event in staff_events and not user.has_role(*STAFF_ROLES):
                continue
            if event in staff_events and not user.has_role("CENTRAL_AUTHORITY"):
                state_scope = payload.get("stateScope") or payload.get("state")
                district_scope = payload.get("districtScope") or payload.get("district")
                if state_scope and user.state_scope != state_scope:
                    continue
                if district_scope and user.has_role("DISTRICT_OFFICER") and user.district_scope != district_scope:
                    continue
                if event.startswith("incident:") and user.has_role("EMERGENCY_OFFICER") and payload.get("assignedTo") != user.id:
                    continue
            try:
                await websocket.send_json(message)
            except Exception:
                stale.append(websocket)
        for websocket in stale:
            self.disconnect(websocket)


realtime_hub = RealtimeHub()
