import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Button } from "../../../lib/ui";
import { BEATS, STILL_T, beatAt } from "./timeline";

type Api = { restart(): void };

/** "La idea en 14 segundos": the whole product as one looping 3D scene. three loads lazily, after the hero has painted. */
export function IdeaScene() {
  const reduce = useReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<Api | null>(null);
  const playingRef = useRef(true);
  const [beat, setBeat] = useState(3);
  const [playing, setPlaying] = useState(true);
  const [status, setStatus] = useState<"loading" | "ready" | "still" | "nowebgl">("loading");

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    // QA hook: ?scene_t=5 freezes the scene at 5 s, so a screenshot can show any beat.
    const qa = new URLSearchParams(location.search).get("scene_t");
    const frozen = qa !== null || !!reduce;
    let t = qa !== null ? Number(qa) || 0 : reduce ? STILL_T : 0;
    let disposed = false;
    let raf = 0;
    let visible = true;
    let cleanup = () => {};

    (async () => {
      if (typeof WebGL2RenderingContext === "undefined") return setStatus("nowebgl");
      try {
        const [T, rb, scn] = await Promise.all([
          import("three"),
          import("three/examples/jsm/geometries/RoundedBoxGeometry.js"),
          import("./scene3d"),
        ]);
        await document.fonts?.load('800 64px "Archivo"').catch(() => undefined);
        if (disposed) return;
        const scene = scn.createScene(T, rb.RoundedBoxGeometry, el, scn.readPalette());
        const pointer = { x: 0, y: 0 };
        let last = performance.now();
        let lastBeat = -1;

        const draw = () => {
          scene.update(t, pointer);
          scene.render();
          const b = beatAt(t).index;
          if (b !== lastBeat) {
            lastBeat = b;
            setBeat(b);
          }
        };
        const size = () => {
          scene.resize(el.clientWidth, el.clientHeight);
          draw();
        };
        const tick = (now: number) => {
          raf = requestAnimationFrame(tick);
          const dt = Math.min(0.1, (now - last) / 1000);
          last = now;
          if (document.hidden || !visible || !playingRef.current) return;
          t += dt;
          draw();
        };
        const ro = new ResizeObserver(size);
        ro.observe(el);
        const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.1 });
        io.observe(el);
        const onMove = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
          pointer.y = -((e.clientY - r.top) / r.height - 0.5) * 2;
          if (frozen) draw();
        };
        if (!reduce) el.addEventListener("pointermove", onMove);
        api.current = { restart: () => { t = 0; draw(); } };
        size();
        setStatus(frozen ? "still" : "ready");
        if (!frozen) raf = requestAnimationFrame(tick);
        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          io.disconnect();
          el.removeEventListener("pointermove", onMove);
          scene.dispose();
          api.current = null;
        };
        if (disposed) cleanup();
      } catch {
        if (!disposed) setStatus("nowebgl");
      }
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [reduce]);

  const active = status === "nowebgl" ? 3 : beat;
  return (
    <section className="border-t border-line py-10 md:py-16" aria-labelledby="idea-title">
      <h2 id="idea-title" className="display text-xl font-extrabold md:text-2xl">
        La idea en 14 segundos
      </h2>
      <div className="mt-6 overflow-hidden rounded-lg border border-line bg-surface shadow-card">
        <div ref={host} className="relative aspect-4/3 w-full md:aspect-16/7">
          {status === "loading" && (
            <p className="absolute inset-0 grid place-items-center text-base text-ink-2">Preparando la escena…</p>
          )}
          {status === "nowebgl" && (
            <p className="absolute inset-0 grid place-items-center px-6 text-center text-base text-ink-2">
              Tu navegador no muestra la escena en 3D. La historia es la misma, en cuatro pasos.
            </p>
          )}
        </div>
        {status === "ready" && (
          <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3">
            <Button variant="ghost" size="sm" onClick={() => setPlaying((v) => !v)} aria-pressed={!playing}>
              {playing ? "Pausar" : "Reanudar"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => api.current?.restart()}>
              Repetir
            </Button>
            <p className="text-sm text-ink-2">Mueve el cursor sobre la escena para cambiar el ángulo.</p>
          </div>
        )}
      </div>
      <ol className="mt-6 grid gap-3 md:grid-cols-4" aria-label="Los cuatro pasos de la idea">
        {BEATS.map((b, i) => (
          <li
            key={b.id}
            aria-current={i === active ? "step" : undefined}
            className={`rounded-lg px-4 py-3 transition-colors duration-200 ${i === active ? "bg-surface shadow-card" : ""}`}
          >
            <p className={`display text-lg font-extrabold ${i === active ? "text-ink" : "text-ink-2"}`}>
              <span className="num mr-2 text-accent">{i + 1}</span>
              {b.title}
            </p>
            <p className={`mt-1 text-base ${i === active ? "text-ink" : "text-ink-2"}`}>{b.caption}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
