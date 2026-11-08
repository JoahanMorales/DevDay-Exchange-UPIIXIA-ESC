"""Demo seed (HACK-029): wipe and re-enroll the synthetic personas of IDEA §3 with fresh keys."""
from __future__ import annotations

import sqlite3

from cryptography.hazmat.primitives.asymmetric import ec

from app.schemas import models, protocol
from app.services import credentials

# Synthetic data only: 55 0000 00xx phones are not real numbers; coordinates are San Lucas, Coyoacán.
MERCHANT = {"name": "Tienda Lupita", "lat": 19.3210, "lon": -99.1670}
LUIS = {"display_name": "Luis", "phone": "5500000003"}
MARIO = {"display_name": "Mario", "phone": "5500000002"}
CARMEN = {"display_name": "Doña Carmen", "phone": "5500000004", "kind": "band",
          "band_uid": "04DEMO0000CA01", "backup_phone": LUIS["phone"]}


def _keypair() -> dict:
    return protocol.jwk_from_private(ec.generate_private_key(ec.SECP256R1()))


def _wipe(conn: sqlite3.Connection) -> None:
    conn.execute("DELETE FROM attempts")
    conn.execute("DELETE FROM debts")
    conn.execute("UPDATE payers SET backup_payer_id = NULL")
    conn.execute("DELETE FROM payers")
    conn.execute("DELETE FROM merchants")
    conn.commit()


def reset(conn: sqlite3.Connection) -> dict:
    """Return each persona with its credential and the private JWK its demo device loads."""
    _wipe(conn)
    merchant_key = _keypair()
    merchant = credentials.enroll_merchant(conn, models.MerchantCreate(**MERCHANT, pubkey_jwk=merchant_key))
    payers = []
    for persona in (LUIS, MARIO, CARMEN):  # Luis first: Doña Carmen's backup is resolved by his phone
        key = _keypair()
        created = credentials.enroll_payer(conn, models.PayerCreate(**persona, pubkey_jwk=key))
        payers.append({**created.model_dump(mode="json"), "private_jwk": key})
    return {"merchant": {**merchant.model_dump(mode="json"), "private_jwk": merchant_key},
            "payers": payers}
