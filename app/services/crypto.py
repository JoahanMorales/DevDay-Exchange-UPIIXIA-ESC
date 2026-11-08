"""Server-side crypto: IOU verification, server-signed credentials, envelope decryption.

Thin wrapper over `app.schemas.protocol` (contract HACK-003); vectors in app/fixtures/sinsenal.
"""
from __future__ import annotations

import base64
import binascii
import json

from app.config import get_settings
from app.schemas import protocol

PUBLIC_JWK_FIELDS = ("kty", "crv", "x", "y")


class ServerKeyMissing(RuntimeError):
    pass


def canonical(body: dict) -> bytes:
    """Canonical JSON signed by the server (must match gen_vectors.py byte for byte)."""
    return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def public_jwk(jwk: dict) -> dict:
    """Validated public-only JWK (drops `d` and any extra field). Raises ValueError if invalid."""
    pub = {k: jwk[k] for k in PUBLIC_JWK_FIELDS if k in jwk}
    if len(pub) != len(PUBLIC_JWK_FIELDS):
        raise ValueError("JWK needs kty, crv, x and y")
    protocol.public_key_from_jwk(pub)  # raises on a non-P-256 key or a point off the curve
    return pub


def server_private_jwk() -> dict:
    """`SERVER_SIGNING_KEY`: a private P-256 JWK as JSON text."""
    raw = get_settings().server_signing_key.strip()
    if not raw:
        raise ServerKeyMissing("SERVER_SIGNING_KEY is not set (private P-256 JWK as JSON)")
    jwk = json.loads(raw)
    protocol.private_key_from_jwk(jwk)
    return jwk


def server_public_jwk() -> dict:
    return public_jwk(server_private_jwk())


def verify_iou(pubkey_jwk: dict, raw: bytes, sig_rs: bytes) -> bool:
    """WebCrypto r||s signature over the 61 IOU bytes; converted to DER inside protocol."""
    return len(raw) == protocol.IOU_LEN and protocol.verify_signature(pubkey_jwk, raw, sig_rs)


def sign_credential(body: dict, server_jwk: dict | None = None) -> dict:
    key = server_jwk or server_private_jwk()
    sig = protocol.sign(key, canonical(body))
    return {**body, "server_sig": base64.b64encode(sig).decode()}


def verify_credential(cred: dict, server_pub_jwk: dict | None = None) -> bool:
    try:
        sig = base64.b64decode(cred["server_sig"], validate=True)
    except (KeyError, TypeError, binascii.Error):
        return False
    body = {k: v for k, v in cred.items() if k != "server_sig"}
    return protocol.verify_signature(server_pub_jwk or server_public_jwk(), canonical(body), sig)


def decrypt(server_jwk: dict | None, epk_b64: str, iv_b64: str, ct_b64: str) -> bytes:
    """Envelope plaintext (the 125-byte signed IOU). Raises ValueError on any bad envelope."""
    try:
        return protocol.decrypt_envelope(server_jwk or server_private_jwk(), epk_b64, iv_b64, ct_b64)
    except ServerKeyMissing:
        raise
    except Exception as exc:  # InvalidTag, bad base64, bad point
        raise ValueError(f"bad envelope: {exc.__class__.__name__}") from exc
