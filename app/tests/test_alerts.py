"""HACK-033: sync alerts. Rules decide the alert; the model may only raise urgency (IDEA §7)."""
import json
from datetime import UTC, datetime
from types import SimpleNamespace

import pytest

from app.config import get_settings
from app.services import alerts, credentials, db

NOW = datetime(2026, 11, 8, 12, 0, tzinfo=UTC).isoformat()
P1, P2, P3, M = (credentials.new_ulid() for _ in range(4))


@pytest.fixture
def conn(monkeypatch, tmp_path):
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "t.db"))
    get_settings.cache_clear()
    c = db.connect()
    for pid, name, revoked in ((P1, "Mario", 0), (P2, "Luis", 0), (P3, "Ana", 1)):
        c.execute("INSERT INTO payers (id, display_name, phone, pubkey_jwk, daily_cap_cents, revoked, created_at)"
                  " VALUES (?,?,?,?,?,?,?)", (pid, name, "5500000001", "{}", 30000, revoked, NOW))
    c.execute("INSERT INTO merchants (id, name, lat, lon, pubkey_jwk, created_at) VALUES (?,?,?,?,?,?)",
              (M, "Tienda", 19.3, -99.1, "{}", NOW))
    rows = [("D1", P1, "RECHAZADA", ["doble gasto: contador 5 usado en dos comercios"]), ("D2", P2, "DUPLICADA", []),
            ("D3", P1, "VENCIDA", []), ("D4", P2, "PAGADA", []), ("D5", P1, "REGISTRADA", [])]
    for i, (did, p, st, al) in enumerate(rows):
        c.execute("INSERT INTO debts (id, payer_id, merchant_id, amount_cents, counter, iou_json, status, alerts_json,"
                  " created_at) VALUES (?,?,?,?,?,?,?,?,?)", (did, p, M, 2500, i, "{}", st, json.dumps(al), NOW))
    c.commit()
    yield c
    c.close()
    get_settings.cache_clear()


class FakeRanker:
    def __init__(self, answer=None, error=None):
        self.answer, self.error, self.calls = answer or {}, error, 0

    def rank(self, found):
        self.calls += 1
        if self.error:
            raise self.error
        return self.answer(found) if callable(self.answer) else self.answer


KINDS = {"doble_gasto", "pago_duplicado", "cobro_vencido", "pagador_revocado"}


def test_rule_decides_alert_even_when_model_disagrees(conn):
    base = alerts.detect(conn)
    assert {a.kind for a in base} == KINDS and len(base) == 4  # the paid and the pending debts raise nothing
    # The model drops one, invents one, and tries to demote the double spend to "baja".
    ranker = FakeRanker(lambda found: {found[0].id: "baja", "fantasma": "alta", "otra": "descartar"})
    out = alerts.label(base, ranker)
    assert sorted(a.id for a in out) == sorted(a.id for a in base)  # same alerts, nothing added or removed
    assert {a.kind for a in out} == KINDS
    by = {a.kind: a for a in out}
    assert by["doble_gasto"].priority == 1  # never less urgent than the rule says
    assert by["doble_gasto"].priority <= alerts.RULES["doble_gasto"][0]
    # The model may raise urgency: an expired charge promoted to "alta".
    up = alerts.label(base, FakeRanker(lambda found: {a.id: "alta" for a in found if a.kind == "cobro_vencido"}))
    assert {a.kind: a for a in up}["cobro_vencido"].priority == 1
    assert all(a.label for a in out) and all(not any(ch.isdigit() for ch in a.label) for a in out)  # labels are rule text
    assert out == sorted(out, key=lambda a: (a.priority, a.id))  # ordered by urgency


def test_falls_back_to_rule_labels_when_api_unavailable(conn):
    base = alerts.detect(conn)
    expected = alerts.label(base, None)
    assert all(a.label == alerts.RULES[a.kind][1] and a.priority == alerts.RULES[a.kind][0] for a in expected)
    for ranker in (FakeRanker(error=TimeoutError("down")), FakeRanker(error=RuntimeError("404 not available"))):
        assert alerts.label(base, ranker) == expected
        assert ranker.calls == 1


def test_decisions_ranker_maps_choice_answers(conn):
    found = alerts.detect(conn)
    seen = {}

    def create(**kw):
        seen.update(kw)
        answers = [SimpleNamespace(type="choice", choice="alta") for _ in kw["questions"]]
        answers[0] = SimpleNamespace(type="refusal")  # a refusal is ignored, not trusted
        return SimpleNamespace(answers=answers)

    ranker = alerts.DecisionsRanker(SimpleNamespace(decisions=SimpleNamespace(create=create)))
    got = ranker.rank(found)
    assert seen["model"] == alerts.DECISIONS_MODEL == "gpt-6-luna"
    assert len(seen["questions"]) == len(found) and all(q["type"] == "choice" for q in seen["questions"])
    assert found[0].id not in got and len(got) == len(found) - 1 and set(got.values()) == {"alta"}
    assert "5500000001" not in json.dumps(seen["input"])  # no phone numbers leave the server
