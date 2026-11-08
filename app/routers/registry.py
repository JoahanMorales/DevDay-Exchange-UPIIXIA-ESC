"""Registry: server public key and payer/merchant enrollment."""
from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.schemas import models
from app.services import credentials, crypto, db

router = APIRouter(prefix="/api", tags=["registry"])


def get_db() -> Iterator[sqlite3.Connection]:
    conn = db.connect()
    try:
        yield conn
    finally:
        conn.close()


Db = Annotated[sqlite3.Connection, Depends(get_db)]


def _server_ready() -> None:
    try:
        crypto.server_private_jwk()
    except (crypto.ServerKeyMissing, ValueError, KeyError, TypeError) as exc:
        raise HTTPException(503, f"server key unavailable: {exc}") from exc


@router.get("/server-key", response_model=models.ServerKeyResponse)
def server_key() -> models.ServerKeyResponse:
    _server_ready()
    return models.ServerKeyResponse(pubkey_jwk=crypto.server_public_jwk())


@router.post("/payers", response_model=models.PayerCreated)
def create_payer(req: models.PayerCreate, conn: Db):
    _server_ready()
    try:
        return credentials.enroll_payer(conn, req)
    except (ValueError, KeyError) as exc:
        raise HTTPException(422, f"invalid pubkey_jwk: {exc}") from exc


@router.post("/merchants", response_model=models.MerchantCreated)
def create_merchant(req: models.MerchantCreate, conn: Db):
    _server_ready()
    try:
        return credentials.enroll_merchant(conn, req)
    except (ValueError, KeyError) as exc:
        raise HTTPException(422, f"invalid pubkey_jwk: {exc}") from exc
