import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import jsQR from "jsqr";

/** Shows the frames of an animated QR in a loop (one frame every `ms`). */
export function QrLoop({ frames, ms = 300, label }: { frames: string[]; ms?: number; label: string }) {
  const [urls, setUrls] = useState<string[]>([]);
  const [i, setI] = useState(0);
  useEffect(() => {
    let live = true;
    Promise.all(frames.map((f) => QRCode.toDataURL(f, { margin: 1, width: 360, errorCorrectionLevel: "M" })))
      .then((u) => live && setUrls(u));
    return () => { live = false; };
  }, [frames]);
  useEffect(() => {
    if (frames.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % frames.length), ms);
    return () => clearInterval(t);
  }, [frames, ms]);
  if (!urls.length) return null;
  return <img src={urls[i % urls.length]} alt={label} className="mx-auto aspect-square w-full max-w-[360px] rounded-md bg-white p-2" />;
}

/** Camera scanner: calls onText for every QR read. A paste box backs it up when there is no camera. */
export function QrScanner({ onText }: { onText: (t: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const cb = useRef(onText);
  cb.current = onText;
  const [noCam, setNoCam] = useState(false);
  const [paste, setPaste] = useState("");
  useEffect(() => {
    let stream: MediaStream | undefined, raf = 0, last = "";
    const canvas = document.createElement("canvas");
    const tick = () => {
      const v = video.current;
      if (v && v.readyState >= 2 && v.videoWidth) {
        canvas.width = v.videoWidth; canvas.height = v.videoHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(v, 0, 0);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height);
        if (code?.data && code.data !== last) { last = code.data; cb.current(code.data); }
      }
      raf = requestAnimationFrame(tick);
    };
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => { stream = s; if (video.current) { video.current.srcObject = s; void video.current.play(); } raf = requestAnimationFrame(tick); })
      .catch(() => setNoCam(true));
    if (!navigator.mediaDevices) setNoCam(true);
    return () => { cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, []);
  return (
    <div>
      {!noCam && <video ref={video} muted playsInline className="mx-auto aspect-square w-full max-w-[360px] rounded-md bg-ink object-cover" />}
      {noCam && <p className="text-sm text-ink-2">Sin cámara: pega el código.</p>}
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); paste.split(/\s+/).filter(Boolean).forEach((t) => cb.current(t)); setPaste(""); }}>
        <input value={paste} onChange={(e) => setPaste(e.target.value)} aria-label="Pegar código" placeholder="Pegar código"
          className="h-12 min-w-0 flex-1 rounded-md border border-line bg-surface px-3" />
        <button className="h-12 rounded-md border border-line px-4 font-bold">Leer</button>
      </form>
    </div>
  );
}

/** Feeds scanner text into an async iterable for createQrTransport's `scan`. */
export function textQueue() {
  const buf: string[] = [];
  let wake: (() => void) | null = null;
  return {
    push(t: string) { buf.push(t); wake?.(); wake = null; },
    async *iter() { for (;;) { while (buf.length) yield buf.shift()!; await new Promise<void>((r) => (wake = r)); } },
  };
}
