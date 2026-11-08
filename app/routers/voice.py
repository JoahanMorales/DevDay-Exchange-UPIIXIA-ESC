"""POST /api/voz/sesion: short-lived OpenAI Realtime secret for the merchant's voice helper (HACK-023).

The browser never sees OPENAI_API_KEY: it gets an ephemeral client secret that expires in a minute.
The model can only *propose* an amount or a payer label; the merchant applies it with one tap.
No tool signs, charges or marks a payment (IDEA §7).
"""
from typing import Annotated, Protocol

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.config import get_settings

router = APIRouter(prefix="/api", tags=["voice"])

REALTIME_SECRETS_URL = "https://api.openai.com/v1/realtime/client_secrets"
SECRET_TTL_SECONDS = 60
MAX_CENTAVOS = 1_000_000  # $10,000 MXN: anything above is surely a mishearing

INSTRUCTIONS = (
    "Ayudas a la dueña de una tienda de barrio a capturar un cobro hablando en español de México. "
    "Cuando diga un monto, llama a proponer_monto con el monto en centavos (25 pesos = 2500). "
    "Cuando diga quién paga, llama a proponer_pagador con el nombre tal cual lo dijo. "
    "No inventes montos ni nombres: si no entendiste, pregunta. "
    "Tú solo propones; ella confirma en la pantalla. No puedes cobrar, firmar ni marcar pagos. "
    "Responde muy breve."
)

VOICE_TOOLS: list[dict] = [
    {
        "type": "function",
        "name": "proponer_monto",
        "description": "Propone en pantalla el monto del cobro. La dueña debe confirmarlo con un toque.",
        "parameters": {
            "type": "object",
            "properties": {
                "centavos": {"type": "integer", "minimum": 1, "maximum": MAX_CENTAVOS,
                             "description": "Monto en centavos de peso (25 pesos = 2500)."},
            },
            "required": ["centavos"],
            "additionalProperties": False,
        },
    },
    {
        "type": "function",
        "name": "proponer_pagador",
        "description": "Propone en pantalla quién paga, con el nombre que dijo la dueña. Ella debe confirmarlo.",
        "parameters": {
            "type": "object",
            "properties": {"etiqueta": {"type": "string", "maxLength": 60,
                                        "description": "Nombre o apodo del cliente, tal cual lo dijo."}},
            "required": ["etiqueta"],
            "additionalProperties": False,
        },
    },
]


class SessionMinter(Protocol):
    def mint(self, *, model: str, instructions: str, tools: list[dict]) -> dict: ...


class OpenAIRealtimeMinter:
    def __init__(self, api_key: str):
        self._api_key = api_key

    def mint(self, *, model: str, instructions: str, tools: list[dict]) -> dict:
        r = httpx.post(
            REALTIME_SECRETS_URL,
            headers={"Authorization": f"Bearer {self._api_key}"},
            json={
                "expires_after": {"anchor": "created_at", "seconds": SECRET_TTL_SECONDS},
                "session": {"type": "realtime", "model": model, "instructions": instructions,
                            "tools": tools, "tool_choice": "auto"},
            },
            timeout=10,
        )
        r.raise_for_status()
        return r.json()


def get_minter() -> SessionMinter | None:
    s = get_settings()
    if not (s.openai_api_key and s.openai_model_voz):
        return None
    return OpenAIRealtimeMinter(s.openai_api_key)


Minter = Annotated[SessionMinter | None, Depends(get_minter)]


class VoiceSession(BaseModel):
    client_secret: str
    expires_at: int
    model: str
    herramientas: list[str]


@router.post("/voz/sesion", response_model=VoiceSession)
def voz_sesion(minter: Minter):
    model = get_settings().openai_model_voz
    if minter is None or not model:
        raise HTTPException(503, "voz no disponible: falta configurar OpenAI")
    try:
        minted = minter.mint(model=model, instructions=INSTRUCTIONS, tools=VOICE_TOOLS)
        secret, expires_at = str(minted["value"]), int(minted["expires_at"])
    except Exception:  # never echo upstream text: it may carry the key or account details
        raise HTTPException(502, "OpenAI no entregó la sesión de voz") from None
    # Only these four fields leave the server, whatever the upstream reply contains.
    return VoiceSession(client_secret=secret, expires_at=expires_at, model=model,
                        herramientas=[t["name"] for t in VOICE_TOOLS])
