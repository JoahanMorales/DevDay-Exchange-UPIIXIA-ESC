"""Assistant for the shopkeeper (HACK-032, IDEA §7): answers questions about her debts in plain Spanish.

Anti-hallucination rule (same as HACK-022): the model never sees an amount and never writes a digit. Its tools are
READ-ONLY and return only marker names ({deudores}, {total_pendiente}, ...). The model writes prose with markers; every
value is inserted here from the records. Text with a digit, an unknown marker, no tool call, or any error/timeout is
replaced by a template answer (`fuente: "plantilla"`). Tools are scoped to the request's merchant, whatever the model
asks for. No tool signs, charges, marks a payment or changes a cap.
"""
from __future__ import annotations

import json
import re
import sqlite3
from typing import Protocol

from pydantic import BaseModel

from app.config import get_settings

_UNPAID = ("REGISTRADA", "COBRO_ENVIADO", "VENCIDA")
_PLACEHOLDER = re.compile(r"\{(\w+)\}")

INSTRUCTIONS = (
    "Eres el asistente de una tiendita en México. Responde en español sencillo, en 1 a 3 frases. Usa las herramientas "
    "para consultar los registros; ellas devuelven los NOMBRES de los marcadores disponibles. En tu respuesta NO escribas "
    "ningún dígito ni monto: usa los marcadores entre llaves, por ejemplo {deudores} o {total_pendiente}. "
    "No inventes nombres ni datos. Solo puedes consultar; no puedes cobrar, firmar ni cambiar nada."
)


def money(cents: int) -> str:
    return f"${cents / 100:,.2f}"


class AssistantResponse(BaseModel):
    texto: str
    cifras: dict[str, int | str]
    fuente: str  # "openai" | "plantilla"
    herramientas: list[str]


class AssistantClient(Protocol):
    def ask(self, *, model: str, instructions: str, question: str, tools: list[dict], run_tool) -> str: ...


# --- read-only tools: (conn, merchant_id, args) -> facts, or {"error": ...} ----------------------------------

def _listar_deudas(conn: sqlite3.Connection, merchant_id: str, args: dict) -> dict:
    # merchant_id from the model is ignored on purpose: the shop is the one that is asking.
    rows = conn.execute(
        "SELECT p.display_name AS name, d.amount_cents AS amount FROM debts d JOIN payers p ON p.id = d.payer_id"
        " WHERE d.merchant_id = ? AND d.status IN (?,?,?) ORDER BY d.created_at, d.id", (merchant_id, *_UNPAID)).fetchall()
    total = sum(r["amount"] for r in rows)
    return {"pendientes": len(rows), "total_pendiente": money(total),
            "deudores": ", ".join(f"{r['name']} ({money(r['amount'])})" for r in rows) or "nadie"}


def _explicar_rechazo(conn: sqlite3.Connection, merchant_id: str, args: dict) -> dict:
    row = conn.execute(
        "SELECT d.counter, d.alerts_json, p.display_name AS name FROM debts d JOIN payers p ON p.id = d.payer_id"
        " WHERE d.id = ? AND d.merchant_id = ? AND d.status = 'RECHAZADA'",
        (str(args.get("attack_id", "")), merchant_id)).fetchone()
    if row is None:
        return {"error": "rechazo no encontrado"}
    alerts = json.loads(row["alerts_json"])
    return {"contador": row["counter"], "pagador": row["name"],
            "motivo": alerts[0] if alerts else "el pagaré no pasó la verificación"}


def _redactar_recordatorio(conn: sqlite3.Connection, merchant_id: str, args: dict) -> dict:
    row = conn.execute(
        "SELECT d.amount_cents AS amount, p.display_name AS name, m.name AS shop FROM debts d"
        " JOIN payers p ON p.id = d.payer_id JOIN merchants m ON m.id = d.merchant_id"
        " WHERE d.id = ? AND d.merchant_id = ? AND d.status IN (?,?,?)",
        (str(args.get("debt_id", "")), merchant_id, *_UNPAID)).fetchone()
    if row is None:
        return {"error": "deuda no encontrada"}
    return {"pagador": row["name"], "monto": money(row["amount"]),
            "borrador": f"Hola {row['name']}, te recuerdo tu pagaré de {money(row['amount'])} con {row['shop']}. "
                        "Cuando te llegue el cobro CoDi en la app de tu banco, apruébalo. ¡Gracias!"}


TOOLS = {"listar_deudas": _listar_deudas, "explicar_rechazo": _explicar_rechazo,
         "redactar_recordatorio": _redactar_recordatorio}


def _spec(name: str, description: str, prop: str | None) -> dict:
    props = {prop: {"type": "string"}} if prop else {}
    return {"type": "function", "name": name, "description": description, "strict": True,
            "parameters": {"type": "object", "properties": props, "required": list(props), "additionalProperties": False}}


TOOL_SPECS = [
    _spec("listar_deudas", "Lista quién debe a la tienda (solo consulta). Marcadores: deudores, total_pendiente, pendientes.",
          "merchant_id"),
    _spec("explicar_rechazo", "Explica por qué se rechazó un pagaré (solo consulta). Marcadores: contador, pagador, motivo.",
          "attack_id"),
    _spec("redactar_recordatorio", "Redacta un borrador de recordatorio para un deudor; NO lo envía. Marcadores: borrador, pagador, monto.",
          "debt_id"),
]


class ResponsesAssistantClient:
    """Real client: OpenAI Responses API with function tools (not exercised in tests: no key, no network)."""

    def __init__(self, api_key: str, timeout: float = 12.0) -> None:
        from openai import OpenAI

        self._client = OpenAI(api_key=api_key, timeout=timeout, max_retries=0)

    def ask(self, *, model: str, instructions: str, question: str, tools: list[dict], run_tool) -> str:
        res = self._client.responses.create(model=model, instructions=instructions, input=question, tools=tools)
        for _ in range(3):  # at most 3 tool rounds
            calls = [o for o in res.output if o.type == "function_call"]
            if not calls:
                break
            outputs = [{"type": "function_call_output", "call_id": c.call_id,
                        "output": json.dumps(run_tool(c.name, json.loads(c.arguments)), ensure_ascii=False)} for c in calls]
            res = self._client.responses.create(model=model, instructions=instructions, previous_response_id=res.id,
                                                input=outputs, tools=tools)
        return res.output_text


# --- template answers ----------------------------------------------------------------------------------------

def _norm(s: str) -> str:
    return s.lower().translate(str.maketrans("áéíóúü", "aeiouu"))


def _template(conn: sqlite3.Connection, merchant_id: str, question: str) -> tuple[str, dict, str | None]:
    q = _norm(question)
    if "recordatorio" in q:
        pend = conn.execute(
            "SELECT d.id, p.display_name AS name FROM debts d JOIN payers p ON p.id = d.payer_id"
            " WHERE d.merchant_id = ? AND d.status IN (?,?,?) ORDER BY d.created_at, d.id", (merchant_id, *_UNPAID)).fetchall()
        pick = next((r for r in pend if _norm(r["name"]) in q), pend[0] if pend else None)
        facts = _redactar_recordatorio(conn, merchant_id, {"debt_id": pick["id"]}) if pick else {"error": "x"}
        if "error" in facts:
            return "No encuentro una deuda pendiente para redactar el recordatorio.", {}, None
        return f"Borrador para {facts['pagador']}: «{facts['borrador']}»", facts, "redactar_recordatorio"
    if "rechaz" in q:
        m = re.search(r"#?\b(\d+)\b", q)
        rows = conn.execute("SELECT id, counter FROM debts WHERE merchant_id = ? AND status = 'RECHAZADA'"
                            " ORDER BY created_at DESC, id", (merchant_id,)).fetchall()
        pick = next((r for r in rows if m and r["counter"] == int(m.group(1))), None) or (rows[0] if rows and not m else None)
        facts = _explicar_rechazo(conn, merchant_id, {"attack_id": pick["id"]}) if pick else {"error": "x"}
        if "error" in facts:
            return "No encuentro un pagaré rechazado con ese número.", {}, None
        return (f"El pagaré #{facts['contador']} de {facts['pagador']} se rechazó: {facts['motivo']}.", facts,
                "explicar_rechazo")
    if any(w in q for w in ("debe", "deben", "deuda", "deudor", "cobrar", "pendiente")):
        facts = _listar_deudas(conn, merchant_id, {})
        if facts["pendientes"] == 0:
            return "Nadie te debe por ahora.", facts, "listar_deudas"
        return f"Te debe {facts['deudores']}. En total son {facts['total_pendiente']}.", facts, "listar_deudas"
    return ("Puedo decirte quién te debe, por qué se rechazó un pagaré o redactar un recordatorio para un deudor.", {}, None)


def _fill(model_text: str, facts: dict) -> str | None:
    if not model_text.strip() or re.search(r"\d", model_text):
        return None
    if any(name not in facts for name in _PLACEHOLDER.findall(model_text)):
        return None
    return _PLACEHOLDER.sub(lambda m: str(facts[m.group(1)]), model_text)


def ask(conn: sqlite3.Connection, merchant_id: str, question: str, client: AssistantClient | None) -> AssistantResponse:
    """Raises KeyError for an unknown merchant."""
    if conn.execute("SELECT 1 FROM merchants WHERE id = ?", (merchant_id,)).fetchone() is None:
        raise KeyError(merchant_id)
    collected: dict = {}
    used: list[str] = []

    def run_tool(name: str, args: dict) -> dict:
        tool = TOOLS.get(name)
        if tool is None:
            return {"error": "herramienta desconocida"}
        res = tool(conn, merchant_id, args if isinstance(args, dict) else {})
        if "error" in res:
            return res
        collected.update(res)
        used.append(name)
        return {"marcadores": sorted(res)}  # names only: the model never sees an amount

    if client is not None:
        try:
            raw = client.ask(model=get_settings().openai_model_texto, instructions=INSTRUCTIONS, question=question,
                             tools=TOOL_SPECS, run_tool=run_tool)
            texto = _fill(raw, collected) if used else None
        except Exception:  # noqa: BLE001 - any model/network failure must fall back to the template
            texto = None
        if texto:
            return AssistantResponse(texto=texto, cifras=collected, fuente="openai", herramientas=list(dict.fromkeys(used)))
    texto, facts, tool = _template(conn, merchant_id, question)
    return AssistantResponse(texto=texto, cifras=facts, fuente="plantilla", herramientas=[tool] if tool else [])
