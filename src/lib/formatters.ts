const numberFormatterCache = new Map<string, Intl.NumberFormat>();

type FormatNumberOptions = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  fallback?: string;
};

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatter(options: Intl.NumberFormatOptions) {
  const key = JSON.stringify(options);
  const cached = numberFormatterCache.get(key);
  if (cached) return cached;
  const created = new Intl.NumberFormat("es-BO", options);
  numberFormatterCache.set(key, created);
  return created;
}

export function formatNumber(value: unknown, options: FormatNumberOptions = {}) {
  const parsed = toFiniteNumber(value);
  if (parsed === null) return options.fallback ?? "No registrado";
  return formatter({
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    maximumFractionDigits: options.maximumFractionDigits ?? 1,
  }).format(parsed);
}

export function formatInteger(value: unknown, fallback = "No registrado") {
  const parsed = toFiniteNumber(value);
  if (parsed === null) return fallback;
  return formatter({ maximumFractionDigits: 0 }).format(Math.round(parsed));
}

export function formatPercent(value: unknown, fallback = "No calculado") {
  const parsed = toFiniteNumber(value);
  if (parsed === null) return fallback;
  return `${formatNumber(parsed, { maximumFractionDigits: 1 })} %`;
}

export function formatCurrencyBs(value: unknown, fallback = "No registrado") {
  const parsed = toFiniteNumber(value);
  if (parsed === null) return fallback;
  return `Bs ${formatter({ minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parsed)}`;
}

export function formatDate(value: unknown, fallback = "No registrado") {
  const date = parseDate(value);
  if (!date) return fallback;
  return new Intl.DateTimeFormat("es-BO", { dateStyle: "medium" }).format(date);
}

export function formatDateTime(value: unknown, fallback = "No registrado") {
  const date = parseDate(value);
  if (!date) return fallback;
  return new Intl.DateTimeFormat("es-BO", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatClinicalValue(value: unknown, unit?: string, fallback = "No registrado") {
  const parsed = toFiniteNumber(value);
  if (parsed === null) return fallback;
  return `${formatNumber(parsed)}${unit ? ` ${unit}` : ""}`;
}

export function formatMassKg(value: unknown) {
  return formatClinicalValue(value, "kg", "No registrado");
}

export function formatVolumeMl(value: unknown) {
  return formatClinicalValue(value, "ml", "No registrado");
}

export function formatEnergyKcal(value: unknown) {
  return formatClinicalValue(value, "kcal", "No calculado");
}

export function formatProteinG(value: unknown) {
  return formatClinicalValue(value, "g", "No calculado");
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}
