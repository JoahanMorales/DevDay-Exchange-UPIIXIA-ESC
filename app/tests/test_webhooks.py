import base64
import json
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from standardwebhooks import Webhook

from app.config import get_settings
from app.routers import webhooks
from app.main import app

SECRET = "whsec_" + base64.b64encode(b"sinsenal-test-secret-32-bytes!!!").decode()


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("PEY_WEBHOOK_SECRET", SECRET)
    monkeypatch.setenv("DEMO_MODE", "1")
    get_settings.cache_clear()
    webhooks.reset()
    calls: list[tuple] = []
    webhooks.register_payment_handler(lambda tx, tk, payload: calls.append((tx, tk)))
    c = TestClient(app)
    c.calls = calls
    yield c
    webhooks.reset()
    get_settings.cache_clear()


def signed(body: bytes, msg_id: str = "msg_1", secret: str = SECRET) -> dict:
    ts = datetime.now(tz=timezone.utc)
    sig = Webhook(secret).sign(msg_id, ts, body.decode())
    return {"webhook-id": msg_id, "webhook-timestamp": str(int(ts.timestamp())), "webhook-signature": sig}


BODY = json.dumps(
    {"type": "codi.pn.payment_received", "data": {"transactionId": "01TX", "metadata": {"trackingKey": "TK9"}}}
).encode()


def test_rejects_webhook_with_bad_signature(client) -> None:
    bad = "whsec_" + base64.b64encode(b"another-secret-another-secret-32").decode()
    r = client.post("/webhooks/pey", content=BODY, headers=signed(BODY, secret=bad))
    assert r.status_code == 401
    assert client.calls == []


def test_verifies_signature_over_raw_body_not_parsed_json(client) -> None:
    raw = b'{ "type" : "codi.pn.payment_received",\n "data": {"transactionId":"01TX","metadata":{"trackingKey":"TK9"}} }'
    r = client.post("/webhooks/pey", content=raw, headers=signed(raw))
    assert r.status_code == 200
    assert client.calls == [("01TX", "TK9")]
    reserialized = json.dumps(json.loads(raw)).encode()
    r2 = client.post("/webhooks/pey", content=reserialized, headers=signed(raw, msg_id="msg_2"))
    assert r2.status_code == 401


def test_ignores_repeated_webhook_id(client) -> None:
    h = signed(BODY, msg_id="msg_dup")
    assert client.post("/webhooks/pey", content=BODY, headers=h).json()["duplicate"] is False
    assert client.post("/webhooks/pey", content=BODY, headers=h).json()["duplicate"] is True
    assert client.calls == [("01TX", "TK9")]
    assert webhooks.STORE["msg_dup"].type == "codi.pn.payment_received"


def test_demo_webhook_goes_through_the_same_verifier(client, monkeypatch) -> None:
    r = client.post("/demo/simular-pago/01DEMO")
    assert r.status_code == 200 and r.json()["demo_data"] is True
    assert client.calls[0][0] == "01DEMO"
    seen = []
    real = webhooks.verify
    monkeypatch.setattr(webhooks, "verify", lambda body, headers: seen.append(body) or real(body, headers))
    client.post("/demo/simular-pago/01DEMO2")
    assert len(seen) == 1
    monkeypatch.setenv("DEMO_MODE", "0")
    get_settings.cache_clear()
    assert client.post("/demo/simular-pago/01DEMO3").status_code == 404
