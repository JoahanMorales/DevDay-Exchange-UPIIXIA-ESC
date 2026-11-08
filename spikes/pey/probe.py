"""pey probe: send a real $0.01 CoDi push and poll until PAID (HACK-002).

Run by a human (Fer), never by an agent:
    PEY_API_KEY=... uv run --no-project --with httpx python spikes/pey/probe.py --phone 5512345678
The API key is read from the environment only and is never printed.
"""
import argparse
import os
import random
import sys
import time

import httpx

BASE_URL = "https://api.pey.mx"
AMOUNT = 0.01
EXPIRATION = 360  # pey minimum, seconds
POLL_EVERY = 4  # seconds
CONCEPT = "SinSenal prueba 0.01"  # <= 40 chars


def main(argv, env, transport=None, sleep=time.sleep, clock=time.monotonic, out=print):
    ap = argparse.ArgumentParser(prog="probe.py")
    ap.add_argument("--phone", required=True, help="10-digit payer phone")
    ap.add_argument("--concept", default=CONCEPT)
    args = ap.parse_args(argv)

    key = env.get("PEY_API_KEY")
    if not key:
        out("error: set PEY_API_KEY in the environment")
        return 1
    if not (args.phone.isdigit() and len(args.phone) == 10):
        out("error: --phone must be exactly 10 digits")
        return 1
    concept = args.concept[:40]
    num_ref = str(random.randint(1, 9_999_999))

    body = {
        "amount": AMOUNT,
        "phoneNumber": args.phone,
        "concept": concept,
        "numRef": num_ref,
        "expiration": EXPIRATION,
        "metadata": {"source": "sinsenal-probe", "numRef": num_ref},
    }
    headers = {"Authorization": f"Bearer {key}"}
    with httpx.Client(base_url=BASE_URL, headers=headers, transport=transport, timeout=15) as http:
        r = http.post("/codi/pn", json=body)
        if r.status_code != 200:
            out(f"error: POST /codi/pn -> {r.status_code} {r.text[:200]}")
            return 1
        tx = r.json()["transactionId"]
        out(f"push sent: transactionId={tx} concept={concept!r} ({len(concept)} chars) numRef={num_ref}")
        out("approve it in your banking app now")

        start = clock()
        while True:
            elapsed = clock() - start
            if elapsed >= EXPIRATION:
                out(f"EXPIRED after {elapsed:.0f}s without payment")
                return 2
            g = http.get(f"/transaction/{tx}")
            status = g.json().get("status") if g.status_code == 200 else f"HTTP {g.status_code}"
            if status == "PAID":
                out(f"PAID after {clock() - start:.0f}s")
                return 0
            out(f"  {status} at {elapsed:.0f}s")
            sleep(POLL_EVERY)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:], os.environ))
