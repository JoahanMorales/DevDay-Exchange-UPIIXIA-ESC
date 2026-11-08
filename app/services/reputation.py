"""Reputation and caps (IDEA §5.8-5.9): deterministic, explainable, never decided by an LLM.

    daily_cap = base × factor          base = $300 (phone) / $100 (band), in cents
    factor    = 1.0 at enrollment, +0.1 per debt paid within 48 h (max 2.0)
              = 0   with a debt unpaid for more than 7 days, or a detected double spend (revoked)

`payers.daily_cap_cents` stays the BASE; the effective cap is `base × reputation_factor` (debts._check_credential
uses the same product). `rep_version` grows every time factor or revocation changes, so the signed list's
`version` is monotonic and clients keep the newest one.
"""
from __future__ import annotations

import json
import sqlite3
from datetime import UTC, datetime, timedelta

from app.schemas import models
from app.services import crypto

BASE_CAP_CENTS = {"phone": 30000, "band": 10000}
BONUS_PER_FAST_PAYMENT = 0.1
MAX_FACTOR = 2.0
FAST_PAYMENT = timedelta(hours=48)
OVERDUE = timedelta(days=7)
_UNPAID = ("REGISTRADA", "COBRO_ENVIADO", "VENCIDA")


def _dt(s: str) -> datetime:
    d = datetime.fromisoformat(s)
    return d if d.tzinfo else d.replace(tzinfo=UTC)


def effective_cap(base_cents: int, factor: float) -> int:
    return round(base_cents * factor)


def recompute(conn: sqlite3.Connection, payer_id: str, now: datetime | None = None) -> models.ReputationResponse:
    """Recalculate one payer from their debts, persist it (and revoke on double spend), explain why."""
    now = now or datetime.now(UTC)
    p = conn.execute("SELECT * FROM payers WHERE id = ?", (payer_id,)).fetchone()
    if p is None:
        raise KeyError(payer_id)
    debts = conn.execute("SELECT status, created_at, paid_at, alerts_json FROM debts WHERE payer_id = ?",
                         (payer_id,)).fetchall()
    reasons: list[str] = []
    double_spend = bool(p["revoked"]) or any(
        d["status"] == "RECHAZADA" and any("doble gasto" in a for a in json.loads(d["alerts_json"])) for d in debts)
    overdue = sum(1 for d in debts if d["status"] in _UNPAID and now - _dt(d["created_at"]) > OVERDUE)
    fast = sum(1 for d in debts if d["status"] == "PAGADA" and d["paid_at"]
               and _dt(d["paid_at"]) - _dt(d["created_at"]) <= FAST_PAYMENT)

    if double_spend:
        factor = 0.0
        reasons.append("Se detectó doble gasto: pagador revocado, tope en cero en toda la red.")
    elif overdue:
        factor = 0.0
        reasons.append(f"{overdue} {'deuda' if overdue == 1 else 'deudas'} sin pagar por más de 7 días: tope en cero.")
    else:
        factor = round(min(MAX_FACTOR, 1.0 + BONUS_PER_FAST_PAYMENT * fast), 1)
        reasons.append(f"{fast} {'deuda pagada' if fast == 1 else 'deudas pagadas'} en menos de 48 h: "
                       f"factor {factor:.1f} (empieza en 1.0, +0.1 por pago a tiempo, máximo 2.0).")

    revoked = 1 if double_spend else int(p["revoked"])
    if factor != p["reputation_factor"] or revoked != p["revoked"]:
        conn.execute("UPDATE payers SET reputation_factor = ?, revoked = ?, rep_version = rep_version + 1"
                     " WHERE id = ?", (factor, revoked, payer_id))
        conn.commit()
    cap = effective_cap(p["daily_cap_cents"], factor)
    reasons.append(f"Tope diario: ${p['daily_cap_cents'] / 100:.0f} base × {factor:.1f} = ${cap / 100:.0f}.")
    return models.ReputationResponse(payer_id=payer_id, factor=factor, daily_cap_cents=cap, reasons=reasons)


def recompute_all(conn: sqlite3.Connection, now: datetime | None = None) -> None:
    for r in conn.execute("SELECT id FROM payers").fetchall():
        recompute(conn, r["id"], now)


def revocation_list(conn: sqlite3.Connection, now: datetime | None = None) -> models.RevocationList:
    """Server-signed list that travels phone to phone: revoked payers and effective caps per payer.
    `version` = sum of every payer's rep_version, so it only ever grows."""
    now = now or datetime.now(UTC)
    rows = conn.execute("SELECT id, daily_cap_cents, reputation_factor, rep_version, revoked FROM payers"
                        " ORDER BY id").fetchall()
    body = {
        "version": sum(r["rep_version"] for r in rows),
        "issued_at": int(now.timestamp()),
        "revoked": [r["id"] for r in rows if r["revoked"]],
        "caps": {r["id"]: 0 if r["revoked"] else effective_cap(r["daily_cap_cents"], r["reputation_factor"])
                 for r in rows},
    }
    return models.RevocationList(**crypto.sign_credential(body))
