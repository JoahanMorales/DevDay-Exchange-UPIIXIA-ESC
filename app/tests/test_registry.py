"""HACK-011 registry: enrollment endpoints and server-signed credentials."""
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import app
from app.services import crypto

VECTORS = json.loads(
    (Path(__file__).parent.parent / "fixtures" / "sinsenal" / "vectors.json").read_text()
)


@pytest.fixture
def client(monkeypatch, tmp_path):
    monkeypatch.setenv("SERVER_SIGNING_KEY", json.dumps(VECTORS["server"]["private_jwk"]))
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "t.db"))
    get_settings.cache_clear()
    yield TestClient(app)
    get_settings.cache_clear()


def test_issues_credential_verifiable_with_server_key(client):
    lupita = VECTORS["payer"]["pubkey_jwk"]
    r = client.post("/api/payers", json={"display_name": "Lupita", "phone": "5500000001", "pubkey_jwk": lupita})
    assert r.status_code == 200, r.text
    body = r.json()
    cred = body["credential"]
    assert cred["subject_id"] == body["payer"]["id"]
    assert cred["subject_type"] == "payer"
    assert cred["pubkey_jwk"] == lupita
    assert cred["daily_cap_cents"] == 30000

    k = client.get("/api/server-key")
    assert k.status_code == 200
    server_pub = k.json()["pubkey_jwk"]
    assert "d" not in server_pub
    assert server_pub == VECTORS["server"]["pubkey_jwk"]
    assert crypto.verify_credential(cred, server_pub) is True

    m = client.post("/api/merchants", json={"name": "Tienda Doña Carmen", "lat": 19.321, "lon": -99.167,
                                            "pubkey_jwk": VECTORS["merchant"]["pubkey_jwk"]})
    assert m.status_code == 200, m.text
    assert crypto.verify_credential(m.json()["credential"], server_pub) is True
    assert m.json()["credential"]["subject_type"] == "merchant"
