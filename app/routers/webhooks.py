"""pey webhooks (HACK-010): Standard Webhooks over the raw body, idempotent by webhook-id, demo simulator."""
import json
import secrets
from collections.abc import Callable, Mapping
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from standardwebhooks import Webhook, WebhookVerificationError

from app.config import get_settings
from app.schemas.models import WebhookEvent

router = APIRouter()

# webhook-id -> event. In-memory for the sprint; HACK-012 may persist it.
STORE: dict[str, WebhookEvent] = {}
PaymentHandler = Callable[[str, str | None, dict], Any]
_handlers: list[PaymentHandler] = []


def register_payment_handler(fn: PaymentHandler) -> None:
    """HACK-012 registers fn(transaction_id, tracking_key, payload) to mark the debt PAID."""
    _handlers.append(fn)


def reset() -> None:
    STORE.clear()
    _handlers.clear()


def verify(body: bytes, headers: Mapping[str, str]) -> dict:
    """Verify the Standard Webhooks signature over the exact raw bytes; return the parsed payload."""
    secret = get_settings().pey_webhook_secret
    if not secret:
        raise HTTPException(503, "webhook secret not configured")
    wanted = {k: headers.get(k, "") for k in ("webhook-id", "webhook-timestamp", "webhook-signature")}
    try:
        return Webhook(secret).verify(body, wanted)
    except WebhookVerificationError:
        raise HTTPException(401, "bad webhook signature") from None


def process(body: bytes, headers: Mapping[str, str]) -> dict:
    payload = verify(body, headers)
    webhook_id = headers.get("webhook-id", "")
    if webhook_id in STORE:
        return {"ok": True, "duplicate": True}
    STORE[webhook_id] = WebhookEvent(
        webhook_id=webhook_id,
        type=str(payload.get("type", "")),
        received_at=datetime.now(tz=timezone.utc),
        payload=payload,
    )
    data = payload.get("data") if isinstance(payload.get("data"), dict) else payload
    tx = data.get("transactionId")
    if tx:
        tracking = (data.get("metadata") or {}).get("trackingKey")
        for fn in _handlers:
            fn(tx, tracking, payload)
    return {"ok": True, "duplicate": False}


@router.post("/webhooks/pey")
async def pey_webhook(request: Request) -> dict:
    return process(await request.body(), request.headers)


@router.post("/demo/simular-pago/{transaction_id}")
def simulate_payment(transaction_id: str) -> dict:
    settings = get_settings()
    if not settings.demo_mode:
        raise HTTPException(404, "not found")
    if not settings.pey_webhook_secret:
        raise HTTPException(503, "webhook secret not configured")
    msg_id = f"msg_demo_{secrets.token_hex(8)}"
    body = json.dumps(
        {
            "type": "codi.pn.payment_received",
            "data": {"transactionId": transaction_id, "metadata": {"trackingKey": f"DEMO{secrets.token_hex(6).upper()}"}},
        }
    )
    ts = datetime.now(tz=timezone.utc)
    headers = {
        "webhook-id": msg_id,
        "webhook-timestamp": str(int(ts.timestamp())),
        "webhook-signature": Webhook(settings.pey_webhook_secret).sign(msg_id, ts, body),
    }
    result = process(body.encode(), headers)
    return {**result, "transaction_id": transaction_id, "demo_data": True}
