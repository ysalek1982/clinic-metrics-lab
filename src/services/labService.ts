import { supabase } from "@/integrations/supabase/client";

export type LabStatus = "ok" | "out_of_range" | "critical" | "pending";

export interface LabMarkerTrendPoint {
  resultedAt: string | null;
  value: number | null;
}

export interface LabMarkerResult {
  code: string;
  name: string;
  category: string;
  value: number | null;
  unit: string;
  delta: number | null;
  range: string;
  status: LabStatus;
  description: string;
  interpretation: string;
  recommendation: string;
  trend: LabMarkerTrendPoint[];
  resultedAt: string | null;
}

export interface LabPatientSummary {
  id: string;
  name: string;
  mrn: string;
  diagnosis: string;
  lastOrder: string | null;
  status: LabStatus;
  outsideCount: number;
  markers: LabMarkerResult[];
}

export interface LabTenantBundle {
  source: "supabase";
  orderCount: number;
  patients: LabPatientSummary[];
}

type LabOrderRow = {
  id: string;
  tenant_id: string;
  patient_id: string;
  ordered_at: string;
  resulted_at: string | null;
  status: string;
  provider: string | null;
  notes: string | null;
};

type LabResultRow = {
  id: string;
  tenant_id: string;
  lab_order_id: string;
  patient_id: string;
  marker_code: string;
  marker_name: string;
  category: string;
  value: number | string | null;
  unit: string;
  reference_low: number | string | null;
  reference_high: number | string | null;
  critical_low: number | string | null;
  critical_high: number | string | null;
  status: string;
  previous_value: number | string | null;
  delta_value: number | string | null;
  resulted_at: string | null;
};

type PatientRow = {
  id: string;
  mrn: string | null;
  first_name: string;
  last_name: string;
  diagnosis_summary: string | null;
};

type MarkerRow = {
  marker_code: string;
  description: string | null;
  nutritional_relevance: string | null;
};

type InterpretationRow = {
  marker_code: string;
  status: LabStatus;
  interpretation: string;
  recommendation: string | null;
};

type QueryResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

type SupabaseLabsClient = {
  auth: {
    getSession: () => Promise<{ data: { session: unknown | null } }>;
  };
  from: (table: string) => {
    select: (columns?: string) => unknown;
  };
};

function getLabsClient() {
  if (!supabase) {
    throw new Error("Supabase no está configurado para consultar laboratorios.");
  }
  return supabase as unknown as SupabaseLabsClient;
}

async function requireSession() {
  const client = getLabsClient();
  const { data } = await client.auth.getSession();
  if (!data.session) {
    throw new Error("No hay sesión clínica válida para consultar laboratorios.");
  }
}

function numberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeStatus(value: unknown): LabStatus {
  return value === "critical" || value === "out_of_range" || value === "pending" || value === "ok" ? value : "pending";
}

function resolveStatus(row: LabResultRow): LabStatus {
  const value = numberOrNull(row.value);
  if (value === null) return "pending";

  const criticalLow = numberOrNull(row.critical_low);
  const criticalHigh = numberOrNull(row.critical_high);
  if ((criticalLow !== null && value <= criticalLow) || (criticalHigh !== null && value >= criticalHigh)) {
    return "critical";
  }

  const referenceLow = numberOrNull(row.reference_low);
  const referenceHigh = numberOrNull(row.reference_high);
  if ((referenceLow !== null && value < referenceLow) || (referenceHigh !== null && value > referenceHigh)) {
    return "out_of_range";
  }

  return normalizeStatus(row.status) === "pending" ? "ok" : normalizeStatus(row.status);
}

function rangeLabel(row: Pick<LabResultRow, "reference_low" | "reference_high">) {
  const low = numberOrNull(row.reference_low);
  const high = numberOrNull(row.reference_high);
  if (low !== null && high !== null) return `${low} - ${high}`;
  if (low !== null) return `> ${low}`;
  if (high !== null) return `< ${high}`;
  return "Sin rango";
}

function statusRank(status: LabStatus) {
  if (status === "critical") return 4;
  if (status === "out_of_range") return 3;
  if (status === "pending") return 2;
  return 1;
}

function pickWorstStatus(statuses: LabStatus[]) {
  return statuses.reduce<LabStatus>((worst, status) => (statusRank(status) > statusRank(worst) ? status : worst), "ok");
}

async function runQuery<T>(query: unknown): Promise<T[]> {
  const { data, error } = (await query) as QueryResult<T>;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPatientLabOrders(tenantId: string, patientId: string) {
  await requireSession();
  const client = getLabsClient();
  const query = (client.from("lab_orders").select("*") as {
    eq: (column: string, value: string) => { eq: (column: string, value: string) => { is: (column: string, value: null) => { order: (column: string, options: { ascending: boolean }) => Promise<QueryResult<LabOrderRow>> } } };
  })
    .eq("tenant_id", tenantId)
    .eq("patient_id", patientId)
    .is("deleted_at", null)
    .order("resulted_at", { ascending: false });
  return runQuery<LabOrderRow>(query);
}

export async function getLabOrderResults(tenantId: string, labOrderId: string) {
  await requireSession();
  const client = getLabsClient();
  const query = (client.from("lab_results").select("*") as {
    eq: (column: string, value: string) => { eq: (column: string, value: string) => { order: (column: string, options: { ascending: boolean }) => Promise<QueryResult<LabResultRow>> } };
  })
    .eq("tenant_id", tenantId)
    .eq("lab_order_id", labOrderId)
    .order("marker_name", { ascending: true });
  return runQuery<LabResultRow>(query);
}

export async function getMarkerHistory(tenantId: string, patientId: string, markerCode: string) {
  await requireSession();
  const client = getLabsClient();
  const query = (client.from("lab_results").select("*") as {
    eq: (column: string, value: string) => { eq: (column: string, value: string) => { eq: (column: string, value: string) => { order: (column: string, options: { ascending: boolean }) => Promise<QueryResult<LabResultRow>> } } };
  })
    .eq("tenant_id", tenantId)
    .eq("patient_id", patientId)
    .eq("marker_code", markerCode)
    .order("resulted_at", { ascending: true });
  return runQuery<LabResultRow>(query);
}

export async function getMarkerInterpretation(markerCode: string, status: LabStatus) {
  await requireSession();
  const client = getLabsClient();
  const query = (client.from("lab_interpretations").select("marker_code,status,interpretation,recommendation") as {
    eq: (column: string, value: string) => { eq: (column: string, value: string) => { limit: (count: number) => Promise<QueryResult<InterpretationRow>> } };
  })
    .eq("marker_code", markerCode)
    .eq("status", status)
    .limit(1);
  const rows = await runQuery<InterpretationRow>(query);
  return rows[0] ?? null;
}

export async function listLabPatients(tenantId: string | null): Promise<LabTenantBundle> {
  if (!tenantId) {
    throw new Error("No hay tenant activo para consultar laboratorios.");
  }

  await requireSession();
  const client = getLabsClient();

  const orders = await runQuery<LabOrderRow>(
    ((client.from("lab_orders").select("*") as {
      eq: (column: string, value: string) => { is: (column: string, value: null) => { order: (column: string, options: { ascending: boolean }) => Promise<QueryResult<LabOrderRow>> } };
    })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("resulted_at", { ascending: false })),
  );

  if (orders.length === 0) {
    return { source: "supabase", orderCount: 0, patients: [] };
  }

  const patientIds = Array.from(new Set(orders.map((order) => order.patient_id)));
  const orderIds = orders.map((order) => order.id);

  const patients = await runQuery<PatientRow>(
    ((client.from("patients").select("id,mrn,first_name,last_name,diagnosis_summary") as {
      eq: (column: string, value: string) => { in: (column: string, values: string[]) => Promise<QueryResult<PatientRow>> };
    })
      .eq("tenant_id", tenantId)
      .in("id", patientIds)),
  );

  const results = await runQuery<LabResultRow>(
    ((client.from("lab_results").select("*") as {
      eq: (column: string, value: string) => { in: (column: string, values: string[]) => { order: (column: string, options: { ascending: boolean }) => Promise<QueryResult<LabResultRow>> } };
    })
      .eq("tenant_id", tenantId)
      .in("lab_order_id", orderIds)
      .order("resulted_at", { ascending: true })),
  );

  const markerCodes = Array.from(new Set(results.map((result) => result.marker_code)));
  const markers = markerCodes.length
    ? await runQuery<MarkerRow>(
        ((client.from("lab_markers").select("marker_code,description,nutritional_relevance") as {
          in: (column: string, values: string[]) => Promise<QueryResult<MarkerRow>>;
        }).in("marker_code", markerCodes)),
      )
    : [];

  const interpretations = markerCodes.length
    ? await runQuery<InterpretationRow>(
        ((client.from("lab_interpretations").select("marker_code,status,interpretation,recommendation") as {
          in: (column: string, values: string[]) => Promise<QueryResult<InterpretationRow>>;
        }).in("marker_code", markerCodes)),
      )
    : [];

  const patientById = new Map(patients.map((patient) => [patient.id, patient]));
  const markerByCode = new Map(markers.map((marker) => [marker.marker_code, marker]));
  const interpretationByKey = new Map(interpretations.map((row) => [`${row.marker_code}:${row.status}`, row]));
  const resultsByOrder = new Map<string, LabResultRow[]>();
  const resultsByPatientMarker = new Map<string, LabResultRow[]>();

  for (const result of results) {
    resultsByOrder.set(result.lab_order_id, [...(resultsByOrder.get(result.lab_order_id) ?? []), result]);
    const historyKey = `${result.patient_id}:${result.marker_code}`;
    resultsByPatientMarker.set(historyKey, [...(resultsByPatientMarker.get(historyKey) ?? []), result]);
  }

  const latestOrderByPatient = new Map<string, LabOrderRow>();
  for (const order of orders) {
    if (!latestOrderByPatient.has(order.patient_id)) {
      latestOrderByPatient.set(order.patient_id, order);
    }
  }

  const summaries = Array.from(latestOrderByPatient.values()).map<LabPatientSummary>((order) => {
    const patient = patientById.get(order.patient_id);
    const orderResults = resultsByOrder.get(order.id) ?? [];
    const markersForPatient = orderResults.map<LabMarkerResult>((result) => {
      const status = resolveStatus(result);
      const marker = markerByCode.get(result.marker_code);
      const interpretation = interpretationByKey.get(`${result.marker_code}:${status}`);
      const history = (resultsByPatientMarker.get(`${result.patient_id}:${result.marker_code}`) ?? [])
        .sort((left, right) => String(left.resulted_at ?? "").localeCompare(String(right.resulted_at ?? "")))
        .map((item) => ({
          resultedAt: item.resulted_at,
          value: numberOrNull(item.value),
        }));

      return {
        code: result.marker_code,
        name: result.marker_name,
        category: result.category,
        value: numberOrNull(result.value),
        unit: result.unit,
        delta: numberOrNull(result.delta_value),
        range: rangeLabel(result),
        status,
        description: marker?.description ?? "Descripción clínica pendiente de configurar para este marcador.",
        interpretation: interpretation?.interpretation ?? "Interpretación pendiente de configurar para este marcador.",
        recommendation: interpretation?.recommendation ?? "Configura una recomendación institucional para este marcador.",
        trend: history,
        resultedAt: result.resulted_at,
      };
    });
    const outsideCount = markersForPatient.filter((marker) => marker.status === "out_of_range" || marker.status === "critical").length;

    return {
      id: order.patient_id,
      name: patient ? `${patient.first_name} ${patient.last_name}` : "Paciente sin ficha",
      mrn: patient?.mrn ?? "Sin MRN",
      diagnosis: patient?.diagnosis_summary ?? "Diagnóstico no registrado",
      lastOrder: order.resulted_at ?? order.ordered_at,
      status: pickWorstStatus(markersForPatient.map((marker) => marker.status)),
      outsideCount,
      markers: markersForPatient,
    };
  });

  return { source: "supabase", orderCount: orders.length, patients: summaries };
}
