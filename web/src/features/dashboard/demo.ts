import type { Debt, ExplainResponse } from "../../lib/contract";

// demo_data: true — fictitious debts until HACK-012's /api/deudas is reachable.
function debt(id: string, payer: string, amount: number, counter: number): Debt {
  return {
    id,
    iou: {
      ver: 1, payer_id: payer, merchant_id: "DEMOMERCHANT0000000000000", amount_cents: amount,
      counter, ts: 0, nonce: "", lat: 0, lon: 0, sig: "", raw: "",
    },
    status: "COBRO_ENVIADO", charge_target: "payer", pey_transaction_id: null,
    pey_codi_id: null, tracking_key: null, paid_at: null, attempts: [], alerts: [],
  };
}

export const demoDebts: Debt[] = [
  debt("DEMO-D001", "DEMOPAYER00000000000ANA001", 4500, 1),
  debt("DEMO-D002", "DEMOPAYER00000000000LUI002", 12000, 3),
  debt("DEMO-D003", "DEMOPAYER00000000000ROS003", 2850, 2),
];

export const demoExplanation: ExplainResponse = {
  texto: "Datos de demostración: 3 pagarés sincronizados, 0 duplicados, 0 rechazados.",
  cifras: { aceptados: 3, duplicadas: 0 },
  fuente: "plantilla",
};

export const demoPayerNames: Record<string, string> = {
  DEMOPAYER00000000000ANA001: "Ana",
  DEMOPAYER00000000000LUI002: "Luis",
  DEMOPAYER00000000000ROS003: "Rosa",
};
