import { api } from "../../lib/api";
import { parseToolCall, type Proposal } from "./proposal";

export interface VoiceSession {
  client_secret: string;
  expires_at: number;
  model: string;
  herramientas: string[];
}

const CALLS_URL = "https://api.openai.com/v1/realtime/calls";

export type VoiceHandle = { stop: () => void };

/**
 * Opens a WebRTC call to OpenAI Realtime with the ephemeral secret minted by POST /api/voz/sesion.
 * Every function call becomes a proposal on screen; the model is told it is only shown, never applied.
 */
export async function startVoice(onProposal: (p: Proposal) => void, onEnd: () => void): Promise<VoiceHandle> {
  const session = await api<VoiceSession>("/voz/sesion", { method: "POST" });
  const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
  const pc = new RTCPeerConnection();
  const audio = new Audio();
  audio.autoplay = true;
  pc.ontrack = (e) => {
    audio.srcObject = e.streams[0];
  };
  mic.getTracks().forEach((t) => pc.addTrack(t, mic));
  const dc = pc.createDataChannel("oai-events");

  dc.onmessage = (msg) => {
    let ev: { type?: string; item?: { type?: string; name?: string; call_id?: string; arguments?: string } };
    try {
      ev = JSON.parse(msg.data);
    } catch {
      return;
    }
    const item = ev.item;
    if (ev.type !== "response.output_item.done" || item?.type !== "function_call") return;
    const p = parseToolCall(item.name ?? "", item.arguments ?? "");
    if (p) onProposal(p);
    dc.send(JSON.stringify({
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: item.call_id,
        output: JSON.stringify(p ? { mostrado: true, aplicado: false, nota: "La dueña debe confirmarlo en pantalla." } : { error: "valor no válido" }),
      },
    }));
    dc.send(JSON.stringify({ type: "response.create" }));
  };

  const stop = () => {
    dc.close();
    pc.close();
    mic.getTracks().forEach((t) => t.stop());
    audio.srcObject = null;
    onEnd();
  };
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === "failed" || pc.connectionState === "disconnected") stop();
  };

  await pc.setLocalDescription(await pc.createOffer());
  const r = await fetch(CALLS_URL, {
    method: "POST",
    body: pc.localDescription?.sdp,
    headers: { Authorization: `Bearer ${session.client_secret}`, "Content-Type": "application/sdp" },
  });
  if (!r.ok) {
    stop();
    throw new Error(`${r.status} realtime`);
  }
  await pc.setRemoteDescription({ type: "answer", sdp: await r.text() });
  return { stop };
}
