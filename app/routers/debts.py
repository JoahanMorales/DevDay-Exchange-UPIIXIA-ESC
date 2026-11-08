"""Debts read API and live status over SSE (HACK-012)."""
import asyncio
from collections.abc import AsyncIterator
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.routers.registry import Db
from app.schemas import models
from app.services import db, debts

router = APIRouter(prefix="/api", tags=["debts"])
debts.install()

TERMINAL = {"PAGADA", "DUPLICADA", "RECHAZADA"}
SSE_POLL_S = 1.0
SSE_MAX_S = 15 * 60


@router.get("/deudas", response_model=models.DebtList)
def list_debts(conn: Db, merchant_id: str | None = None) -> models.DebtList:
    return models.DebtList(debts=debts.list_debts(conn, merchant_id))


@router.get("/deudas/{debt_id}", response_model=models.Debt)
def get_debt(debt_id: str, conn: Db) -> models.Debt:
    debt = debts.get_debt(conn, debt_id)
    if debt is None:
        raise HTTPException(404, "debt not found")
    return debt


@router.post("/deudas/{debt_id}/verificar", response_model=models.Debt)
def verify_debt(debt_id: str, conn: Db) -> models.Debt:
    """Force one pey poll now (the webhook may never arrive)."""
    if debts.get_debt(conn, debt_id) is None:
        raise HTTPException(404, "debt not found")
    try:
        debts.poll(conn, debt_id, debts.get_pey())
    except Exception as exc:  # noqa: BLE001 - pey down: report, keep the debt as is
        raise HTTPException(502, f"pey unavailable: {exc.__class__.__name__}") from exc
    return debts.get_debt(conn, debt_id)


@router.get("/deudas/{debt_id}/eventos")
def debt_events(debt_id: str, conn: Db) -> StreamingResponse:
    if debts.get_debt(conn, debt_id) is None:
        raise HTTPException(404, "debt not found")

    async def stream() -> AsyncIterator[str]:
        last, waited = None, 0.0
        while waited <= SSE_MAX_S:
            c = db.connect()
            try:
                d = debts.get_debt(c, debt_id)
            finally:
                c.close()
            if d.status != last:
                last = d.status
                ev = models.DebtEvent(debt_id=debt_id, status=d.status, at=datetime.now(UTC),
                                      detail=d.alerts[-1] if d.alerts else None)
                yield f"data: {ev.model_dump_json()}\n\n"
            if last in TERMINAL:
                return
            await asyncio.sleep(SSE_POLL_S)
            waited += SSE_POLL_S

    return StreamingResponse(stream(), media_type="text/event-stream")
