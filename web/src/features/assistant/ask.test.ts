// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { askAssistant, sourceLabel, type AssistantAnswer } from './ask';

const answer: AssistantAnswer = { texto: 'Te debe Mario ($25.00).', cifras: { pendientes: 1 }, fuente: 'plantilla', herramientas: ['listar_deudas'] };

describe('assistant client', () => {
  it('posts_the_trimmed_question_for_the_shop', async () => {
    const post = vi.fn(async () => answer);
    const r = await askAssistant('M1', '  ¿quién me debe?  ', post as never);
    expect(r).toEqual(answer);
    expect(post).toHaveBeenCalledTimes(1);
    const [path, init] = post.mock.calls[0] as unknown as [string, RequestInit];
    expect(path).toBe('/asistente');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ merchant_id: 'M1', pregunta: '¿quién me debe?' });
  });

  it('refuses_blank_questions_without_calling_the_server', async () => {
    const post = vi.fn();
    await expect(askAssistant('M1', '   ', post as never)).rejects.toThrow(/pregunta/);
    expect(post).not.toHaveBeenCalled();
  });

  it('keeps_server_errors_for_the_screen', async () => {
    const post = vi.fn(async () => { throw new Error('503 Service Unavailable'); });
    await expect(askAssistant('M1', 'hola', post as never)).rejects.toThrow('503');
  });

  it('labels_where_the_answer_came_from', () => {
    expect(sourceLabel('openai')).toMatch(/OpenAI/);
    expect(sourceLabel('plantilla')).toMatch(/sin IA|plantilla/);
  });
});
