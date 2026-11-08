import re

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import app
from app.routers import explain as explain_router
from app.services.explain import SyncRecords, explain_sync

RECORDS = SyncRecords(
    merchant_name="Lupita",
    registradas=3,
    pagadas=2,
    duplicadas=1,
    rechazos={"counter_replay": 2, "bad_sig": 1},
)


class FakeClient:
    def __init__(self, texto: str | None = None, error: Exception | None = None) -> None:
        self.texto = texto
        self.error = error
        self.calls: list[dict] = []

    def explain(self, *, model: str, instructions: str, data: dict) -> str:
        self.calls.append({"model": model, "instructions": instructions, "data": data})
        if self.error:
            raise self.error
        return self.texto or ""


@pytest.fixture(autouse=True)
def _model_env(monkeypatch):
    monkeypatch.setenv("OPENAI_MODEL_TEXTO", "modelo-texto-test")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
    app.dependency_overrides.clear()


def _digits(text: str) -> set[str]:
    return set(re.findall(r"\d+", text))


def test_explains_sync_result_in_spanish_from_records():
    fake = FakeClient(
        "Lupita, se registraron {registradas} deudas, {pagadas} ya están pagadas y "
        "{duplicadas} venía duplicada. Se rechazaron {rechazos} intentos de ataque."
    )
    app.dependency_overrides[explain_router.get_openai_client] = lambda: fake
    app.dependency_overrides[explain_router.get_records] = lambda merchant_id: RECORDS
    res = TestClient(app).get("/api/resumen", params={"merchant_id": "m1"})
    assert res.status_code == 200
    body = res.json()
    assert body["fuente"] == "openai"
    assert "registraron 3 deudas" in body["texto"]
    assert "2 ya están pagadas" in body["texto"]
    assert body["cifras"]["rechazos"] == 3
    assert _digits(body["texto"]) <= {str(v) for v in body["cifras"].values()}


def test_falls_back_to_template_when_openai_fails():
    out = explain_sync(RECORDS, FakeClient(error=TimeoutError("timeout")))
    assert out.fuente == "plantilla"
    assert "3" in out.texto and "Lupita" in out.texto
    assert "réplica" in out.texto  # counter_replay explained in Spanish
    assert _digits(out.texto) <= {str(v) for v in out.cifras.values()}


def test_discards_model_text_with_numbers_not_in_records():
    out = explain_sync(RECORDS, FakeClient("Se registraron 7 deudas y {pagadas} pagadas."))
    assert out.fuente == "plantilla"
    assert "7" not in out.texto


def test_reads_model_from_env():
    fake = FakeClient("Todo en orden, {nombre}.")
    explain_sync(RECORDS, fake)
    assert fake.calls[0]["model"] == "modelo-texto-test"
