"""HACK-023 voice: the backend mints a short-lived Realtime secret; the model can only propose (IDEA §7)."""
import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import app
from app.routers import voice

FAKE_KEY = "sk-test-NEVER-IN-THE-BROWSER"


class FakeMinter:
    """Records what it was asked to mint; its reply even echoes the key, which must never reach the client."""

    def __init__(self):
        self.calls: list[dict] = []

    def mint(self, *, model, instructions, tools):
        self.calls.append({"model": model, "instructions": instructions, "tools": tools})
        return {"value": "ek_efimera_123", "expires_at": 1_700_000_060, "session": {"api_key": FAKE_KEY}}


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", FAKE_KEY)
    monkeypatch.setenv("OPENAI_MODEL_VOZ", "modelo-voz-test")
    get_settings.cache_clear()
    minter = FakeMinter()
    app.dependency_overrides[voice.get_minter] = lambda: minter
    yield TestClient(app), minter
    app.dependency_overrides.clear()
    get_settings.cache_clear()


def test_session_endpoint_never_returns_the_api_key(client):
    http, minter = client
    r = http.post("/api/voz/sesion")
    assert r.status_code == 200
    assert FAKE_KEY not in r.text
    body = r.json()
    assert body["client_secret"] == "ek_efimera_123"
    assert body["expires_at"] == 1_700_000_060
    assert body["model"] == "modelo-voz-test"
    assert minter.calls and minter.calls[0]["model"] == "modelo-voz-test"


def test_only_proposal_tools_are_registered(client):
    http, minter = client
    r = http.post("/api/voz/sesion")
    assert r.status_code == 200
    names = [t["name"] for t in minter.calls[0]["tools"]]
    assert names == ["proponer_monto", "proponer_pagador"]
    assert r.json()["herramientas"] == ["proponer_monto", "proponer_pagador"]
    assert minter.calls[0]["tools"][0]["parameters"]["properties"]["centavos"]["type"] == "integer"
    for word in ("firmar", "cobrar", "pagar", "marcar"):
        assert not any(word in n for n in names)


def test_session_without_key_or_model_is_unavailable(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "")
    monkeypatch.setenv("OPENAI_MODEL_VOZ", "")
    get_settings.cache_clear()
    try:
        r = TestClient(app).post("/api/voz/sesion")
        assert r.status_code == 503
    finally:
        get_settings.cache_clear()


def test_minter_failure_is_502_without_leaking(client):
    http, minter = client

    def boom(**_):
        raise RuntimeError(f"upstream said no for {FAKE_KEY}")

    minter.mint = boom
    r = http.post("/api/voz/sesion")
    assert r.status_code == 502
    assert FAKE_KEY not in r.text
