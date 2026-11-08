"""Pydantic models for every entity and endpoint body of IDEA §6 (contract HACK-003)."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Ulid = str  # 26-char Crockford base32
Phone10 = Field(pattern=r"^\d{10}$")

DebtStatus = Literal["REGISTRADA", "COBRO_ENVIADO", "PAGADA", "VENCIDA", "DUPLICADA", "RECHAZADA"]
AttemptState = Literal["ACTIVO", "EXPIRADO", "PAGADO", "FALLIDO"]
AttackKind = Literal["replay", "bad_sig", "distance", "counter", "cap", "revoked"]
RejectReason = Literal[
    "bad_sig", "bad_credential", "bad_envelope", "expired", "counter_replay", "cap_exceeded",
    "revoked", "unknown_payer", "unknown_merchant", "malformed",
]


class _Model(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Payer(_Model):
    id: Ulid
    display_name: str
    phone: str = Phone10
    pubkey_jwk: dict
    backup_payer_id: Ulid | None = None
    kind: Literal["phone", "band"] = "phone"
    band_uid: str | None = None
    daily_cap_cents: int = Field(ge=0)
    reputation_factor: float = Field(default=1.0, ge=0, le=2.0)
    created_at: datetime


class Merchant(_Model):
    id: Ulid
    name: str
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    pubkey_jwk: dict
    pey_bank_account_id: str | None = None


class Credential(_Model):
    subject_id: Ulid
    subject_type: Literal["payer", "merchant"]
    pubkey_jwk: dict
    daily_cap_cents: int = Field(ge=0)
    valid_until: int
    rep_version: int = 0
    server_sig: str  # b64 raw r||s over canonical JSON of the other fields (docs/protocolo.md)


class Challenge(_Model):
    merchant_id: Ulid
    nonce: str = Field(pattern=r"^[0-9a-f]{16}$")
    ts: int
    lat: float
    lon: float
    amount_cents: int = Field(gt=0)
    merchant_sig: str


class Iou(_Model):
    ver: int = 1
    payer_id: Ulid
    merchant_id: Ulid
    amount_cents: int = Field(gt=0)
    counter: int = Field(ge=0)
    ts: int
    nonce: str = Field(pattern=r"^[0-9a-f]{16}$")
    lat: float
    lon: float
    sig: str  # b64 raw r||s, 64 bytes
    raw: str  # b64, the 61 signed bytes


class Envelope(_Model):
    envelope_id: str = Field(pattern=r"^[0-9a-f]{64}$")  # sha256 hex of the 125-byte signed IOU
    epk: str
    iv: str
    ciphertext: str
    hops: int = Field(default=0, ge=0)
    created_at: int
    ttl_s: int = 7 * 24 * 3600


class ChargeAttempt(_Model):
    target_phone: str = Phone10
    sent_at: datetime
    expires_at: datetime
    state: AttemptState
    pey_transaction_id: str | None = None
    error: str | None = None


class Debt(_Model):
    id: str
    iou: Iou
    status: DebtStatus
    charge_target: Literal["payer", "backup"] = "payer"
    pey_transaction_id: str | None = None
    pey_codi_id: str | None = None
    tracking_key: str | None = None
    paid_at: datetime | None = None
    attempts: list[ChargeAttempt] = []
    alerts: list[str] = []


class RevocationList(_Model):
    version: int
    issued_at: int
    revoked: list[Ulid]
    caps: dict[str, int]
    server_sig: str


class WebhookEvent(_Model):
    webhook_id: str
    type: str
    received_at: datetime
    payload: dict


class AttackLog(_Model):
    ts: int
    kind: AttackKind
    detail: str


# --- request / response bodies ------------------------------------------------------------

class PayerCreate(_Model):
    display_name: str
    phone: str = Phone10
    pubkey_jwk: dict
    backup_phone: str | None = None
    kind: Literal["phone", "band"] = "phone"
    band_uid: str | None = None


class PayerCreated(_Model):
    payer: Payer
    credential: Credential


class MerchantCreate(_Model):
    name: str
    lat: float
    lon: float
    pubkey_jwk: dict
    pey_bank_account_id: str | None = None


class MerchantCreated(_Model):
    merchant: Merchant
    credential: Credential


class ServerKeyResponse(_Model):
    pubkey_jwk: dict


class SyncRequest(_Model):
    envelopes: list[Envelope] = Field(max_length=200)


class SyncRejected(_Model):
    envelope_id: str
    reason: RejectReason


class SyncResponse(_Model):
    accepted: int = Field(ge=0)
    duplicates: int = Field(ge=0)
    rejected: list[SyncRejected]
    revocation_list: RevocationList


class DebtList(_Model):
    debts: list[Debt]


class PlanBRequest(_Model):
    canal: Literal["qr", "liga"]


class PlanBResponse(_Model):
    canal: Literal["qr", "liga"]
    payload: str  # CoDi QR payload or payment link


class ReputationResponse(_Model):
    payer_id: Ulid
    factor: float
    daily_cap_cents: int
    reasons: list[str]  # deterministic, human-readable (IDEA §5.9)


class DebtEvent(_Model):
    """One SSE message of GET /api/deudas/{id}/eventos."""
    debt_id: str
    status: DebtStatus
    at: datetime
    detail: str | None = None


class ExplainResponse(_Model):
    texto: str
    cifras: dict[str, int | float | str]  # only values copied from records, never model-made
    fuente: Literal["openai", "plantilla"]


class SimulatePaymentResponse(_Model):
    debt_id: str
    status: DebtStatus
    demo_data: Literal[True] = True
