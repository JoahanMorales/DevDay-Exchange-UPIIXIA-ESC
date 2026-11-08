"""Demo-only endpoints (HACK-029): 404 unless DEMO_MODE is on."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.config import get_settings
from app.routers.registry import Db, _server_ready
from app.services import demo

router = APIRouter(tags=["demo"])


@router.post("/demo/reset")
def reset(conn: Db) -> dict:
    if not get_settings().demo_mode:
        raise HTTPException(404, "not found")
    _server_ready()
    return demo.reset(conn)
