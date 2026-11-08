"""POST /api/asistente: the shopkeeper asks about her debts in plain Spanish (HACK-032). Online only."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator

from app.config import get_settings
from app.routers.registry import Db
from app.services import assistant

router = APIRouter(prefix="/api", tags=["assistant"])


class AskRequest(BaseModel):
    merchant_id: str
    pregunta: str

    @field_validator("pregunta")
    @classmethod
    def _not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) > 500:
            raise ValueError("la pregunta debe tener entre 1 y 500 caracteres")
        return v


def get_client() -> assistant.AssistantClient | None:
    s = get_settings()
    if not (s.openai_api_key and s.openai_model_texto):
        return None  # no key or model: template answers
    return assistant.ResponsesAssistantClient(s.openai_api_key)


Client = Annotated[assistant.AssistantClient | None, Depends(get_client)]


@router.post("/asistente", response_model=assistant.AssistantResponse)
def asistente(req: AskRequest, conn: Db, client: Client):
    try:
        return assistant.ask(conn, req.merchant_id, req.pregunta, client)
    except KeyError:
        raise HTTPException(404, "merchant not found") from None
