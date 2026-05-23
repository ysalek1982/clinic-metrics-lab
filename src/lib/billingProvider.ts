export type BillingProvider = "none" | "stripe" | "manual";

export type CheckoutSessionRequest = {
  tenantId: string;
  planCode: string;
  successUrl: string;
  cancelUrl: string;
};

export type BillingPortalRequest = {
  tenantId: string;
  returnUrl: string;
};

export type WebhookEvent = {
  provider: BillingProvider;
  eventType: string;
  payload: Record<string, unknown>;
};

export function getBillingProviderStatus() {
  return {
    provider: "none" as BillingProvider,
    enabled: false,
    label: "Pagos en linea pendientes",
  };
}

export function explainBillingUnavailable() {
  return "Pagos en linea: pendiente de integracion. No se ejecutan cobros, no se guardan tarjetas y no hay proveedor activo en esta version.";
}
