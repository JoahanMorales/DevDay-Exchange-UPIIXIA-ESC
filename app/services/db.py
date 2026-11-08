"""SQLite at DATABASE_PATH, shared by every backend task. JWKs and JSON payloads are TEXT."""
from __future__ import annotations

import sqlite3

from app.config import get_settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS payers (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    pubkey_jwk TEXT NOT NULL,
    backup_payer_id TEXT REFERENCES payers(id),
    backup_phone TEXT,
    kind TEXT NOT NULL DEFAULT 'phone',
    band_uid TEXT,
    daily_cap_cents INTEGER NOT NULL,
    reputation_factor REAL NOT NULL DEFAULT 1.0,
    rep_version INTEGER NOT NULL DEFAULT 1,
    revoked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS merchants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    pubkey_jwk TEXT NOT NULL,
    pey_bank_account_id TEXT,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS debts (
    id TEXT PRIMARY KEY,
    envelope_id TEXT UNIQUE,
    payer_id TEXT NOT NULL REFERENCES payers(id),
    merchant_id TEXT NOT NULL REFERENCES merchants(id),
    amount_cents INTEGER NOT NULL,
    counter INTEGER NOT NULL,
    iou_json TEXT NOT NULL,
    status TEXT NOT NULL,
    charge_target TEXT NOT NULL DEFAULT 'payer',
    pey_transaction_id TEXT,
    pey_codi_id TEXT,
    tracking_key TEXT,
    paid_at TEXT,
    alerts_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS debts_payer_counter ON debts(payer_id, counter);
CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    debt_id TEXT NOT NULL REFERENCES debts(id),
    target_phone TEXT NOT NULL,
    sent_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    state TEXT NOT NULL,
    pey_transaction_id TEXT,
    error TEXT
);
CREATE TABLE IF NOT EXISTS webhook_events (
    webhook_id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    received_at TEXT NOT NULL,
    payload_json TEXT NOT NULL
);
"""


def connect(path: str | None = None) -> sqlite3.Connection:
    """New connection with the schema applied; rows behave like dicts."""
    conn = sqlite3.connect(path or get_settings().database_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(SCHEMA)
    return conn
