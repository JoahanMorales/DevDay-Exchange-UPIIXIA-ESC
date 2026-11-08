import { useEffect, useRef, useState } from "react";
import type { FeatureRoute } from "../../App";
import { useOnline } from "../../lib/ui";
import { confirmProposal, discardProposal, EMPTY, propose, type Proposal, type VoiceState } from "./proposal";
import { startVoice, type VoiceHandle } from "./realtime";
import { Voice, type MicState } from "./Voice";

function VozPage() {
  const online = useOnline();
  const [state, setState] = useState<VoiceState>(EMPTY);
  const [mic, setMic] = useState<MicState>("off");
  const [error, setError] = useState<string>();
  const handle = useRef<VoiceHandle | null>(null);

  const stop = () => {
    handle.current?.stop();
    handle.current = null;
  };
  useEffect(() => {
    if (!online) stop(); // offline: the keypad stays, the voice goes away
  }, [online]);
  useEffect(() => stop, []);

  const onStart = async () => {
    setError(undefined);
    setMic("starting");
    try {
      handle.current = await startVoice(
        (p: Proposal) => setState((s) => propose(s, p)),
        () => setMic("off"),
      );
      setMic("listening");
    } catch {
      setMic("error");
      setError("No pude abrir la voz. Usa el teclado; tus cobros no se afectan.");
    }
  };

  return (
    <Voice
      online={online}
      state={state}
      mic={mic}
      error={error}
      onStart={onStart}
      onStop={stop}
      onConfirm={(p) => setState((s) => confirmProposal(s, p))}
      onDiscard={(p) => setState((s) => discardProposal(s, p))}
    />
  );
}

// No nav label: the bar already has 6 entries; the voice helper is reached from /voz.
export const route: FeatureRoute = { path: "/voz", element: <VozPage /> };
