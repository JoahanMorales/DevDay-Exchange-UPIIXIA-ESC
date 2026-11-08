"""Plain-Spanish explanation of a sync (HACK-022).

Anti-hallucination rule (IDEA §7): the model only writes prose with placeholders
({registradas}, {pagadas}, ...). Every number is inserted here from the records. Model text
containing any digit, unknown placeholders, or any error/timeout → template answer.
"""

import json
import re
from dataclasses import dataclass, field
from typing import Protocol

from app.config import get_settings
from app.schemas.models import ExplainResponse

REASONS_ES = {
    "bad_sig": "firma inválida",
    "bad_credential": "credencial inválida",
    "bad_envelope": "sobre alterado",
    "expired": "pagaré vencido",
    "counter_replay": "réplica de un pagaré ya usado",
    "cap_exceeded": "monto mayor al tope permitido",
    "revoked": "teléfono revocado",
    "unknown_payer": "pagador desconocido",
    "unknown_merchant": "comercio desconocido",
    "malformed": "datos mal formados",
    "replay": "réplica de un pagaré ya usado",
    "distance": "fuera de distancia",
    "counter": "contador repetido",
    "cap": "monto mayor al tope permitido",
    "rechazada": "pagaré rechazado al verificarlo",
}

INSTRUCTIONS = (
    "Eres el asistente de una tiendita en México. Explica en español sencillo, en 2 a 4 frases, "
    "qué pasó al sincronizar los pagarés offline. NO escribas ningún dígito: usa solo estos "
    "marcadores para cifras: {nombre}, {registradas}, {pagadas}, {duplicadas}, {rechazos}. "
    "Menciona los motivos de rechazo con palabras, sin cantidades."
)

TEXT_SCHEMA = {
    "type": "object",
    "properties": {"texto": {"type": "string"}},
    "required": ["texto"],
    "additionalProperties": False,
}

_PLACEHOLDER = re.compile(r"\{(\w+)\}")


@dataclass
class SyncRecords:
    merchant_name: str
    registradas: int = 0
    pagadas: int = 0
    duplicadas: int = 0
    rechazos: dict[str, int] = field(default_factory=dict)

    def cifras(self) -> dict[str, int | str]:
        return {
            "nombre": self.merchant_name,
            "registradas": self.registradas,
            "pagadas": self.pagadas,
            "duplicadas": self.duplicadas,
            "rechazos": sum(self.rechazos.values()),
            **{f"rechazos_{k}": n for k, n in sorted(self.rechazos.items()) if n},
        }


class OpenAIClient(Protocol):
    def explain(self, *, model: str, instructions: str, data: dict) -> str: ...


class ResponsesOpenAIClient:
    """Real client: Responses API with structured output (json_schema)."""

    def __init__(self, api_key: str, timeout: float = 8.0) -> None:
        from openai import OpenAI

        self._client = OpenAI(api_key=api_key, timeout=timeout, max_retries=0)

    def explain(self, *, model: str, instructions: str, data: dict) -> str:
        res = self._client.responses.create(
            model=model,
            instructions=instructions,
            input=json.dumps(data, ensure_ascii=False),
            text={"format": {"type": "json_schema", "name": "resumen", "schema": TEXT_SCHEMA, "strict": True}},
        )
        return json.loads(res.output_text)["texto"]


def template_text(r: SyncRecords) -> str:
    c = r.cifras()
    parts = [
        f"{c['nombre']}, al sincronizar se registraron {c['registradas']} deudas, "
        f"{c['pagadas']} ya están pagadas y {c['duplicadas']} venían duplicadas."
    ]
    if c["rechazos"]:
        motivos = ", ".join(
            f"{c[f'rechazos_{k}']} por {REASONS_ES.get(k, k)}" for k, n in sorted(r.rechazos.items()) if n
        )
        parts.append(f"Se rechazaron {c['rechazos']} intentos de ataque: {motivos}.")
    else:
        parts.append("No hubo intentos de ataque.")
    return " ".join(parts)


def _fill(model_text: str, cifras: dict) -> str | None:
    if not model_text.strip() or re.search(r"\d", model_text):
        return None
    if any(name not in cifras for name in _PLACEHOLDER.findall(model_text)):
        return None
    return _PLACEHOLDER.sub(lambda m: str(cifras[m.group(1)]), model_text)


def explain_sync(records: SyncRecords, client: OpenAIClient | None) -> ExplainResponse:
    cifras = records.cifras()
    if client is not None:
        data = {**cifras, "motivos_rechazo": [REASONS_ES.get(k, k) for k, n in records.rechazos.items() if n]}
        try:
            raw = client.explain(model=get_settings().openai_model_texto, instructions=INSTRUCTIONS, data=data)
            texto = _fill(raw, cifras)
        except Exception:  # timeout, network, bad JSON: template answer
            texto = None
        if texto:
            return ExplainResponse(texto=texto, cifras=cifras, fuente="openai")
    return ExplainResponse(texto=template_text(records), cifras=cifras, fuente="plantilla")
