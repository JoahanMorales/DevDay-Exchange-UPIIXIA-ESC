"""Sync alerts for the dashboard (HACK-033, IDEA §7: Decisions API when the sources conflict on status).

The rules decide WHICH alerts exist and their kind/state (from the debts and payers tables). The model, if reachable, may
only RAISE the urgency of an alert (priority alta/media/baja); it can never drop, add, rename or demote one, and the label
is always the rule's Spanish line (no free model text reaches the screen). Any error, refusal or missing client leaves the
rule priorities. Phone numbers and amounts are not sent to the model.
"""
from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass, replace
from typing import Protocol

DECISIONS_MODEL = "gpt-6-luna"  # the only model the Decisions API accepts (openai SDK 3.46.0)
_LEVEL = {"alta": 1, "media": 2, "baja": 3}

# kind -> (priority 1 = most urgent, one-line Spanish label)
RULES: dict[str, tuple[int, str]] = {
    "doble_gasto": (1, "Doble gasto: el pagaré se rechazó y el pagador quedó revocado."),
    "pago_duplicado": (1, "Pago duplicado: hay que devolver un pago por transferencia."),
    "pagador_revocado": (2, "Pagador revocado: su tope diario quedó en cero."),
    "cobro_vencido": (3, "Cobro vencido: se reintenta más tarde o con el pagador de respaldo."),
}


@dataclass(frozen=True)
class Alert:
    id: str
    kind: str
    priority: int
    label: str
    debt_id: str | None = None
    payer_id: str | None = None


class Ranker(Protocol):
    def rank(self, found: list[Alert]) -> dict[str, str]: ...


def _make(kind: str, ref: str, debt_id: str | None = None, payer_id: str | None = None) -> Alert:
    prio, text = RULES[kind]
    return Alert(f"{kind}:{ref}", kind, prio, text, debt_id, payer_id)


def detect(conn: sqlite3.Connection) -> list[Alert]:
    """Deterministic: what happened, from the records. Sorted by (priority, id)."""
    found: list[Alert] = []
    for d in conn.execute("SELECT id, payer_id, status, alerts_json FROM debts WHERE status IN"
                          " ('RECHAZADA','DUPLICADA','VENCIDA') ORDER BY id"):
        if d["status"] == "RECHAZADA":
            if any("doble gasto" in a for a in json.loads(d["alerts_json"])):
                found.append(_make("doble_gasto", d["id"], d["id"], d["payer_id"]))
        elif d["status"] == "DUPLICADA":
            found.append(_make("pago_duplicado", d["id"], d["id"], d["payer_id"]))
        else:
            found.append(_make("cobro_vencido", d["id"], d["id"], d["payer_id"]))
    for p in conn.execute("SELECT id FROM payers WHERE revoked = 1 ORDER BY id"):
        found.append(_make("pagador_revocado", p["id"], None, p["id"]))
    return sorted(found, key=lambda a: (a.priority, a.id))


def label(found: list[Alert], ranker: Ranker | None) -> list[Alert]:
    """Same alerts, rule labels; the model may only raise urgency. Falls back to the rules on any failure."""
    asked: dict[str, str] = {}
    if ranker is not None and found:
        try:
            asked = ranker.rank(found)
        except Exception:  # noqa: BLE001 - any API/network failure must fall back to the rules
            asked = {}
    out = []
    for a in found:
        level = _LEVEL.get(asked.get(a.id, "")) if isinstance(asked, dict) else None
        out.append(replace(a, priority=min(a.priority, level)) if level else a)
    return sorted(out, key=lambda a: (a.priority, a.id))


class DecisionsRanker:
    """Real ranker: one `choice` question per alert through client.decisions.create (not exercised without a key)."""

    def __init__(self, client) -> None:
        self._client = client

    def rank(self, found: list[Alert]) -> dict[str, str]:
        text = "\n".join(f"{i + 1}. {a.kind}: {a.label}" for i, a in enumerate(found))
        questions = [{
            "type": "choice", "name": a.id,
            "instructions": "Para el dueño de una tienda, ¿qué tan urgente es atender esta alerta (alta, media o baja)?",
            "choices": [{"value": "alta", "description": "hay dinero en riesgo ahora"},
                        {"value": "media", "description": "atender hoy"},
                        {"value": "baja", "description": "puede esperar"}],
        } for a in found]
        res = self._client.decisions.create(input=f"Alertas de la sincronización de hoy:\n{text}",
                                            model=DECISIONS_MODEL, questions=questions)
        return {a.id: ans.choice for a, ans in zip(found, res.answers, strict=False)
                if getattr(ans, "type", "") == "choice" and ans.choice in _LEVEL}
