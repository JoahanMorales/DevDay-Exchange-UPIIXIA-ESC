import json

import httpx

import probe

KEY = "pey_live_SECRET_KEY_123"


class Clock:
    """Fake time: sleep() advances now()."""

    def __init__(self):
        self.t = 0.0
        self.sleeps = []

    def now(self):
        return self.t

    def sleep(self, s):
        self.sleeps.append(s)
        self.t += s


def fake_pey(paid_after_polls=2):
    calls = {"push": [], "gets": 0, "auth": []}

    def handler(req: httpx.Request):
        calls["auth"].append(req.headers.get("authorization"))
        if req.method == "POST" and req.url.path == "/codi/pn":
            calls["push"].append(json.loads(req.content))
            return httpx.Response(200, json={"transactionId": "01TX", "codiId": "1" * 20})
        if req.method == "GET" and req.url.path == "/transaction/01TX":
            calls["gets"] += 1
            status = "PAID" if calls["gets"] >= paid_after_polls else "PENDING"
            return httpx.Response(200, json={"status": status})
        return httpx.Response(404)

    return httpx.MockTransport(handler), calls


def run(transport, clock, argv=("--phone", "5512345678"), env=None):
    lines = []
    code = probe.main(
        list(argv),
        {"PEY_API_KEY": KEY} if env is None else env,
        transport=transport,
        sleep=clock.sleep,
        clock=clock.now,
        out=lines.append,
    )
    return code, "\n".join(lines)


def test_sends_push_with_one_cent_and_min_expiration():
    transport, calls = fake_pey()
    code, _ = run(transport, Clock())
    body = calls["push"][0]
    assert body["amount"] == 0.01
    assert body["expiration"] == 360
    assert body["phoneNumber"] == "5512345678"
    assert 1 <= len(body["numRef"] if isinstance(body["numRef"], str) else str(body["numRef"])) <= 7
    assert 0 < len(body["concept"]) <= 40
    assert isinstance(body["metadata"], dict) and body["metadata"]
    assert calls["auth"][0] == f"Bearer {KEY}"
    assert code == 0


def test_polls_until_paid_and_reports_seconds():
    transport, calls = fake_pey(paid_after_polls=3)
    clock = Clock()
    code, text = run(transport, clock)
    assert code == 0
    assert calls["gets"] == 3
    assert clock.sleeps == [4, 4]
    assert "PAID" in text
    assert "8" in text  # seconds elapsed


def test_polling_stops_at_expiry():
    transport, calls = fake_pey(paid_after_polls=10_000)
    code, text = run(transport, Clock())
    assert code == 2
    assert "EXPIRED" in text
    assert calls["gets"] < 200


def test_never_prints_the_api_key():
    transport, _ = fake_pey()
    _, text = run(transport, Clock())
    assert KEY not in text
    code, text = run(transport, Clock(), env={})
    assert code != 0
    assert "PEY_API_KEY" in text
    assert KEY not in text
