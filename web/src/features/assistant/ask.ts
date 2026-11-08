import { api } from '../../lib/api';

export interface AssistantAnswer {
  texto: string;
  cifras: Record<string, number | string>;
  fuente: 'openai' | 'plantilla';
  herramientas: string[];
}

type Post = <T>(path: string, init?: RequestInit) => Promise<T>;

export const sourceLabel = (f: AssistantAnswer['fuente']) =>
  f === 'openai' ? 'Respuesta de OpenAI con tus registros' : 'Respuesta de plantilla, sin IA, con tus registros';

export const toolLabel: Record<string, string> = {
  listar_deudas: 'deudas',
  explicar_rechazo: 'rechazos',
  redactar_recordatorio: 'recordatorio',
};

/** POST /api/asistente. Blank questions never reach the server; server errors reach the screen unchanged. */
export async function askAssistant(merchantId: string, pregunta: string, post: Post = api): Promise<AssistantAnswer> {
  const q = pregunta.trim();
  if (!q) throw new Error('Escribe una pregunta');
  return post<AssistantAnswer>('/asistente', { method: 'POST', body: JSON.stringify({ merchant_id: merchantId, pregunta: q }) });
}

// Never show a raw status line or English text: the shopkeeper needs to know what to do.
export function friendlyError(e: unknown): string {
  const m = e instanceof Error ? e.message : "";
  if (/pregunta/i.test(m)) return "escribe una pregunta primero.";
  if (/^(5\d\d|failed to fetch|networkerror|load failed)/i.test(m) || !m) return "el servidor no respondió, intenta de nuevo con red.";
  if (/^4\d\d/.test(m)) return "no encontré tu comercio o la pregunta no es válida.";
  return "ocurrió un problema, intenta de nuevo.";
}
