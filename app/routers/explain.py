"""GET /api/resumen: plain-Spanish explanation of a merchant's sync (HACK-022)."""

import importlib

from fastapi import APIRouter, Depends, Query

from app.config import get_settings
from app.schemas.models import ExplainResponse
from app.services.explain import OpenAIClient, ResponsesOpenAIClient, SyncRecords, explain_sync

router = APIRouter()


def get_openai_client() -> OpenAIClient | None:
    s = get_settings()
    if not (s.openai_api_key and s.openai_model_texto):
        return None  # no key or model → template answer
    return ResponsesOpenAIClient(s.openai_api_key)


def get_records(merchant_id: str = Query(...)) -> SyncRecords:
    """Counts from the debts table (HACK-011). Rejections are not persisted yet → empty."""
    try:
        db = importlib.import_module("app.services.db")
    except ImportError:
        return SyncRecords(merchant_name="")
    conn = db.connect()
    try:
        row = conn.execute("SELECT name FROM merchants WHERE id = ?", (merchant_id,)).fetchone()
        counts = dict(
            conn.execute(
                "SELECT status, COUNT(*) FROM debts WHERE merchant_id = ? GROUP BY status", (merchant_id,)
            ).fetchall()
        )
    finally:
        conn.close()
    return SyncRecords(
        merchant_name=row["name"] if row else "",
        registradas=sum(n for st, n in counts.items() if st not in ("DUPLICADA", "RECHAZADA")),
        pagadas=counts.get("PAGADA", 0),
        duplicadas=counts.get("DUPLICADA", 0),
        rechazos={"rechazada": counts["RECHAZADA"]} if counts.get("RECHAZADA") else {},
    )


@router.get("/api/resumen", response_model=ExplainResponse)
def resumen(
    records: SyncRecords = Depends(get_records),
    client: OpenAIClient | None = Depends(get_openai_client),
) -> ExplainResponse:
    return explain_sync(records, client)
