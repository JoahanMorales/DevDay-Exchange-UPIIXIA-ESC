"""HACK-011 server-side crypto against the cross-language vectors (HACK-003)."""
import hashlib
import json
from pathlib import Path

from app.services import crypto

VECTORS = json.loads(
    (Path(__file__).parent.parent / "fixtures" / "sinsenal" / "vectors.json").read_text()
)
SERVER_PUB = VECTORS["server"]["pubkey_jwk"]


def test_verifies_iou_vector_after_rs_to_der():
    v = VECTORS["iou"]
    raw, sig = bytes.fromhex(v["raw_hex"]), bytes.fromhex(v["sig_rs_hex"])
    assert len(sig) == 64
    assert crypto.verify_iou(VECTORS["payer"]["pubkey_jwk"], raw, sig) is True


def test_rejects_tampered_iou():
    v = VECTORS["iou"]
    raw, sig = bytearray.fromhex(v["raw_hex"]), bytes.fromhex(v["sig_rs_hex"])
    raw[20] ^= 0x01
    assert crypto.verify_iou(VECTORS["payer"]["pubkey_jwk"], bytes(raw), sig) is False
    good = bytes.fromhex(v["raw_hex"])
    assert crypto.verify_iou(VECTORS["payer"]["pubkey_jwk"], good, sig[:-1]) is False
    # right bytes, wrong signer
    assert crypto.verify_iou(VECTORS["other_payer"]["pubkey_jwk"], good, sig) is False


def test_rejects_tampered_credential():
    cred = dict(VECTORS["payer"]["credential"])
    assert crypto.verify_credential(cred, SERVER_PUB) is True
    tampered = {**cred, "daily_cap_cents": cred["daily_cap_cents"] + 1}
    assert crypto.verify_credential(tampered, SERVER_PUB) is False
    assert crypto.verify_credential({k: v for k, v in cred.items() if k != "server_sig"}, SERVER_PUB) is False
    assert crypto.verify_credential(cred, VECTORS["payer"]["pubkey_jwk"]) is False


def test_decrypts_envelope_vector():
    e = VECTORS["envelope"]
    plain = crypto.decrypt(VECTORS["server"]["private_jwk"], e["epk_b64"], e["iv_b64"], e["ciphertext_b64"])
    assert plain == bytes.fromhex(e["plaintext_hex"])
    assert hashlib.sha256(plain).hexdigest() == e["envelope_id"]
