import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Search, ShieldAlert } from "lucide-react";
import { useLabs } from "@/hooks/useLabs";
import { formatClinicalValue, formatDateTime as formatDateTimeDisplay } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { LabStatus } from "@/services/labService";
import { normalizeLabPatients, type DisplayLabMarker, type DisplayLabPatient } from "./labs-utils";

const demoPatients: DisplayLabPatient[] = [
  {
    id: "p-001",
    name: "Andres Mejia Vargas",
    mrn: "HSM-48291",
    diagnosis: "EPOC reagudizado",
    lastOrder: "2026-04-22T14:22:00Z",
    status: "critical",
    outsideCount: 2,
    markers: [
      {
        code: "albumin",
        name: "Albumina",
        category: "Proteinas viscerales",
        value: 2.9,
        unit: "g/dL",
        delta: -0.4,
        range: "3.5 - 5.2",
        status: "out_of_range",
        description: "Marcador indirecto de estado inflamatorio, soporte proteico y evolucion clinica.",
        interpretation: "Valor bajo con deterioro frente al control previo. Requiere correlacion con PCR, ingesta y balance hidrico.",
        recommendation: "Priorizar intervencion nutricional y revisar tolerancia del soporte enteral.",
        trend: [
          { resultedAt: "2026-04-01T14:00:00Z", value: 3.7 },
          { resultedAt: "2026-04-08T14:00:00Z", value: 3.4 },
          { resultedAt: "2026-04-15T14:00:00Z", value: 3.3 },
          { resultedAt: "2026-04-22T14:22:00Z", value: 2.9 },
        ],
        resultedAt: "2026-04-22T14:22:00Z",
      },
      {
        code: "crp",
        name: "PCR",
        category: "Inflamacion",
        value: 42,
        unit: "mg/L",
        delta: 18,
        range: "< 40",
        status: "critical",
        description: "Proteina C reactiva para seguimiento de respuesta inflamatoria sistemica.",
        interpretation: "Inflamacion activa. La albumina debe interpretarse como reactante negativo de fase aguda.",
        recommendation: "No ajustar requerimientos solo por albumina; integrar diagnostico clinico y balance nitrogenado.",
        trend: [
          { resultedAt: "2026-04-01T14:00:00Z", value: 18 },
          { resultedAt: "2026-04-08T14:00:00Z", value: 24 },
          { resultedAt: "2026-04-15T14:00:00Z", value: 31 },
          { resultedAt: "2026-04-22T14:22:00Z", value: 42 },
        ],
        resultedAt: "2026-04-22T14:22:00Z",
      },
      {
        code: "sodium",
        name: "Sodio",
        category: "Electrolitos",
        value: 137,
        unit: "mmol/L",
        delta: 1,
        range: "135 - 145",
        status: "ok",
        description: "Electrolito principal para evaluar hidratacion y seguridad de soporte nutricional.",
        interpretation: "Dentro de rango de referencia.",
        recommendation: "Mantener monitoreo segun protocolo institucional.",
        trend: [
          { resultedAt: "2026-04-01T14:00:00Z", value: 136 },
          { resultedAt: "2026-04-08T14:00:00Z", value: 136 },
          { resultedAt: "2026-04-15T14:00:00Z", value: 137 },
          { resultedAt: "2026-04-22T14:22:00Z", value: 137 },
        ],
        resultedAt: "2026-04-22T14:22:00Z",
      },
    ],
  },
  {
    id: "p-002",
    name: "Sofia Caicedo Lopez",
    mrn: "HSM-48292",
    diagnosis: "Retraso pondoestatural leve",
    lastOrder: "2026-04-19T16:00:00Z",
    status: "out_of_range",
    outsideCount: 2,
    markers: [
      {
        code: "hemoglobin",
        name: "Hemoglobina",
        category: "Hematologia",
        value: 10.8,
        unit: "g/dL",
        delta: -0.7,
        range: "11.5 - 15.5",
        status: "out_of_range",
        description: "Indicador hematologico relevante para tamizaje de anemia y estado de hierro.",
        interpretation: "Hemoglobina por debajo del rango esperado. Evaluar ferritina, VCM e ingesta de hierro.",
        recommendation: "Solicitar o revisar ferritina y reforzar plan alimentario rico en hierro biodisponible.",
        trend: [
          { resultedAt: "2026-04-01T16:00:00Z", value: 12.1 },
          { resultedAt: "2026-04-08T16:00:00Z", value: 11.7 },
          { resultedAt: "2026-04-12T16:00:00Z", value: 11.5 },
          { resultedAt: "2026-04-19T16:00:00Z", value: 10.8 },
        ],
        resultedAt: "2026-04-19T16:00:00Z",
      },
      {
        code: "ferritin",
        name: "Ferritina",
        category: "Hierro",
        value: null,
        unit: "ng/mL",
        delta: null,
        range: "15 - 150",
        status: "pending",
        description: "Reserva corporal de hierro; debe interpretarse con inflamacion y contexto clinico.",
        interpretation: "Resultado pendiente. No clasificar estado de hierro hasta recibir el marcador.",
        recommendation: "Mantener seguimiento y completar orden bioquimica.",
        trend: [
          { resultedAt: "2026-04-01T16:00:00Z", value: 22 },
          { resultedAt: "2026-04-12T16:00:00Z", value: 18 },
        ],
        resultedAt: "2026-04-19T16:00:00Z",
      },
    ],
  },
];

function statusLabel(status: LabStatus) {
  if (status === "ok") return "OK";
  if (status === "out_of_range") return "FUERA";
  if (status === "critical") return "CRÍTICO";
  return "PENDIENTE";
}

function statusClasses(status: LabStatus) {
  if (status === "ok") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  if (status === "out_of_range") return "border-orange-500/40 bg-orange-500/10 text-orange-300";
  if (status === "critical") return "border-red-500/50 bg-red-500/10 text-red-300";
  return "border-yellow-400/40 bg-yellow-400/10 text-yellow-200";
}

function statusDot(status: LabStatus) {
  if (status === "ok") return "bg-emerald-400";
  if (status === "out_of_range") return "bg-orange-400";
  if (status === "critical") return "bg-red-400";
  return "bg-yellow-300";
}

function formatDateTime(value: string | null) {
  return formatDateTimeDisplay(value, "Sin fecha");
}

function formatValue(value: number | string | null, unit?: string) {
  if (value === null || value === "") return "Pendiente";
  if (typeof value === "number") return formatClinicalValue(value, unit, "Pendiente");
  return unit ? `${value} ${unit}` : value;
}

function formatDelta(delta: number | string | null) {
  if (delta === null || delta === "") return "-";
  if (typeof delta === "number") return delta > 0 ? `+${delta}` : String(delta);
  return delta;
}

function LabStatusBadge({ status }: { status: LabStatus }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider", statusClasses(status))}>
      {statusLabel(status)}
    </span>
  );
}

function TrendPreview({ marker }: { marker: DisplayLabMarker }) {
  const values = marker.trend.filter((point) => typeof point.value === "number") as Array<{ resultedAt: string | null; value: number }>;
  const points = useMemo(() => {
    if (values.length < 2) return "";
    const rawValues = values.map((point) => point.value);
    const min = Math.min(...rawValues);
    const max = Math.max(...rawValues);
    const span = max - min || 1;
    return rawValues
      .map((value, index) => {
        const x = (index / Math.max(rawValues.length - 1, 1)) * 100;
        const y = 44 - ((value - min) / span) * 34;
        return `${x},${y}`;
      })
      .join(" ");
  }, [values]);

  if (values.length < 2) {
    return (
      <div className="rounded-xl border border-border bg-black/20 p-4 text-sm leading-6 text-muted-foreground">
        No hay suficientes resultados históricos para graficar tendencia.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-black/20 p-3">
      <svg viewBox="0 0 100 52" className="h-24 w-full overflow-visible">
        <line x1="0" x2="100" y1="44" y2="44" stroke="#253042" strokeDasharray="4 4" />
        <line x1="0" x2="100" y1="10" y2="10" stroke="#253042" strokeDasharray="4 4" />
        <polyline points={points} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.split(" ").map((point) => {
          const [x, y] = point.split(",");
          return <circle key={point} cx={x} cy={y} r="2.6" fill="#22d3ee" />;
        })}
      </svg>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>{formatDateTime(values[0].resultedAt)}</span>
        <span>{formatDateTime(values[values.length - 1].resultedAt)}</span>
      </div>
    </div>
  );
}

function LabsState({ title, description, variant }: { title: string; description: string; variant: "empty" | "loading" | "error" | "forbidden" }) {
  const Icon = variant === "error" || variant === "forbidden" ? ShieldAlert : variant === "loading" ? Clock3 : AlertTriangle;
  return (
    <div className="grid min-h-[520px] place-items-center p-6">
      <div className="max-w-xl rounded-2xl border border-border bg-card/80 p-8 text-center shadow-2xl shadow-black/20">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default function Labs() {
  const labs = useLabs();
  const patients = useMemo<DisplayLabPatient[]>(
    () => normalizeLabPatients(labs.isDemoMode ? demoPatients : labs.data?.patients ?? []),
    [labs.data?.patients, labs.isDemoMode],
  );
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id ?? "");
  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) ?? patients[0] ?? null;
  const [selectedMarkerCode, setSelectedMarkerCode] = useState<string>(selectedPatient?.markers[0]?.code ?? "");
  const selectedMarker = selectedPatient?.markers.find((marker) => marker.code === selectedMarkerCode) ?? selectedPatient?.markers[0] ?? null;

  useEffect(() => {
    if (!patients.some((patient) => patient.id === selectedPatientId)) {
      setSelectedPatientId(patients[0]?.id ?? "");
    }
  }, [patients, selectedPatientId]);

  useEffect(() => {
    if (!selectedPatient?.markers.some((marker) => marker.code === selectedMarkerCode)) {
      setSelectedMarkerCode(selectedPatient?.markers[0]?.code ?? "");
    }
  }, [selectedMarkerCode, selectedPatient]);

  function selectPatient(patientId: string) {
    const nextPatient = patients.find((patient) => patient.id === patientId);
    setSelectedPatientId(patientId);
    setSelectedMarkerCode(nextPatient?.markers[0]?.code ?? "");
  }

  if (labs.tenantLoading || labs.isLoading) {
    return (
      <div>
        <LabsHeader orderCount={0} mode="Cargando" />
        <LabsState title="Cargando laboratorios" description="Consultando órdenes y resultados del tenant activo." variant="loading" />
      </div>
    );
  }

  if (!labs.isDemoMode && !labs.activeTenantId) {
    return (
      <div>
        <LabsHeader orderCount={0} mode="Sin acceso" />
        <LabsState title="Sin tenant clínico activo" description="Tu usuario no tiene un tenant activo para consultar datos de laboratorio." variant="forbidden" />
      </div>
    );
  }

  if (labs.isError) {
    return (
      <div>
        <LabsHeader orderCount={0} mode="Error" />
        <LabsState title="Error de conexión" description={labs.error instanceof Error ? labs.error.message : "No se pudieron consultar los laboratorios reales."} variant="error" />
      </div>
    );
  }

  if (!labs.isDemoMode && patients.length === 0) {
    return (
      <div>
        <LabsHeader orderCount={0} mode="Datos reales" />
        <LabsState
          title="Aún no hay datos reales de laboratorio configurados para este tenant."
          description="Cuando existan órdenes y resultados de laboratorio del tenant activo, esta pantalla mostrará pacientes, marcadores, tendencias e interpretaciones reales."
          variant="empty"
        />
      </div>
    );
  }

  if (!selectedPatient || !selectedMarker) {
    return (
      <div>
        <LabsHeader orderCount={0} mode={labs.isDemoMode ? "Vista demo" : "Datos reales"} />
        <LabsState title="Sin marcadores disponibles" description="No hay resultados de laboratorio para el paciente seleccionado." variant="empty" />
      </div>
    );
  }

  const orderCount = labs.data?.orderCount ?? 0;

  return (
    <div>
      <LabsHeader orderCount={orderCount} mode={labs.isDemoMode ? "Vista demo" : "Datos reales"} />

      <div className="grid gap-4 p-4 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
        <aside className="rounded-2xl border border-border bg-card/80">
          <div className="border-b border-border p-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Pacientes con labs</div>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-black/20 px-3 py-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              Buscar paciente
            </div>
          </div>
          <div className="space-y-2 p-3">
            {patients.map((patient) => (
              <button
                key={patient.id}
                type="button"
                onClick={() => selectPatient(patient.id)}
                className={cn(
                  "w-full rounded-xl border px-3 py-3 text-left transition hover:border-cyan-400/40 hover:bg-cyan-400/5",
                  selectedPatient.id === patient.id ? "border-cyan-400/50 bg-cyan-400/10" : "border-transparent",
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn("h-2 w-2 rounded-full", statusDot(patient.status))} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{patient.name}</div>
                    <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{patient.mrn}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="rounded-2xl border border-border bg-card/80">
          <div className="border-b border-border p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Paciente seleccionado</div>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">{selectedPatient.name}</h2>
                <div className="mt-2 flex flex-wrap gap-3 font-mono text-[12px] text-muted-foreground">
                  <span>{selectedPatient.mrn}</span>
                  <span>·</span>
                  <span>{selectedPatient.diagnosis}</span>
                </div>
              </div>
              <div className="grid gap-2 text-right">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Última orden</span>
                <span className="font-mono text-sm text-foreground">{formatDateTime(selectedPatient.lastOrder)}</span>
                <span className="text-sm text-orange-300">{selectedPatient.outsideCount} fuera de rango</span>
              </div>
            </div>
          </div>

          <div className="overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="border-b border-border bg-surface-raised/30 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-normal">Marcador</th>
                  <th className="px-5 py-3 text-left font-normal">Categoría</th>
                  <th className="px-5 py-3 text-left font-normal">Actual</th>
                  <th className="px-5 py-3 text-left font-normal">Delta vs prev.</th>
                  <th className="px-5 py-3 text-left font-normal">Rango</th>
                  <th className="px-5 py-3 text-left font-normal">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {selectedPatient.markers.map((marker) => (
                  <tr
                    key={marker.code}
                    onClick={() => setSelectedMarkerCode(marker.code)}
                    className={cn("cursor-pointer transition hover:bg-cyan-400/5", selectedMarker.code === marker.code && "bg-cyan-400/10")}
                  >
                    <td className="px-5 py-4 font-semibold text-foreground">{marker.name}</td>
                    <td className="px-5 py-4 text-muted-foreground">{marker.category}</td>
                    <td className="px-5 py-4 font-mono text-foreground">{formatValue(marker.value, marker.unit)}</td>
                    <td
                      className={cn(
                        "px-5 py-4 font-mono",
                        typeof marker.delta === "number" && marker.delta < 0
                          ? "text-orange-300"
                          : typeof marker.delta === "number" && marker.delta > 0
                            ? "text-emerald-300"
                            : "text-muted-foreground",
                      )}
                    >
                      {formatDelta(marker.delta)}
                    </td>
                    <td className="px-5 py-4 font-mono text-muted-foreground">{marker.range}</td>
                    <td className="px-5 py-4"><LabStatusBadge status={marker.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>

        <aside className="rounded-2xl border border-border bg-card/80 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Marcador seleccionado</div>
              <h3 className="mt-2 text-xl font-semibold text-foreground">{selectedMarker.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{selectedMarker.category}</p>
            </div>
            <LabStatusBadge status={selectedMarker.status} />
          </div>

          <div className="mt-6 space-y-5">
            <section>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Descripción clínica</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedMarker.description}</p>
            </section>

            <section>
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Tendencia longitudinal</div>
              <TrendPreview marker={selectedMarker} />
            </section>

            <section className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-black/20 p-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Actual</div>
                <div className="mt-1 text-lg font-semibold text-foreground">{formatValue(selectedMarker.value, selectedMarker.unit)}</div>
              </div>
              <div className="rounded-xl border border-border bg-black/20 p-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Rango ref.</div>
                <div className="mt-1 font-mono text-sm text-foreground">{selectedMarker.range}</div>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-surface-raised/30 p-4">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300">
                <CheckCircle2 className="h-4 w-4" />
                Interpretación nutricional
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{selectedMarker.interpretation}</p>
              <div className="mt-4 border-t border-border pt-4 text-sm leading-6 text-foreground">{selectedMarker.recommendation}</div>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}

function LabsHeader({ orderCount, mode }: { orderCount: number; mode: string }) {
  return (
    <header className="border-b border-border px-4 py-6 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Bioquímica clínica</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Centro de laboratorios</h1>
          <p className="mt-2 text-base text-muted-foreground">{orderCount} órdenes · interpretación nutricional cruzada</p>
        </div>
        <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-cyan-200">
          {mode}
        </span>
      </div>
    </header>
  );
}
