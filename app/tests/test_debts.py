"""HACK-012 debts: one live charge, cascade, paid only when verified, duplicates (IDEA §5.7–5.8)."""
import json
from datetime import UTC, datetime, timedelta

import pytest

from app.services import debts
from app.tests.test_sync import envelope, make_env, signed_webhook


@pytest.fixture
def env(monkeypatch, tmp_path):
    yield from make_env(monkeypatch, tmp_path)


def _sync_one(env, **kw) -> str:
    r = env["client"].post("/api/sync", json={"envelopes": [envelope(**kw)]})
    assert r.json()["accepted"] == 1, r.text
    return env["conn"].execute("SELECT id FROM debts ORDER BY created_at DESC LIMIT 1").fetchone()["id"]


def _debt(env, debt_id: str) -> dict:
    r = env["client"].get(f"/api/deudas/{debt_id}")
    assert r.status_code == 200, r.text
    return r.json()


def test_keeps_one_live_charge_per_debt(env):
    debt_id = _sync_one(env)
    for _ in range(3):
        debts.charge(env["conn"], debt_id, env["pey"])
    assert len(env["pey"].pushes) == 1
    d = _debt(env, debt_id)
    assert d["status"] == "COBRO_ENVIADO"
    assert [a["state"] for a in d["attempts"]] == ["ACTIVO"]
    listed = env["client"].get("/api/deudas", params={"merchant_id": d["iou"]["merchant_id"]}).json()
    assert [x["id"] for x in listed["debts"]] == [debt_id]


def test_cascades_to_backup_after_expiry(env):
    debt_id = _sync_one(env)
    later = datetime.now(UTC) + timedelta(seconds=debts.MIN_EXPIRATION + 1)
    debts.expire(env["conn"], debt_id, env["pey"], now=later)
    d = _debt(env, debt_id)
    assert d["charge_target"] == "backup"
    assert [a["state"] for a in d["attempts"]] == ["EXPIRADO", "ACTIVO"]
    assert [p["phone"] for p in env["pey"].pushes] == ["5500000001", "5500000002"]
    # the backup also expires: no third live charge, the debt is VENCIDA
    debts.expire(env["conn"], debt_id, env["pey"], now=later + timedelta(seconds=debts.MIN_EXPIRATION + 1))
    assert _debt(env, debt_id)["status"] == "VENCIDA"
    assert len(env["pey"].pushes) == 2


def test_marks_paid_only_on_verified_webhook_or_paid_poll(env):
    c = env["client"]
    debt_id = _sync_one(env)
    tx = _debt(env, debt_id)["pey_transaction_id"]
    body = json.dumps({"type": "codi.pn.payment_received",
                       "data": {"transactionId": tx, "metadata": {"trackingKey": "TK1"}}}).encode()
    forged = signed_webhook(body, secret="whsec_" + "QUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUE=")
    assert c.post("/webhooks/pey", content=body, headers=forged).status_code == 401
    assert debts.poll(env["conn"], debt_id, env["pey"]) is False  # pey says PENDING
    assert _debt(env, debt_id)["status"] == "COBRO_ENVIADO"
    assert c.post("/webhooks/pey", content=body, headers=signed_webhook(body)).status_code == 200
    d = _debt(env, debt_id)
    assert (d["status"], d["tracking_key"]) == ("PAGADA", "TK1")
    assert d["attempts"][-1]["state"] == "PAGADO"
    events = c.get(f"/api/deudas/{debt_id}/eventos").text
    assert '"status": "PAGADA"' in events or '"status":"PAGADA"' in events

    other = _sync_one(env, counter=21)
    env["pey"].get_transaction = lambda t: {"transactionId": t, "status": "PAID", "trackingKey": "TK2"}
    assert debts.poll(env["conn"], other, env["pey"]) is True
    assert (_debt(env, other)["status"], _debt(env, other)["tracking_key"]) == ("PAGADA", "TK2")


def test_marks_second_payment_duplicated(env):
    debt_id = _sync_one(env)
    first_tx = _debt(env, debt_id)["pey_transaction_id"]
    debts.on_payment(first_tx, "TK1", {})
    debts.on_payment(first_tx, "TK1", {})  # same payment twice is idempotent
    assert _debt(env, debt_id)["status"] == "PAGADA"
    # a stale attempt (e.g. the backup's push) pays too
    env["conn"].execute(
        "INSERT INTO attempts (debt_id, target_phone, sent_at, expires_at, state, pey_transaction_id)"
        " VALUES (?, '5500000002', ?, ?, 'EXPIRADO', 'TX-SECOND')",
        (debt_id, datetime.now(UTC).isoformat(), datetime.now(UTC).isoformat()))
    env["conn"].commit()
    debts.on_payment("TX-SECOND", "TK2", {})
    d = _debt(env, debt_id)
    assert d["status"] == "DUPLICADA"
    assert any("reembolso manual" in a for a in d["alerts"])


def test_watch_polls_every_5s_until_paid(env):
    debt_id = _sync_one(env)
    env["pey"].statuses = ["PENDING", "PENDING", "PAID"]
    slept: list[float] = []
    assert debts.watch(debt_id, env["pey"], sleep=slept.append) is True
    assert slept == [5, 5]
    assert _debt(env, debt_id)["status"] == "PAGADA"


def test_watch_gives_up_after_6_minutes(env):
    debt_id = _sync_one(env)
    slept: list[float] = []
    assert debts.watch(debt_id, env["pey"], sleep=slept.append) is False
    assert sum(slept) <= 360 and len(env["pey"].polled) == 360 // 5
    assert _debt(env, debt_id)["status"] == "COBRO_ENVIADO"


def test_verify_endpoint_forces_poll(env):
    c = env["client"]
    debt_id = _sync_one(env)
    r = c.post(f"/api/deudas/{debt_id}/verificar")
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "COBRO_ENVIADO"  # pey still PENDING
    env["pey"].statuses = ["PAID"]  # real pey may omit trackingKey on GET /transaction
    r = c.post(f"/api/deudas/{debt_id}/verificar")
    assert (r.json()["status"], bool(r.json()["tracking_key"])) == ("PAGADA", True)
    assert c.post("/api/deudas/NOPE/verificar").status_code == 404
