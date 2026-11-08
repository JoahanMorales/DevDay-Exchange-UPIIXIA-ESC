"""GET /api/reputacion/{payer_id} (HACK-020)."""
from fastapi import APIRouter, HTTPException

from app.routers.registry import Db
from app.schemas import models
from app.services import reputation

router = APIRouter(prefix="/api", tags=["reputation"])


@router.get("/reputacion/{payer_id}", response_model=models.ReputationResponse)
def get_reputation(payer_id: str, conn: Db) -> models.ReputationResponse:
    try:
        return reputation.recompute(conn, payer_id)
    except KeyError:
        raise HTTPException(404, "payer not found") from None
