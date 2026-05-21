const ACTION_WORDS =
  /crear|nuevo|guardar|exportar|pdf|excel|descargar|generar|invitar|enviar|cerrar|pausar|resolver|imprimir|asignar|gestionar|eliminar|borrar/i;
const HIGH_RISK_ACTION_WORDS = /eliminar|borrar|cerrar|pausar|resolver|invitar|asignar|gestionar|exportar|pdf|excel|generar/i;
const LIMITATION_WORDS = /pr(?:o|\u00f3)ximamente|pendiente|requiere|dashboard|edge function|deshabilitad|sin credencial/i;
const MOJIBAKE_PATTERN = new RegExp("[\\u00c3\\u00c2\\ufffd]");

export function detectMojibake(text) {
  return MOJIBAKE_PATTERN.test(text ?? "");
}

export function detectErrorBoundary(text) {
  return /no se pudo renderizar|errorboundary/i.test(text ?? "");
}

export function detectUndefinedData(text) {
  return /undefined\.data|cannot read properties of undefined/i.test(text ?? "");
}

export function detectUnsafeCopilotClaims(text) {
  return /ia generativa activa|diagn[oó]stico probable|debe administrarse|recomiendo dosis|pron[oó]stico probable/i.test(text ?? "");
}

export function detectEmptyDom(text, elementCount = 0) {
  return (text ?? "").trim().length < 12 && elementCount < 3;
}

export function isRiskyAction(button) {
  return classifyUiAction(button).kind === "risky";
}

export function classifyUiAction(button) {
  const label = `${button?.text ?? ""} ${button?.title ?? ""} ${button?.href ?? ""}`.trim();
  if (!ACTION_WORDS.test(label)) return { kind: "neutral", risk: "none", reason: "sin_accion_sensible" };
  if (button?.disabled || button?.ariaDisabled === "true" || LIMITATION_WORDS.test(label)) {
    return { kind: "limited", risk: "none", reason: "deshabilitado_o_limitado" };
  }
  if (button?.href) return { kind: "navigation", risk: "none", reason: "enlace_real" };
  if (button?.hasHandler || button?.type === "submit" || button?.formAssociated) {
    return { kind: "functional_probable", risk: "none", reason: "handler_o_submit" };
  }
  return {
    kind: "risky",
    risk: HIGH_RISK_ACTION_WORDS.test(label) ? "high" : "medium",
    reason: "sin_handler_href_disabled",
  };
}

export function analyzeRouteSnapshot(input) {
  const bodyText = input.bodyText ?? "";
  const elementCount = input.elementCount ?? 0;
  const riskyButtons = (input.visibleButtons ?? []).filter(isRiskyAction);
  const findings = [
    detectEmptyDom(bodyText, elementCount) ? "pantalla_vacia" : null,
    detectErrorBoundary(bodyText) ? "error_boundary_visible" : null,
    detectUndefinedData(bodyText) ? "undefined_data_visible" : null,
    detectMojibake(bodyText) ? "mojibake_visible" : null,
    detectUnsafeCopilotClaims(bodyText) ? "copilot_promesa_clinica" : null,
    input.authenticated && /\bDEMO\b/i.test(bodyText) ? "demo_autenticado_visible" : null,
    riskyButtons.length > 0 ? "botones_riesgo_visibles" : null,
    (input.pageErrors ?? []).length > 0 ? "pageerror" : null,
  ].filter(Boolean);

  return { findings, riskyButtons };
}

export function scoreRouteSnapshot(input) {
  const bodyText = input.bodyText ?? "";
  const elementCount = input.elementCount ?? 0;
  const actions = input.visibleButtons ?? [];
  const classifiedActions = actions.map((action) => ({ ...action, classification: classifyUiAction(action) }));
  const highRiskActions = classifiedActions.filter((action) => action.classification.risk === "high");
  const mediumRiskActions = classifiedActions.filter((action) => action.classification.risk === "medium");
  const findings = analyzeRouteSnapshot(input).findings;

  const renderScore = findings.some((item) =>
    ["pantalla_vacia", "error_boundary_visible", "undefined_data_visible", "copilot_promesa_clinica", "pageerror"].includes(item),
  )
    ? 0
    : 100;
  const contentScore = bodyText.trim().length > 120 && elementCount > 12 ? 100 : bodyText.trim().length > 40 ? 70 : 35;
  const accessibilityScore = actions.every((action) => `${action.text ?? ""} ${action.title ?? ""}`.trim().length > 0)
    ? 100
    : 70;
  const actionRiskScore = Math.max(0, 100 - highRiskActions.length * 35 - mediumRiskActions.length * 15);
  const demoRisk = input.authenticated && /\bDEMO\b/i.test(bodyText) ? "high" : "none";
  const mojibakeRisk = detectMojibake(bodyText) ? "high" : "none";
  const finalStatus =
    renderScore === 0 || demoRisk === "high" || mojibakeRisk === "high" || highRiskActions.length > 0
      ? "fail"
      : mediumRiskActions.length > 0 || contentScore < 70
        ? "warn"
        : "pass";

  return {
    renderScore,
    contentScore,
    accessibilityScore,
    actionRiskScore,
    demoRisk,
    mojibakeRisk,
    finalStatus,
    highRiskActions,
    mediumRiskActions,
    classifiedActions,
  };
}

export function sanitizeRouteName(route) {
  return (route || "root").replace(/^\/+/, "").replace(/[^a-zA-Z0-9-]+/g, "-").replace(/-+$/g, "") || "root";
}
