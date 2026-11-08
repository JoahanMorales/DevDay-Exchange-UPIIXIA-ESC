import { useState } from "react";
import type { FeatureRoute } from "../../App";
import { useOnline } from "../../lib/ui";
import { Assistant, type AskState } from "./Assistant";
import { askAssistant, friendlyError } from "./ask";

function AsistentePage() {
  const online = useOnline();
  const merchant = new URLSearchParams(location.search).get("merchant_id") ?? "";
  const [state, setState] = useState<AskState>({ kind: "idle" });

  const onAsk = async (question: string) => {
    if (!merchant) {
      setState({ kind: "error", message: "falta indicar el comercio en la dirección." });
      return;
    }
    setState({ kind: "loading" });
    try {
      setState({ kind: "done", question, answer: await askAssistant(merchant, question) });
    } catch (e) {
      setState({ kind: "error", message: friendlyError(e) });
    }
  };

  return <Assistant online={online} state={state} onAsk={onAsk} />;
}

export const route: FeatureRoute = { path: "/asistente", element: <AsistentePage />, label: "Asistente" };
