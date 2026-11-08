"""HACK-032 assistant: read-only tools, numbers only from records, template fallback (IDEA §7)."""
import json
import re
from datetime import UTC, datetime
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import app
from app.routers import assistant as assistant_router
from app.services import assistant, credentials, db

VECTORS = json.loads((Path(__file__).parent.parent / "fixtures" / "sinsenal" / "vectors.json").read_text())
LUPITA, OTRA = credentials.new_ulid(), credentials.new_ulid()
MARIO, LUIS = VECTORS["payer"]["id"], VECTORS["other_payer"]["id"]
NOW = datetime(2026, 11, 8, 12, 0, tzinfo=UTC).isoformat()


@pytest.fixture
def conn(monkeypatch, tmp_path):
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "t.db"))
    monkeypatch.setenv("OPENAI_MODEL_TEXTO", "modelo-test")
    get_settings.cache_clear()
    c = db.connect()
    for pid, name in ((MARIO, "Mario"), (LUIS, "Luis")):
        c.execute("INSERT INTO payers (id, display_name, phone, pubkey_jwk, daily_cap_cents, created_at)"
                  " VALUES (?,?,?,?,?,?)", (pid, name, "5500000001", "{}", 30000, NOW))
    for mid, name in ((LUPITA, "Tienda Lupita"), (OTRA, "Otra tienda")):
        c.execute("INSERT INTO merchants (id, name, lat, lon, pubkey_jwk, created_at) VALUES (?,?,?,?,?,?)",
                  (mid, name, 19.3, -99.1, "{}", NOW))
    rows = [  # id, payer, merchant, amount, counter, status, alerts
        ("D1", MARIO, LUPITA, 2500, 17, "REGISTRADA", []),
        ("D2", LUIS, LUPITA, 1000, 4, "PAGADA", []),
        ("D3", LUIS, LUPITA, 700, 18, "RECHAZADA", ["doble gasto: contador 18 usado en dos comercios"]),
        ("D4", LUIS, OTRA, 99900, 9, "REGISTRADA", []),  # another merchant: must never leak
    ]
    for did, p, m, amt, ctr, st, al in rows:
        c.execute("INSERT INTO debts (id, payer_id, merchant_id, amount_cents, counter, iou_json, status,"
                  " alerts_json, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
                  (did, p, m, amt, ctr, "{}", st, json.dumps(al), NOW))
    c.commit()
    yield c
    c.close()
    get_settings.cache_clear()
    app.dependency_overrides.clear()


class FakeClient:
    """Scripted model: calls the given tools, then returns `texto` (or raises)."""

    def __init__(self, texto="", calls=(), error=None):
        self.texto, self.calls, self.error = texto, list(calls), error
        self.seen_tools: list[dict] = []
        self.tool_results: list[dict] = []

    def ask(self, *, model, instructions, question, tools, run_tool):
        self.seen_tools = tools
        if self.error:
            raise self.error
        for name, args in self.calls:
            self.tool_results.append(run_tool(name, args))
        return self.texto


def digits(text):
    return set(re.findall(r"\d+", text))


def dump(conn):
    return {t: [tuple(r) for r in conn.execute(f"SELECT * FROM {t} ORDER BY 1")]
            for t in ("payers", "merchants", "debts", "attempts")}


def test_answers_who_owes_from_records_only(conn):
    fake = FakeClient("Te debe {deudores}. En total son {total_pendiente}.", [("listar_deudas", {"merchant_id": LUPITA})])
    r = assistant.ask(conn, LUPITA, "¿quién me debe?", fake)
    assert r.fuente == "openai"
    assert "Mario" in r.texto and "$25.00" in r.texto
    assert "Luis" not in r.texto  # Luis's debt is paid or rejected
    assert r.herramientas == ["listar_deudas"]
    assert digits(r.texto) <= digits(" ".join(str(v) for v in r.cifras.values()))
    # The model never saw an amount: tool results carry only marker names.
    assert not any(re.search(r"\d", json.dumps(t)) for t in fake.tool_results)


def test_registers_only_read_only_tools(conn):
    names = {t["name"] for t in assistant.TOOL_SPECS}
    assert names == {"listar_deudas", "explicar_rechazo", "redactar_recordatorio"} == set(assistant.TOOLS)
    fake = FakeClient("Listo.", [])
    assistant.ask(conn, LUPITA, "¿quién me debe?", fake)
    assert {t["name"] for t in fake.seen_tools} == names
    for forbidden in ("firmar", "cobrar", "pey", "marcar", "pagar", "tope", "revocar"):
        assert not any(forbidden in n for n in names)
    before = dump(conn)  # running every tool changes nothing
    for name, args in (("listar_deudas", {"merchant_id": LUPITA}), ("explicar_rechazo", {"attack_id": "D3"}),
                       ("redactar_recordatorio", {"debt_id": "D1"})):
        assistant.TOOLS[name](conn, LUPITA, args)
    assert dump(conn) == before
    # A tool the model invents is refused, not executed.
    f2 = FakeClient("Listo.", [("cobrar_ahora", {"debt_id": "D1"})])
    assistant.ask(conn, LUPITA, "cóbrale a Mario", f2)
    assert "error" in f2.tool_results[0]
    assert dump(conn) == before


def test_discards_answer_with_numbers_not_in_records(conn):
    fake = FakeClient("Mario te debe 99 pesos desde hace 3 días.", [("listar_deudas", {"merchant_id": LUPITA})])
    r = assistant.ask(conn, LUPITA, "¿quién me debe?", fake)
    assert r.fuente == "plantilla"
    assert "99" not in r.texto and "$25.00" in r.texto and "Mario" in r.texto
    unknown = FakeClient("Te debe {inventado}.", [])
    assert assistant.ask(conn, LUPITA, "¿quién me debe?", unknown).fuente == "plantilla"


def test_falls_back_to_template_when_openai_fails(conn):
    for client in (FakeClient(error=TimeoutError("slow")), None):
        r = assistant.ask(conn, LUPITA, "¿quién me debe?", client)
        assert r.fuente == "plantilla" and "Mario" in r.texto and "$25.00" in r.texto
    r = assistant.ask(conn, LUPITA, "¿por qué rechazó el pagaré #18?", None)
    assert r.fuente == "plantilla" and "doble gasto" in r.texto
    r = assistant.ask(conn, LUPITA, "redáctame un recordatorio para Mario", None)
    assert "Mario" in r.texto and "$25.00" in r.texto and r.herramientas == ["redactar_recordatorio"]


def test_tools_are_scoped_to_the_request_merchant(conn):
    fake = FakeClient("Son {total_pendiente}.", [("listar_deudas", {"merchant_id": OTRA})])  # model asks for another shop
    r = assistant.ask(conn, LUPITA, "¿quién me debe?", fake)
    assert "$25.00" in r.texto and "999" not in r.texto
    assert assistant.TOOLS["explicar_rechazo"](conn, LUPITA, {"attack_id": "D4"}).get("error")


def test_assistant_endpoint(conn):
    app.dependency_overrides[assistant_router.get_client] = lambda: None
    client = TestClient(app)
    r = client.post("/api/asistente", json={"merchant_id": LUPITA, "pregunta": "¿quién me debe?"})
    assert r.status_code == 200
    body = r.json()
    assert body["fuente"] == "plantilla" and "Mario" in body["texto"] and body["herramientas"] == ["listar_deudas"]
    assert client.post("/api/asistente", json={"merchant_id": LUPITA, "pregunta": " "}).status_code == 422
    assert client.post("/api/asistente", json={"merchant_id": "nope", "pregunta": "hola"}).status_code == 404
