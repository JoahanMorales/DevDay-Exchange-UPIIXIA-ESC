"""Printables for the demo (HACK-029): counter QR and band QR from a fresh POST /demo/reset.

    uv run --no-project --with httpx --with "qrcode[pil]" python docs/print/make_print.py https://<url>

Writes counter-qr.png and band-qr.png next to this file (git-ignored: they expire in 24 h).
Run it again after every reset or redeploy: a reset issues new keys and invalidates old QRs.
"""
import json
import sys
from pathlib import Path

import httpx
import qrcode

OUT = Path(__file__).parent


def save(payload: dict, name: str) -> None:
    text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    qrcode.make(text, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10).save(OUT / name)
    print(f"{name}: {len(text.encode())} B")


def main(base_url: str) -> None:
    seed = httpx.post(f"{base_url.rstrip('/')}/demo/reset", timeout=30).raise_for_status().json()
    m = seed["merchant"]
    # Shape read by web/src/features/core/enroll.ts cacheMerchantFromQr
    save({"merchant_id": m["merchant"]["id"], "name": m["merchant"]["name"], "credential": m["credential"]},
         "counter-qr.png")
    carmen = next(p for p in seed["payers"] if p["payer"]["kind"] == "band")
    # Unverified: no band-QR reader exists yet; same shape as the counter QR, for the payer.
    save({"payer_id": carmen["payer"]["id"], "name": carmen["payer"]["display_name"],
          "credential": carmen["credential"]}, "band-qr.png")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000")
