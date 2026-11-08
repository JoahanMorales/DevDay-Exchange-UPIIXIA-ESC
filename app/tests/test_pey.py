import json

import httpx

from app.services.pey import FakePey, HttpPey, charge_amount, poll_until_paid


def test_sends_codi_push_with_demo_amount_phone_and_metadata() -> None:
    seen: list[httpx.Request] = []

    def handler(req: httpx.Request) -> httpx.Response:
        seen.append(req)
        return httpx.Response(200, json={"transactionId": "01TX", "codiId": "1" * 20})

    client = HttpPey("key-x", "https://api.pey.test", transport=httpx.MockTransport(handler))
    out = client.send_push(
        amount=charge_amount(250.0, "0.01"),
        phone="5512345678",
        concept="SinSenal Tienda Lupita con un concepto demasiado largo",
        num_ref="123",
        metadata={"deuda_id": "D1"},
    )
    assert out == {"transactionId": "01TX", "codiId": "1" * 20}
    req = seen[0]
    assert req.method == "POST" and req.url.path == "/codi/pn"
    assert req.headers["authorization"] == "Bearer key-x"
    body = json.loads(req.content)
    assert body["amount"] == 0.01
    assert body["phoneNumber"] == "5512345678"
    assert body["metadata"] == {"deuda_id": "D1"}
    assert len(body["concept"]) <= 40
    assert body["expiration"] >= 360
    assert charge_amount(250.0, "") == 250.0


def test_polls_transaction_until_paid() -> None:
    fake = FakePey(statuses=["PENDING", "PENDING", "PAID"])
    sleeps: list[float] = []
    tx = poll_until_paid(fake, "01TX", sleep=sleeps.append, interval=4, max_polls=10)
    assert tx is not None and tx["status"] == "PAID"
    assert fake.polled == ["01TX"] * 3
    assert sleeps == [4, 4]
    assert poll_until_paid(FakePey(statuses=["PENDING"]), "01TX", sleep=lambda s: None, max_polls=3) is None
