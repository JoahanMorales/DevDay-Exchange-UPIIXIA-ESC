import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Button } from "../../lib/ui";

/** Camera scanner for the animated QR hand-off. Calls onText with each new decoded payload. */
export function Scanner({ onText }: { onText: (text: string) => void }) {
  const [on, setOn] = useState(false);
  const [error, setError] = useState("");
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!on) return;
    let stop = false;
    let stream: MediaStream | undefined;
    const canvas = document.createElement("canvas");
    let last = "";
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const v = video.current!;
        v.srcObject = stream;
        await v.play();
        const tick = () => {
          if (stop) return;
          if (v.videoWidth) {
            canvas.width = v.videoWidth;
            canvas.height = v.videoHeight;
            const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
            ctx.drawImage(v, 0, 0);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(img.data, img.width, img.height);
            if (code && code.data !== last) { last = code.data; onText(code.data); }
          }
          requestAnimationFrame(tick);
        };
        tick();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo abrir la cámara");
        setOn(false);
      }
    })();
    return () => { stop = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, [on, onText]);

  return (
    <div className="mt-6">
      <Button variant="ghost" size="lg" onClick={() => setOn((v) => !v)} aria-pressed={on}>
        {on ? "Dejar de recibir" : "Recibir pagarés por QR"}
      </Button>
      {error && <p role="alert" className="mt-2 text-base text-bad">{error}</p>}
      {on && <video ref={video} muted playsInline className="mt-3 w-full max-w-sm rounded-md" />}
    </div>
  );
}
