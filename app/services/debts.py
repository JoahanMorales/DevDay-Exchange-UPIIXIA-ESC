"""HACK-012 debts: sync pipeline, one live charge per debt, cascade, payment confirmation (IDEA §5.6–5.8).

State machine: REGISTRADA → COBRO_ENVIADO → PAGADA | VENCIDA; RECHAZADA for double spends;
DUPLICADA when a debt is paid twice (manual refund). PAGADA needs a tracking_key, and comes only from a
signature-verified webhook (`on_payment`, registered with webhooks) or a PAID poll (`poll`).
"""
from __future__ import annotations

import base64
import hashlib
import json
import sqlite3
import time
from datetime import UTC, datetime, timedelta

import httpx

from app.config import get_settings
from app.routers import webhooks
from app.schemas import models, protocol
from app.services import credentials, crypto, db
from app.services.pey import MIN_EXPIRATION, FakePey, HttpPey, PeyClient, charge_amount

_pey: PeyClient | None = None
LIVE = ("REGISTRADA", "COBRO_ENVIADO", "VENCIDA")


def set_pey(client: PeyClient | None) -> None:
    global _pey
    _pey = client


def get_pey() -> PeyClient:
    """Configured client: HttpPey with PEY_API_KEY, FakePey (demo) otherwise."""
    global _pey
    if _pey is None:
        s = get_settings()
        _pey = HttpPey(s.pey_api_key, s.pey_base_url) if s.pey_api_key else FakePey(["PENDING"])
    return _pey


def install() -> None:
    """Register the webhook handler once (webhooks.reset() clears handlers)."""
    if on_payment not in webhooks._handlers:
        webhooks.register_payment_handler(on_payment)


def _now(now: datetime | None) -> datetime:
    return now or datetime.now(UTC)


def _alert(conn: sqlite3.Connection, debt_id: str, text: str) -> None:
    row = conn.execute("SELECT alerts_json FROM debts WHERE id = ?", (debt_id,)).fetchone()
    alerts = json.loads(row["alerts_json"]) + [text]
    conn.execute("UPDATE debts SET alerts_json = ? WHERE id = ?", (json.dumps(alerts), debt_id))


def _iou_model(raw: bytes, sig: bytes, f: protocol.IouFields) -> models.Iou:
    return models.Iou(ver=f.ver, payer_id=f.payer_id, merchant_id=f.merchant_id, amount_cents=f.amount_cents,
                      counter=f.counter, ts=f.ts, nonce=f.nonce.hex(), lat=f.lat_e6 / protocol.CAP_SCALE,
                      lon=f.lon_e6 / protocol.CAP_SCALE, sig=base64.b64encode(sig).decode(),
                      raw=base64.b64encode(raw).decode())


def _insert(conn, envelope_id: str, iou: models.Iou, status: str, alerts: list[str]) -> str:
    debt_id = credentials.new_ulid()
    conn.execute(
        "INSERT INTO debts (id, envelope_id, payer_id, merchant_id, amount_cents, counter, iou_json, status,"
        " alerts_json, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
        (debt_id, envelope_id, iou.payer_id, iou.merchant_id, iou.amount_cents, iou.counter,
         iou.model_dump_json(), status, json.dumps(alerts), datetime.now(UTC).isoformat()))
    return debt_id


CLOCK_SKEW_S = 300


def _check_credential(conn: sqlite3.Connection, payer: sqlite3.Row, f: protocol.IouFields) -> str | None:
    """The payer's credential (credentials.issue at enrollment) must cover the IOU: signed no later than
    valid_until, not dated in the future, and within the daily cap (cap × reputation) of its UTC day."""
    issued = int(datetime.fromisoformat(payer["created_at"]).timestamp())
    if f.ts > issued + credentials.CREDENTIAL_TTL_S:
        return "expired"
    if f.ts > int(time.time()) + CLOCK_SKEW_S:
        return "bad_credential"
    day = f.ts - f.ts % 86400
    spent = conn.execute(
        "SELECT COALESCE(SUM(amount_cents), 0) AS s FROM debts WHERE payer_id = ? AND status != 'RECHAZADA'"
        " AND CAST(json_extract(iou_json, '$.ts') AS INTEGER) BETWEEN ? AND ?",
        (f.payer_id, day, day + 86399)).fetchone()["s"]
    if spent + f.amount_cents > int(payer["daily_cap_cents"] * payer["reputation_factor"]):
        return "cap_exceeded"
    return None


def _ingest(conn: sqlite3.Connection, env: models.Envelope, server_jwk: dict) -> str | None:
    """Returns None when accepted, "duplicate", or a RejectReason."""
    if conn.execute("SELECT 1 FROM debts WHERE envelope_id = ?", (env.envelope_id,)).fetchone():
        return "duplicate"
    try:
        signed = crypto.decrypt(server_jwk, env.epk, env.iv, env.ciphertext)
    except ValueError:
        return "bad_envelope"
    if len(signed) != protocol.SIGNED_IOU_LEN or hashlib.sha256(signed).hexdigest() != env.envelope_id:
        return "malformed"
    raw, sig = signed[: protocol.IOU_LEN], signed[protocol.IOU_LEN:]
    try:
        f = protocol.unpack_iou(raw)
    except ValueError:
        return "malformed"
    payer = conn.execute("SELECT pubkey_jwk, revoked, created_at, daily_cap_cents, reputation_factor FROM payers WHERE id = ?", (f.payer_id,)).fetchone()
    if payer is None:
        return "unknown_payer"
    if payer["revoked"]:
        return "revoked"
    if not conn.execute("SELECT 1 FROM merchants WHERE id = ?", (f.merchant_id,)).fetchone():
        return "unknown_merchant"
    if not crypto.verify_iou(json.loads(payer["pubkey_jwk"]), raw, sig):
        return "bad_sig"
    reason = _check_credential(conn, payer, f)
    if reason:
        return reason
    iou = _iou_model(raw, sig, f)
    prior = conn.execute("SELECT id, merchant_id FROM debts WHERE payer_id = ? AND counter = ? AND status !="
                         " 'RECHAZADA' ORDER BY created_at LIMIT 1", (f.payer_id, f.counter)).fetchone()
    if prior is not None:
        text = (f"doble gasto: contador {f.counter} usado en comercio {prior['merchant_id']}"
                f" y {f.merchant_id}")
        _insert(conn, env.envelope_id, iou, "RECHAZADA", [text])
        _alert(conn, prior["id"], text)
        return "counter_replay"
    _insert(conn, env.envelope_id, iou, "REGISTRADA", [])
    return None


def revocation_list(conn: sqlite3.Connection) -> models.RevocationList:
    revoked = [r["id"] for r in conn.execute("SELECT id FROM payers WHERE revoked = 1 ORDER BY id")]
    caps = {r["id"]: r["daily_cap_cents"] for r in conn.execute("SELECT id, daily_cap_cents FROM payers")}
    body = {"version": 1, "issued_at": int(time.time()), "revoked": revoked, "caps": caps}
    return models.RevocationList(**crypto.sign_credential(body))


def sync(conn: sqlite3.Connection, req: models.SyncRequest, pey: PeyClient | None = None) -> models.SyncResponse:
    server_jwk = crypto.server_private_jwk()
    accepted, duplicates, rejected = 0, 0, []
    for env in req.envelopes:
        reason = _ingest(conn, env, server_jwk)
        conn.commit()
        if reason == "duplicate":
            duplicates += 1
        elif reason:
            rejected.append(models.SyncRejected(envelope_id=env.envelope_id, reason=reason))
        else:
            accepted += 1
    for row in conn.execute("SELECT id FROM debts WHERE status = 'REGISTRADA'").fetchall():
        charge(conn, row["id"], pey or get_pey())
    return models.SyncResponse(accepted=accepted, duplicates=duplicates, rejected=rejected,
                               revocation_list=revocation_list(conn))


def _target_phone(conn, debt) -> str | None:
    payer = conn.execute("SELECT phone, backup_phone FROM payers WHERE id = ?", (debt["payer_id"],)).fetchone()
    return payer["backup_phone"] if debt["charge_target"] == "backup" else payer["phone"]


def charge(conn: sqlite3.Connection, debt_id: str, pey: PeyClient, now: datetime | None = None) -> bool:
    """Send a CoDi push unless the debt already has a live (ACTIVO) attempt. True if a push went out."""
    now = _now(now)
    debt = conn.execute("SELECT * FROM debts WHERE id = ?", (debt_id,)).fetchone()
    if debt is None or debt["status"] not in LIVE:
        return False
    if conn.execute("SELECT 1 FROM attempts WHERE debt_id = ? AND state = 'ACTIVO'", (debt_id,)).fetchone():
        return False
    phone = _target_phone(conn, debt)
    s = get_settings()
    amount = charge_amount(debt["amount_cents"] / 100, s.demo_real_amount if s.demo_mode else None)
    sent = now.isoformat()
    expires = (now + timedelta(seconds=MIN_EXPIRATION)).isoformat()
    try:
        res = pey.send_push(amount=amount, phone=phone, concept=f"SinSenal deuda {debt_id[-6:]}",
                            num_ref=str(debt["counter"] % 10_000_000), metadata={"debt_id": debt_id},
                            expiration=MIN_EXPIRATION)
    except (httpx.HTTPError, OSError, ValueError) as exc:  # pey down or refused: record it, retry later
        conn.execute("INSERT INTO attempts (debt_id, target_phone, sent_at, expires_at, state, error)"
                     " VALUES (?,?,?,?, 'FALLIDO', ?)", (debt_id, phone, sent, expires, exc.__class__.__name__))
        conn.commit()
        return False
    tx = res.get("transactionId")
    conn.execute("INSERT INTO attempts (debt_id, target_phone, sent_at, expires_at, state, pey_transaction_id)"
                 " VALUES (?,?,?,?, 'ACTIVO', ?)", (debt_id, phone, sent, expires, tx))
    conn.execute("UPDATE debts SET status = 'COBRO_ENVIADO', pey_transaction_id = ?, pey_codi_id = ?"
                 " WHERE id = ?", (tx, res.get("codiId"), debt_id))
    conn.commit()
    return True


def expire(conn: sqlite3.Connection, debt_id: str, pey: PeyClient, now: datetime | None = None) -> None:
    """Expire overdue attempts; cascade once to the backup payer, else leave the debt VENCIDA."""
    now = _now(now)
    n = conn.execute("UPDATE attempts SET state = 'EXPIRADO' WHERE debt_id = ? AND state = 'ACTIVO'"
                     " AND expires_at <= ?", (debt_id, now.isoformat())).rowcount
    debt = conn.execute("SELECT * FROM debts WHERE id = ?", (debt_id,)).fetchone()
    if not n or debt["status"] != "COBRO_ENVIADO":
        conn.commit()
        return
    if debt["charge_target"] == "payer" and _has_backup(conn, debt):
        conn.execute("UPDATE debts SET charge_target = 'backup' WHERE id = ?", (debt_id,))
        conn.commit()
        charge(conn, debt_id, pey, now)
        return
    conn.execute("UPDATE debts SET status = 'VENCIDA' WHERE id = ?", (debt_id,))
    conn.commit()


def _has_backup(conn, debt) -> bool:
    row = conn.execute("SELECT backup_phone FROM payers WHERE id = ?", (debt["payer_id"],)).fetchone()
    return bool(row and row["backup_phone"])


def mark_paid(conn: sqlite3.Connection, tx_id: str, tracking_key: str | None) -> str | None:
    """Apply a confirmed payment. Returns the new status, or None if ignored."""
    if not tracking_key:
        return None
    att = conn.execute("SELECT id, debt_id FROM attempts WHERE pey_transaction_id = ?", (tx_id,)).fetchone()
    if att is None:
        return None
    debt = conn.execute("SELECT * FROM debts WHERE id = ?", (att["debt_id"],)).fetchone()
    paid_tx = conn.execute("SELECT pey_transaction_id FROM attempts WHERE debt_id = ? AND state = 'PAGADO'",
                           (debt["id"],)).fetchone()
    if paid_tx is not None:
        if paid_tx["pey_transaction_id"] == tx_id:
            return debt["status"]  # same payment reported twice
        conn.execute("UPDATE attempts SET state = 'PAGADO' WHERE id = ?", (att["id"],))
        conn.execute("UPDATE debts SET status = 'DUPLICADA' WHERE id = ?", (debt["id"],))
        _alert(conn, debt["id"], f"pago duplicado {tx_id} ({tracking_key}): reembolso manual")
        conn.commit()
        return "DUPLICADA"
    conn.execute("UPDATE attempts SET state = 'PAGADO' WHERE id = ?", (att["id"],))
    conn.execute("UPDATE attempts SET state = 'EXPIRADO' WHERE debt_id = ? AND state = 'ACTIVO'", (debt["id"],))
    conn.execute("UPDATE debts SET status = 'PAGADA', tracking_key = ?, pey_transaction_id = ?, paid_at = ?"
                 " WHERE id = ?", (tracking_key, tx_id, datetime.now(UTC).isoformat(), debt["id"]))
    conn.commit()
    return "PAGADA"


def on_payment(tx_id: str, tracking_key: str | None, payload: dict) -> None:
    """Webhook handler: only called by webhooks.process after the signature is verified."""
    conn = db.connect()
    try:
        mark_paid(conn, tx_id, tracking_key)
    finally:
        conn.close()


def poll(conn: sqlite3.Connection, debt_id: str, pey: PeyClient) -> bool:
    """Polling fallback: ask pey about the live attempt; True if it is PAID with a tracking key."""
    att = conn.execute("SELECT pey_transaction_id FROM attempts WHERE debt_id = ? AND state = 'ACTIVO'"
                       " AND pey_transaction_id IS NOT NULL", (debt_id,)).fetchone()
    if att is None:
        return False
    tx = pey.get_transaction(att["pey_transaction_id"])
    if tx.get("status") != "PAID":
        return False
    tracking = tx.get("trackingKey") or (tx.get("metadata") or {}).get("trackingKey")
    return mark_paid(conn, att["pey_transaction_id"], tracking) in ("PAGADA", "DUPLICADA")


def get_debt(conn: sqlite3.Connection, debt_id: str) -> models.Debt | None:
    row = conn.execute("SELECT * FROM debts WHERE id = ?", (debt_id,)).fetchone()
    return _to_model(conn, row) if row else None


def list_debts(conn: sqlite3.Connection, merchant_id: str | None = None) -> list[models.Debt]:
    q, args = "SELECT * FROM debts", ()
    if merchant_id:
        q, args = q + " WHERE merchant_id = ?", (merchant_id,)
    return [_to_model(conn, r) for r in conn.execute(q + " ORDER BY created_at DESC", args).fetchall()]


def _to_model(conn, row) -> models.Debt:
    attempts = [models.ChargeAttempt(target_phone=a["target_phone"], sent_at=a["sent_at"],
                                     expires_at=a["expires_at"], state=a["state"],
                                     pey_transaction_id=a["pey_transaction_id"], error=a["error"])
                for a in conn.execute("SELECT * FROM attempts WHERE debt_id = ? ORDER BY id", (row["id"],))]
    return models.Debt(id=row["id"], iou=models.Iou.model_validate_json(row["iou_json"]), status=row["status"],
                       charge_target=row["charge_target"], pey_transaction_id=row["pey_transaction_id"],
                       pey_codi_id=row["pey_codi_id"], tracking_key=row["tracking_key"], paid_at=row["paid_at"],
                       attempts=attempts, alerts=json.loads(row["alerts_json"]))
