"""HACK-020 reputation (IDEA §5.8-5.9): deterministic factor, caps, revocation, signed list."""
import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import app
from app.schemas import models
from app.services import credentials, crypto, db, reputation

VECTORS = json.loads((Path(__file__).parent.parent / "fixtures" / "sinsenal" / "vectors.json").read_text())
PAYER = VECTORS["payer"]
NOW = datetime(2026, 11, 8, 12, 0, tzinfo=UTC)
MERCHANT_ID = credentials.new_ulid()


@pytest.fixture
def conn(monkeypatch, tmp_path):
    monkeypatch.setenv("SERVER_SIGNING_KEY", json.dumps(VECTORS["server"]["private_jwk"]))
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "t.db"))
    get_settings.cache_clear()
    c = db.connect()
    c.execute("INSERT INTO payers (id, display_name, phone, pubkey_jwk, daily_cap_cents, created_at)"
              " VALUES (?,?,?,?,?,?)", (PAYER["id"], "Lupita", "5500000001", json.dumps(PAYER["pubkey_jwk"]),
                                        30000, (NOW - timedelta(days=30)).isoformat()))
    c.execute("INSERT INTO merchants (id, name, lat, lon, pubkey_jwk, created_at) VALUES (?,?,?,?,?,?)",
              (MERCHANT_ID, "Tienda", 19.3, -99.1, "{}", NOW.isoformat()))
    c.commit()
    yield c
    c.close()


def add_debt(conn, counter, status, created, paid=None, alerts=()):
    conn.execute(
        "INSERT INTO debts (id, payer_id, merchant_id, amount_cents, counter, iou_json, status, alerts_json,"
        " paid_at, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
        (credentials.new_ulid(), PAYER["id"], MERCHANT_ID, 2500, counter, "{}", status, json.dumps(list(alerts)),
         paid.isoformat() if paid else None, created.isoformat()))
    conn.commit()


def payer(conn):
    return conn.execute("SELECT * FROM payers WHERE id = ?", (PAYER["id"],)).fetchone()


def test_factor_rises_point_one_per_debt_paid_within_48h(conn):
    t = NOW - timedelta(days=3)
    for i in range(3):
        add_debt(conn, i, "PAGADA", t, paid=t + timedelta(hours=1))
    add_debt(conn, 10, "PAGADA", t, paid=t + timedelta(hours=60))  # paid late: no bonus
    r = reputation.recompute(conn, PAYER["id"], NOW)
    assert r.factor == 1.3
    assert r.daily_cap_cents == 39000  # base 30000 x 1.3
    assert payer(conn)["reputation_factor"] == 1.3
    for i in range(20, 32):  # many fast payments: capped at 2.0
        add_debt(conn, i, "PAGADA", t, paid=t + timedelta(hours=2))
    r = reputation.recompute(conn, PAYER["id"], NOW)
    assert r.factor == 2.0 and r.daily_cap_cents == 60000
    assert reputation.recompute(conn, PAYER["id"], NOW).factor == 2.0  # idempotent


def test_factor_is_zero_after_debt_overdue_7_days(conn):
    add_debt(conn, 1, "COBRO_ENVIADO", NOW - timedelta(days=6, hours=23))
    assert reputation.recompute(conn, PAYER["id"], NOW).factor == 1.0  # not yet 7 days
    add_debt(conn, 2, "REGISTRADA", NOW - timedelta(days=8))
    r = reputation.recompute(conn, PAYER["id"], NOW)
    assert r.factor == 0.0 and r.daily_cap_cents == 0
    assert any("7 días" in x for x in r.reasons)


def test_double_spend_revokes_payer(conn):
    add_debt(conn, 5, "RECHAZADA", NOW - timedelta(hours=1), alerts=["doble gasto: contador 5 usado en dos comercios"])
    r = reputation.recompute(conn, PAYER["id"], NOW)
    assert r.factor == 0.0
    assert payer(conn)["revoked"] == 1
    assert PAYER["id"] in reputation.revocation_list(conn, NOW).revoked
    assert any("doble gasto" in x for x in r.reasons)


def test_revocation_list_is_signed_by_server(conn):
    lst = reputation.revocation_list(conn, NOW)
    models.RevocationList(**lst.model_dump())
    assert crypto.verify_credential(lst.model_dump()) is True
    assert lst.caps[PAYER["id"]] == 30000
    forged = {**lst.model_dump(), "revoked": [PAYER["id"]]}
    assert crypto.verify_credential(forged) is False
    v1 = lst.version
    add_debt(conn, 5, "RECHAZADA", NOW, alerts=["doble gasto: contador 5"])
    reputation.recompute(conn, PAYER["id"], NOW)
    assert reputation.revocation_list(conn, NOW).version > v1  # clients keep the newest version


def test_reputation_endpoint(conn):
    client = TestClient(app)
    r = client.get(f"/api/reputacion/{PAYER['id']}")
    assert r.status_code == 200
    body = r.json()
    assert body["payer_id"] == PAYER["id"] and body["factor"] == 1.0 and body["daily_cap_cents"] == 30000
    assert body["reasons"]
    assert client.get("/api/reputacion/" + credentials.new_ulid()).status_code == 404
