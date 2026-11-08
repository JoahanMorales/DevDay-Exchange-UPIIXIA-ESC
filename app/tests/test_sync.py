"""HACK-012 sync: decrypt, verify, dedupe and double-spend detection (IDEA §5.6)."""
import base64
import hashlib
import json
import os
from datetime import UTC, datetime
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from standardwebhooks import Webhook

from app.config import get_settings
from app.main import app
from app.routers import webhooks
from app.schemas import protocol
from app.services import credentials, db, debts
from app.services.pey import FakePey

VECTORS = json.loads((Path(__file__).parent.parent / "fixtures" / "sinsenal" / "vectors.json").read_text())
SECRET = "whsec_" + base64.b64encode(b"sinsenal-test-secret-32-bytes!!!").decode()
PAYER = VECTORS["payer"]
BACKUP = VECTORS["other_payer"]
MERCHANT = VECTORS["merchant"]


@pytest.fixture
def env(monkeypatch, tmp_path):
    yield from make_env(monkeypatch, tmp_path)


def make_env(monkeypatch, tmp_path):
    """Enrolled payer (with backup), two merchants, FakePey; shared with test_debts."""
    monkeypatch.setenv("SERVER_SIGNING_KEY", json.dumps(VECTORS["server"]["private_jwk"]))
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "t.db"))
    monkeypatch.setenv("PEY_WEBHOOK_SECRET", SECRET)
    get_settings.cache_clear()
    webhooks.reset()
    debts.install()
    pey = FakePey(statuses=["PENDING"])
    debts.set_pey(pey)
    spawned: list = []  # background pollers are recorded, run by the test that needs them
    monkeypatch.setattr(debts, "_spawn", spawned.append, raising=False)
    conn = db.connect()
    now = datetime.now(UTC).isoformat()
    for p, phone, backup in ((BACKUP, "5500000002", None), (PAYER, "5500000001", BACKUP["id"])):
        conn.execute(
            "INSERT INTO payers (id, display_name, phone, pubkey_jwk, backup_payer_id, backup_phone,"
            " daily_cap_cents, created_at) VALUES (?,?,?,?,?,?,?,?)",
            (p["id"], p["display_name"], phone, json.dumps(p["pubkey_jwk"]), backup,
             "5500000002" if backup else None, 30000, now))
    other_merchant = credentials.new_ulid()
    for mid in (MERCHANT["id"], other_merchant):
        conn.execute("INSERT INTO merchants (id, name, lat, lon, pubkey_jwk, created_at) VALUES (?,?,?,?,?,?)",
                     (mid, MERCHANT["name"], MERCHANT["lat"], MERCHANT["lon"],
                      json.dumps(MERCHANT["pubkey_jwk"]), now))
    conn.commit()
    yield {"client": TestClient(app), "conn": conn, "pey": pey, "other_merchant": other_merchant,
           "spawned": spawned}
    conn.close()
    debts.set_pey(None)
    webhooks.reset()
    get_settings.cache_clear()


def envelope(counter: int = 7, merchant_id: str = MERCHANT["id"], amount: int = 4500, ts: int = 1762560000
             ) -> dict:
    raw = protocol.pack_iou(protocol.IouFields(
        ver=1, payer_id=PAYER["id"], merchant_id=merchant_id, amount_cents=amount, counter=counter,
        ts=ts, nonce=os.urandom(8), lat_e6=19321000, lon_e6=-99167000))
    signed = raw + protocol.sign(PAYER["private_jwk"], raw)
    epk, iv, ct = protocol.encrypt_envelope(
        VECTORS["server"]["pubkey_jwk"], signed, VECTORS["envelope"]["ephemeral_private_jwk"], os.urandom(12))
    return {"envelope_id": hashlib.sha256(signed).hexdigest(), "epk": epk, "iv": iv, "ciphertext": ct,
            "hops": 3, "created_at": 1762560000}


def signed_webhook(body: bytes, msg_id: str | None = None, secret: str = SECRET) -> dict:
    msg_id = msg_id or "msg_" + os.urandom(6).hex()
    ts = datetime.now(tz=UTC)
    return {"webhook-id": msg_id, "webhook-timestamp": str(int(ts.timestamp())),
            "webhook-signature": Webhook(secret).sign(msg_id, ts, body.decode())}


def statuses(conn) -> list[str]:
    return [r["status"] for r in conn.execute("SELECT status FROM debts ORDER BY created_at")]


def test_deduplicates_50_copies_into_one_debt(env):
    c, pey = env["client"], env["pey"]
    copies = [envelope()] * 50
    r = c.post("/api/sync", json={"envelopes": copies[:30]})
    assert r.status_code == 200, r.text
    assert (r.json()["accepted"], r.json()["duplicates"], r.json()["rejected"]) == (1, 29, [])
    r2 = c.post("/api/sync", json={"envelopes": copies[30:]})
    assert (r2.json()["accepted"], r2.json()["duplicates"]) == (0, 20)
    assert statuses(env["conn"]) == ["COBRO_ENVIADO"]
    assert len(pey.pushes) == 1
    assert pey.pushes[0]["phone"] == "5500000001"
    assert r.json()["revocation_list"]["revoked"] == []


def test_flags_same_counter_at_two_merchants_as_double_spend(env):
    c = env["client"]
    first, second = envelope(counter=9), envelope(counter=9, merchant_id=env["other_merchant"])
    assert c.post("/api/sync", json={"envelopes": [first]}).json()["accepted"] == 1
    r = c.post("/api/sync", json={"envelopes": [second]}).json()
    assert r["accepted"] == 0
    assert r["rejected"] == [{"envelope_id": second["envelope_id"], "reason": "counter_replay"}]
    rows = env["conn"].execute("SELECT status, alerts_json FROM debts ORDER BY created_at").fetchall()
    assert [row["status"] for row in rows] == ["COBRO_ENVIADO", "RECHAZADA"]
    assert any("doble gasto" in a for a in json.loads(rows[1]["alerts_json"]))
    assert len(env["pey"].pushes) == 1
    # a tampered envelope is rejected, not stored
    bad = envelope(counter=10)
    bad["ciphertext"] = base64.b64encode(b"x" * 141).decode()
    r = c.post("/api/sync", json={"envelopes": [bad]}).json()
    assert r["rejected"] == [{"envelope_id": bad["envelope_id"], "reason": "bad_envelope"}]


def _reason(c, e) -> list:
    r = c.post("/api/sync", json={"envelopes": [e]}).json()
    assert r["accepted"] == 0
    return [x["reason"] for x in r["rejected"]]


def test_rejects_iou_signed_after_credential_expired(env):
    c, conn = env["client"], env["conn"]
    issued = int(datetime.fromisoformat(conn.execute(
        "SELECT created_at FROM payers WHERE id = ?", (PAYER["id"],)).fetchone()["created_at"]).timestamp())
    late = envelope(counter=20, ts=issued + credentials.CREDENTIAL_TTL_S + 60)
    assert _reason(c, late) == ["expired"]
    assert statuses(conn) == []
    assert env["pey"].pushes == []


def test_rejects_future_dated_iou_as_bad_credential(env):
    c = env["client"]
    future = envelope(counter=21, ts=int(datetime.now(UTC).timestamp()) + 3600)
    assert _reason(c, future) == ["bad_credential"]
    assert statuses(env["conn"]) == []


def test_rejects_iou_over_daily_cap(env):
    c = env["client"]
    over = envelope(counter=22, amount=30001)
    assert _reason(c, over) == ["cap_exceeded"]
    ok = [envelope(counter=23, amount=20000), envelope(counter=24, amount=10000)]
    assert c.post("/api/sync", json={"envelopes": ok}).json()["accepted"] == 2
    assert _reason(c, envelope(counter=25, amount=1)) == ["cap_exceeded"]
    assert statuses(env["conn"]) == ["COBRO_ENVIADO", "COBRO_ENVIADO"]


def test_sync_starts_background_poll_that_marks_paid(env, monkeypatch):
    c, pey = env["client"], env["pey"]
    e = envelope()
    assert c.post("/api/sync", json={"envelopes": [e]}).json()["accepted"] == 1
    assert len(env["spawned"]) == 1  # one poller per charged debt
    assert c.post("/api/sync", json={"envelopes": [e]}).json()["duplicates"] == 1
    assert len(env["spawned"]) == 1  # a re-sync does not start a second poller
    pey.statuses = ["PENDING", "PAID"]
    monkeypatch.setattr(debts.time, "sleep", lambda s: None)
    env["spawned"][0]()
    debt = c.get("/api/deudas").json()["debts"][0]
    assert debt["status"] == "PAGADA"
    assert debt["tracking_key"]
