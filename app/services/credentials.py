"""Enrollment: payers and merchants get an id and a server-signed credential (IDEA §5.2)."""
from __future__ import annotations

import json
import os
import sqlite3
import time
from datetime import UTC, datetime

from app.schemas import models, protocol
from app.services import crypto

PHONE_CAP_CENTS = 30_000  # $300/day phone (IDEA §5.2, §5.7)
BAND_CAP_CENTS = 10_000  # $100/day, passive NFC band
CREDENTIAL_TTL_S = 24 * 3600
REP_VERSION = 1


def new_ulid() -> str:
    return protocol.bytes_to_ulid(int(time.time() * 1000).to_bytes(6, "big") + os.urandom(10))


def issue(subject_id: str, subject_type: str, pubkey_jwk: dict, cap: int, now: int | None = None
          ) -> models.Credential:
    body = {"subject_id": subject_id, "subject_type": subject_type, "pubkey_jwk": pubkey_jwk,
            "daily_cap_cents": cap, "valid_until": int(now or time.time()) + CREDENTIAL_TTL_S,
            "rep_version": REP_VERSION}
    return models.Credential(**crypto.sign_credential(body))


def enroll_payer(conn: sqlite3.Connection, req: models.PayerCreate) -> models.PayerCreated:
    pub = crypto.public_jwk(req.pubkey_jwk)
    cap = BAND_CAP_CENTS if req.kind == "band" else PHONE_CAP_CENTS
    backup_id = None
    if req.backup_phone:
        row = conn.execute("SELECT id FROM payers WHERE phone = ? ORDER BY created_at LIMIT 1",
                           (req.backup_phone,)).fetchone()
        backup_id = row["id"] if row else None
    payer = models.Payer(id=new_ulid(), display_name=req.display_name, phone=req.phone, pubkey_jwk=pub,
                         backup_payer_id=backup_id, kind=req.kind, band_uid=req.band_uid,
                         daily_cap_cents=cap, created_at=datetime.now(UTC))
    cred = issue(payer.id, "payer", pub, cap)  # signs before writing: no row without a credential
    conn.execute(
        "INSERT INTO payers (id, display_name, phone, pubkey_jwk, backup_payer_id, backup_phone, kind,"
        " band_uid, daily_cap_cents, rep_version, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        (payer.id, payer.display_name, payer.phone, json.dumps(pub), backup_id, req.backup_phone,
         payer.kind, payer.band_uid, cap, REP_VERSION, payer.created_at.isoformat()))
    conn.commit()
    return models.PayerCreated(payer=payer, credential=cred)


def enroll_merchant(conn: sqlite3.Connection, req: models.MerchantCreate) -> models.MerchantCreated:
    pub = crypto.public_jwk(req.pubkey_jwk)
    merchant = models.Merchant(id=new_ulid(), name=req.name, lat=req.lat, lon=req.lon, pubkey_jwk=pub,
                               pey_bank_account_id=req.pey_bank_account_id)
    cred = issue(merchant.id, "merchant", pub, 0)
    conn.execute(
        "INSERT INTO merchants (id, name, lat, lon, pubkey_jwk, pey_bank_account_id, created_at)"
        " VALUES (?,?,?,?,?,?,?)",
        (merchant.id, merchant.name, merchant.lat, merchant.lon, json.dumps(pub),
         merchant.pey_bank_account_id, datetime.now(UTC).isoformat()))
    conn.commit()
    return models.MerchantCreated(merchant=merchant, credential=cred)
