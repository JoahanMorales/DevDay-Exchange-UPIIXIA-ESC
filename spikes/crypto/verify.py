"""Verify sign.mjs output: r||s signature (via DER) and envelope decrypt. Usage: verify.py out.json"""
import base64, json, sys
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

d = json.load(open(sys.argv[1]))
u = lambda s: int.from_bytes(base64.urlsafe_b64decode(s + "=" * (-len(s) % 4)), "big")
pub = ec.EllipticCurvePublicNumbers(u(d["payer_pubkey_jwk"]["x"]), u(d["payer_pubkey_jwk"]["y"]), ec.SECP256R1()).public_key()
msg, sig = bytes.fromhex(d["message_hex"]), bytes.fromhex(d["sig_rs_hex"])
assert len(sig) == 64
pub.verify(encode_dss_signature(int.from_bytes(sig[:32], "big"), int.from_bytes(sig[32:], "big")), msg, ec.ECDSA(hashes.SHA256()))
print("signature OK (r||s -> DER)")

s = d["server_private_jwk"]
priv = ec.EllipticCurvePrivateNumbers(u(s["d"]), ec.EllipticCurvePublicNumbers(u(s["x"]), u(s["y"]), ec.SECP256R1())).private_key()
epk = base64.b64decode(d["epk_b64"]); assert len(epk) == 65 and epk[0] == 4
eph = ec.EllipticCurvePublicNumbers(int.from_bytes(epk[1:33], "big"), int.from_bytes(epk[33:], "big"), ec.SECP256R1()).public_key()
key = HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=b"sinsenal-v1").derive(priv.exchange(ec.ECDH(), eph))
pt = AESGCM(key).decrypt(base64.b64decode(d["iv_b64"]), base64.b64decode(d["ciphertext_b64"]), None)
assert pt == bytes.fromhex(d["plaintext_hex"]) and len(pt) == 125
print("envelope OK (ECDH+HKDF+AES-GCM, 125 B)")
