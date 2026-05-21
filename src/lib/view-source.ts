export type DataSource = "supabase" | "demo" | null | undefined;
export type ViewSourceState = "real" | "fallback" | "demo";

export function resolveViewSource(options: {
  isAuthenticated: boolean;
  sources: DataSource[];
}): ViewSourceState {
  const normalized = options.sources.filter((source): source is "supabase" | "demo" => Boolean(source));

  if (!options.isAuthenticated) {
    return "demo";
  }

  if (normalized.length === 0) {
    return "fallback";
  }

  if (normalized.every((source) => source === "supabase")) {
    return "real";
  }

  return "fallback";
}

export function viewSourceLabel(source: ViewSourceState) {
  const labels: Record<ViewSourceState, string> = {
    real: "Datos reales",
    fallback: "Fallback visual",
    demo: "Modo demo",
  };

  return labels[source];
}

export function viewSourceDescription(source: ViewSourceState) {
  const descriptions: Record<ViewSourceState, string> = {
    real: "Consultando Supabase en el tenant activo.",
    fallback: "Vista completa con soporte visual mientras faltan datos remotos.",
    demo: "Preventa o exploración sin sesión institucional.",
  };

  return descriptions[source];
}

