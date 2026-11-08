"""pey CoDi client (HACK-010): interface, real HTTP client, fake for tests, polling fallback."""
import time
from collections.abc import Callable
from typing import Any, Protocol

import httpx

MIN_EXPIRATION = 360  # pey minimum, seconds
MAX_CONCEPT = 40  # CoDi concept length kept conservative (IDEA §5.7)


def charge_amount(real: float, demo_amount: str | None) -> float:
    """Amount to charge: DEMO_REAL_AMOUNT when set (e.g. "0.01"), else the real debt amount."""
    return float(demo_amount) if demo_amount else float(real)


class PeyClient(Protocol):
    def send_push(
        self, *, amount: float, phone: str, concept: str, num_ref: str, metadata: dict, expiration: int = ...
    ) -> dict: ...

    def create_qr(self, *, amount: float, concept: str, num_ref: str, metadata: dict) -> dict: ...

    def get_transaction(self, transaction_id: str) -> dict: ...


class HttpPey:
    """Real pey client. Auth is `Authorization: Bearer <PEY_API_KEY>`; the key is never logged."""

    def __init__(self, api_key: str, base_url: str = "https://api.pey.mx", transport: httpx.BaseTransport | None = None):
        self._http = httpx.Client(
            base_url=base_url or "https://api.pey.mx",
            headers={"Authorization": f"Bearer {api_key}"},
            transport=transport,
            timeout=15,
        )

    def _post(self, path: str, body: dict) -> dict:
        r = self._http.post(path, json=body)
        r.raise_for_status()
        return r.json()

    def send_push(
        self, *, amount: float, phone: str, concept: str, num_ref: str, metadata: dict, expiration: int = MIN_EXPIRATION
    ) -> dict:
        return self._post(
            "/codi/pn",
            {
                "amount": amount,
                "phoneNumber": phone,
                "concept": concept[:MAX_CONCEPT],
                "numRef": num_ref,
                "expiration": max(expiration, MIN_EXPIRATION),
                "metadata": metadata,
            },
        )

    def create_qr(self, *, amount: float, concept: str, num_ref: str, metadata: dict) -> dict:
        return self._post(
            "/codi/qr", {"amount": amount, "concept": concept[:MAX_CONCEPT], "numRef": num_ref, "metadata": metadata}
        )

    def get_transaction(self, transaction_id: str) -> dict:
        r = self._http.get(f"/transaction/{transaction_id}")
        r.raise_for_status()
        return r.json()


class FakePey:
    """In-memory pey for other tasks' tests: records pushes, replays a list of transaction statuses."""

    def __init__(self, statuses: list[str] | None = None):
        self.statuses = list(statuses or ["PAID"])
        self.pushes: list[dict] = []
        self.qrs: list[dict] = []
        self.polled: list[str] = []

    def send_push(self, **kw: Any) -> dict:
        self.pushes.append(kw)
        n = len(self.pushes)
        return {"transactionId": f"01FAKETX{n:018d}", "codiId": f"{n:020d}"}

    def create_qr(self, **kw: Any) -> dict:
        self.qrs.append(kw)
        return {"transactionId": f"01FAKEQR{len(self.qrs):018d}", "qr": "demo"}

    def get_transaction(self, transaction_id: str) -> dict:
        self.polled.append(transaction_id)
        status = self.statuses.pop(0) if len(self.statuses) > 1 else self.statuses[0]
        return {"transactionId": transaction_id, "status": status}


def poll_until_paid(
    client: PeyClient,
    transaction_id: str,
    sleep: Callable[[float], Any] = time.sleep,
    interval: float = 4,
    max_polls: int = 90,
) -> dict | None:
    """Fallback confirmation: GET /transaction/{id} every `interval` s until PAID. None if it never pays."""
    for i in range(max_polls):
        tx = client.get_transaction(transaction_id)
        if tx.get("status") == "PAID":
            return tx
        if i < max_polls - 1:
            sleep(interval)
    return None
