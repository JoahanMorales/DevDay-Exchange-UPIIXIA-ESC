"""POST /api/sync: relays upload envelopes; dedupe, verify, register debts, push charges (HACK-012)."""
from fastapi import APIRouter, HTTPException

from app.routers.registry import Db
from app.schemas import models
from app.services import crypto, debts

router = APIRouter(prefix="/api", tags=["sync"])


@router.post("/sync", response_model=models.SyncResponse)
def sync(req: models.SyncRequest, conn: Db) -> models.SyncResponse:
    try:
        crypto.server_private_jwk()
    except (crypto.ServerKeyMissing, ValueError, KeyError, TypeError) as exc:
        raise HTTPException(503, f"server key unavailable: {exc}") from exc
    debts.install()
    return debts.sync(conn, req)
