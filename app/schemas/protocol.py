"""SinSeñal binary protocol: IOU/challenge layouts, signatures and envelopes.

Layout reference: docs/protocolo.md. All integers are big-endian. Pure functions, no I/O.
"""
from __future__ import annotations

import base64
import struct
from dataclasses import dataclass

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import (
    decode_dss_signature,
    encode_dss_signature,
)
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

PROTOCOL_VERSION = 1
IOU_LEN = 61
SIG_LEN = 64
SIGNED_IOU_LEN = IOU_LEN + SIG_LEN  # 125, fits ggwave's 140-byte message
CHALLENGE_LEN = 41
HKDF_INFO = b"sinsenal-v1"
GCM_IV_LEN = 12
CAP_SCALE = 1_000_000  # lat/lon are signed int32 degrees x 1e6

_IOU_FMT = ">B16s16sIII8sii"  # ver payer merchant amount counter ts nonce lat lon
_CHALLENGE_FMT = ">B16s8sIiiI"  # ver merchant nonce ts lat lon amount
assert struct.calcsize(_IOU_FMT) == IOU_LEN
assert struct.calcsize(_CHALLENGE_FMT) == CHALLENGE_LEN

_B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"


def ulid_to_bytes(ulid: str) -> bytes:
    if len(ulid) != 26 or any(c not in _B32 for c in ulid.upper()):
        raise ValueError(f"invalid ULID: {ulid!r}")
    n = 0
    for c in ulid.upper():
        n = n * 32 + _B32.index(c)
    if n >> 128:
        raise ValueError("ULID overflows 128 bits")
    return n.to_bytes(16, "big")


def bytes_to_ulid(raw: bytes) -> str:
    if len(raw) != 16:
        raise ValueError("ULID needs 16 bytes")
    n = int.from_bytes(raw, "big")
    return "".join(_B32[(n >> (5 * i)) & 31] for i in range(25, -1, -1))


@dataclass(frozen=True)
class IouFields:
    ver: int
    payer_id: str
    merchant_id: str
    amount_cents: int
    counter: int
    ts: int
    nonce: bytes  # 8 bytes, the challenge nonce
    lat_e6: int
    lon_e6: int


def pack_iou(f: IouFields) -> bytes:
    if len(f.nonce) != 8:
        raise ValueError("nonce must be 8 bytes")
    return struct.pack(
        _IOU_FMT, f.ver, ulid_to_bytes(f.payer_id), ulid_to_bytes(f.merchant_id),
        f.amount_cents, f.counter, f.ts, f.nonce, f.lat_e6, f.lon_e6,
    )


def unpack_iou(raw: bytes) -> IouFields:
    if len(raw) != IOU_LEN:
        raise ValueError(f"IOU must be {IOU_LEN} bytes, got {len(raw)}")
    ver, payer, merchant, amount, counter, ts, nonce, lat, lon = struct.unpack(_IOU_FMT, raw)
    return IouFields(ver, bytes_to_ulid(payer), bytes_to_ulid(merchant), amount, counter, ts,
                     nonce, lat, lon)


@dataclass(frozen=True)
class ChallengeFields:
    ver: int
    merchant_id: str
    nonce: bytes  # 8 bytes
    ts: int
    lat_e6: int
    lon_e6: int
    amount_cents: int


def pack_challenge(c: ChallengeFields) -> bytes:
    if len(c.nonce) != 8:
        raise ValueError("nonce must be 8 bytes")
    return struct.pack(_CHALLENGE_FMT, c.ver, ulid_to_bytes(c.merchant_id), c.nonce, c.ts,
                       c.lat_e6, c.lon_e6, c.amount_cents)


def unpack_challenge(raw: bytes) -> ChallengeFields:
    if len(raw) != CHALLENGE_LEN:
        raise ValueError(f"challenge must be {CHALLENGE_LEN} bytes, got {len(raw)}")
    ver, merchant, nonce, ts, lat, lon, amount = struct.unpack(_CHALLENGE_FMT, raw)
    return ChallengeFields(ver, bytes_to_ulid(merchant), nonce, ts, lat, lon, amount)


# --- signatures: WebCrypto emits raw r||s (64 bytes); `cryptography` wants DER -------------

def rs_to_der(sig_rs: bytes) -> bytes:
    if len(sig_rs) != SIG_LEN:
        raise ValueError("signature must be 64 bytes (r||s)")
    return encode_dss_signature(int.from_bytes(sig_rs[:32], "big"), int.from_bytes(sig_rs[32:], "big"))


def der_to_rs(der: bytes) -> bytes:
    r, s = decode_dss_signature(der)
    return r.to_bytes(32, "big") + s.to_bytes(32, "big")


def b64u_decode(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def b64u_encode(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def public_key_from_jwk(jwk: dict) -> ec.EllipticCurvePublicKey:
    if jwk.get("kty") != "EC" or jwk.get("crv") != "P-256":
        raise ValueError("only EC P-256 JWKs are supported")
    return ec.EllipticCurvePublicNumbers(
        int.from_bytes(b64u_decode(jwk["x"]), "big"),
        int.from_bytes(b64u_decode(jwk["y"]), "big"),
        ec.SECP256R1(),
    ).public_key()


def private_key_from_jwk(jwk: dict) -> ec.EllipticCurvePrivateKey:
    pub = public_key_from_jwk(jwk).public_numbers()
    return ec.EllipticCurvePrivateNumbers(int.from_bytes(b64u_decode(jwk["d"]), "big"), pub
                                          ).private_key()


def jwk_from_private(key: ec.EllipticCurvePrivateKey, with_private: bool = True) -> dict:
    n = key.private_numbers()
    jwk = {"kty": "EC", "crv": "P-256",
           "x": b64u_encode(n.public_numbers.x.to_bytes(32, "big")),
           "y": b64u_encode(n.public_numbers.y.to_bytes(32, "big"))}
    if with_private:
        jwk["d"] = b64u_encode(n.private_value.to_bytes(32, "big"))
    return jwk


def sign(private_jwk: dict, message: bytes) -> bytes:
    der = private_key_from_jwk(private_jwk).sign(message, ec.ECDSA(hashes.SHA256()))
    return der_to_rs(der)


def verify_signature(pubkey_jwk: dict, message: bytes, sig_rs: bytes) -> bool:
    try:
        public_key_from_jwk(pubkey_jwk).verify(rs_to_der(sig_rs), message, ec.ECDSA(hashes.SHA256()))
        return True
    except Exception:  # bad signature, bad length or bad key: all mean "not valid"
        return False


# --- envelope: ECDH P-256 ephemeral + HKDF-SHA256 (info sinsenal-v1) + AES-256-GCM ---------

def _envelope_key(shared: bytes) -> bytes:
    return HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=HKDF_INFO).derive(shared)


def encrypt_envelope(server_pub_jwk: dict, plaintext: bytes, eph_private_jwk: dict, iv: bytes
                     ) -> tuple[str, str, str]:
    """Returns (epk_b64, iv_b64, ciphertext_b64) with standard base64; epk = 65-byte 0x04||X||Y."""
    eph = private_key_from_jwk(eph_private_jwk)
    shared = eph.exchange(ec.ECDH(), public_key_from_jwk(server_pub_jwk))
    ct = AESGCM(_envelope_key(shared)).encrypt(iv, plaintext, None)
    n = eph.public_key().public_numbers()
    epk = b"\x04" + n.x.to_bytes(32, "big") + n.y.to_bytes(32, "big")
    return (base64.b64encode(epk).decode(), base64.b64encode(iv).decode(),
            base64.b64encode(ct).decode())


def decrypt_envelope(server_private_jwk: dict, epk_b64: str, iv_b64: str, ciphertext_b64: str
                     ) -> bytes:
    epk = base64.b64decode(epk_b64)
    if len(epk) != 65 or epk[0] != 4:
        raise ValueError("epk must be an uncompressed P-256 point (65 bytes)")
    eph_pub = ec.EllipticCurvePublicNumbers(
        int.from_bytes(epk[1:33], "big"), int.from_bytes(epk[33:], "big"), ec.SECP256R1()
    ).public_key()
    shared = private_key_from_jwk(server_private_jwk).exchange(ec.ECDH(), eph_pub)
    return AESGCM(_envelope_key(shared)).decrypt(
        base64.b64decode(iv_b64), base64.b64decode(ciphertext_b64), None)
