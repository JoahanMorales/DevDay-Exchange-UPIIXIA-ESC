"""HACK-029 demo seed: POST /demo/reset only with DEMO_MODE, four synthetic personas."""
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import app
from app.services import crypto, db

VECTORS = json.loads(
    (Path(__file__).parent.parent / "fixtures" / "sinsenal" / "vectors.json").read_text()
)


@pytest.fixture
def make_client(monkeypatch, tmp_path):
    def make(demo_mode: bool) -> TestClient:
        monkeypatch.setenv("SERVER_SIGNING_KEY", json.dumps(VECTORS["server"]["private_jwk"]))
        monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "t.db"))
        monkeypatch.setenv("DEMO_MODE", "1" if demo_mode else "0")
        get_settings.cache_clear()
        return TestClient(app)

    yield make
    get_settings.cache_clear()


def test_reset_refuses_without_demo_mode(make_client):
    client = make_client(demo_mode=False)
    r = client.post("/demo/reset")
    assert r.status_code == 404
    conn = db.connect()
    assert conn.execute("SELECT COUNT(*) FROM payers").fetchone()[0] == 0
    assert conn.execute("SELECT COUNT(*) FROM merchants").fetchone()[0] == 0


def test_reset_seeds_the_four_personas_with_valid_credentials(make_client):
    client = make_client(demo_mode=True)
    first = client.post("/demo/reset")
    assert first.status_code == 200, first.text
    r = client.post("/demo/reset")  # idempotent: a second reset leaves exactly one copy
    assert r.status_code == 200, r.text
    body = r.json()
    server_pub = VECTORS["server"]["pubkey_jwk"]

    merchant = body["merchant"]
    assert "Lupita" in merchant["merchant"]["name"]
    assert merchant["credential"]["subject_type"] == "merchant"
    assert crypto.verify_credential(merchant["credential"], server_pub) is True

    payers = {p["payer"]["display_name"]: p for p in body["payers"]}
    assert set(payers) == {"Mario", "Doña Carmen", "Luis"}
    for p in payers.values():
        assert p["credential"]["subject_type"] == "payer"
        assert p["credential"]["subject_id"] == p["payer"]["id"]
        assert crypto.verify_credential(p["credential"], server_pub) is True
        # the private key the demo device loads matches the credential's public key
        assert crypto.public_jwk(p["private_jwk"]) == p["credential"]["pubkey_jwk"]
    carmen = payers["Doña Carmen"]
    assert carmen["payer"]["kind"] == "band"
    assert carmen["credential"]["daily_cap_cents"] == 10_000
    assert carmen["payer"]["backup_payer_id"] == payers["Luis"]["payer"]["id"]
    assert payers["Mario"]["credential"]["daily_cap_cents"] == 30_000

    conn = db.connect()
    assert conn.execute("SELECT COUNT(*) FROM payers").fetchone()[0] == 3
    assert conn.execute("SELECT COUNT(*) FROM merchants").fetchone()[0] == 1
