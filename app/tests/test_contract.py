"""HACK-003 contract tests: IOU bytes, cross-language vectors, schema validation."""
import hashlib
import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.schemas import models, protocol

VECTORS = json.loads(
    (Path(__file__).parent.parent / "fixtures" / "sinsenal" / "vectors.json").read_text()
)


def test_iou_raw_is_61_bytes_and_roundtrips():
    v = VECTORS["iou"]
    raw = bytes.fromhex(v["raw_hex"])
    assert len(raw) == 61
    fields = protocol.unpack_iou(raw)
    assert fields.amount_cents == v["amount_cents"]
    assert fields.counter == v["counter"]
    assert fields.payer_id == v["payer_id"]
    assert fields.merchant_id == v["merchant_id"]
    assert protocol.pack_iou(fields) == raw
    assert len(protocol.pack_iou(fields)) == protocol.IOU_LEN == 61
    with pytest.raises(ValueError):
        protocol.unpack_iou(raw[:-1])


def test_vector_signature_verifies_after_rs_to_der():
    v = VECTORS["iou"]
    raw = bytes.fromhex(v["raw_hex"])
    sig_rs = bytes.fromhex(v["sig_rs_hex"])
    assert len(sig_rs) == 64
    der = protocol.rs_to_der(sig_rs)
    assert der != sig_rs and der[0] == 0x30
    assert protocol.der_to_rs(der) == sig_rs
    payer_jwk = VECTORS["payer"]["pubkey_jwk"]
    assert protocol.verify_signature(payer_jwk, raw, sig_rs) is True
    tampered = bytes([raw[0] ^ 0xFF]) + raw[1:]
    assert protocol.verify_signature(payer_jwk, tampered, sig_rs) is False


def test_envelope_vector_decrypts_to_iou():
    e = VECTORS["envelope"]
    iou = VECTORS["iou"]
    plaintext = protocol.decrypt_envelope(
        VECTORS["server"]["private_jwk"], e["epk_b64"], e["iv_b64"], e["ciphertext_b64"]
    )
    assert plaintext == bytes.fromhex(e["plaintext_hex"])
    assert plaintext == bytes.fromhex(iou["raw_hex"]) + bytes.fromhex(iou["sig_rs_hex"])
    assert len(plaintext) == protocol.SIGNED_IOU_LEN == 125
    assert e["envelope_id"] == hashlib.sha256(plaintext).hexdigest()


def test_debt_status_rejects_unknown_value():
    base = {
        "id": "01JD0000000000000000000001",
        "iou": VECTORS["iou_model"],
        "charge_target": "payer",
    }
    with pytest.raises(ValidationError):
        models.Debt(**base, status="INVENTADO")
    for ok in ("REGISTRADA", "COBRO_ENVIADO", "PAGADA", "VENCIDA", "DUPLICADA", "RECHAZADA"):
        assert models.Debt(**base, status=ok).status == ok


def test_sync_response_has_accepted_duplicates_rejected():
    body = {
        "accepted": 1,
        "duplicates": 2,
        "rejected": [{"envelope_id": "ab" * 32, "reason": "bad_sig"}],
        "revocation_list": {
            "version": 3,
            "issued_at": 1794122000,
            "revoked": ["01JD0000000000000000000009"],
            "caps": {"01JD0000000000000000000001": 30000},
            "server_sig": "AAAA",
        },
    }
    r = models.SyncResponse(**body)
    assert (r.accepted, r.duplicates) == (1, 2)
    assert r.rejected[0].reason == "bad_sig"
    assert r.revocation_list.version == 3
    assert set(models.SyncResponse.model_fields) == {
        "accepted", "duplicates", "rejected", "revocation_list"
    }
    with pytest.raises(ValidationError):
        models.SyncResponse(accepted=1, duplicates=0, rejected=[])
