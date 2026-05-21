import type { LabMarkerResult, LabPatientSummary } from "@/services/labService";

export type DisplayLabMarker = Omit<LabMarkerResult, "value" | "delta"> & {
  value: number | string | null;
  delta: number | string | null;
};

export type DisplayLabPatient = Omit<LabPatientSummary, "markers"> & {
  markers: DisplayLabMarker[];
};

export function normalizeLabPatients(source: LabPatientSummary[] | DisplayLabPatient[]): DisplayLabPatient[] {
  return source.map((patient, patientIndex) => {
    const markers = Array.isArray(patient.markers) ? patient.markers : [];

    return {
      ...patient,
      id: patient.id || `patient-${patientIndex}`,
      name: patient.name || "Paciente sin nombre",
      mrn: patient.mrn || "MRN no registrado",
      diagnosis: patient.diagnosis || "Sin diagnóstico registrado",
      lastOrder: patient.lastOrder ?? null,
      status: patient.status ?? "pending",
      outsideCount: patient.outsideCount ?? 0,
      markers: markers.map((marker, markerIndex) => ({
        ...marker,
        code: marker.code || `marker-${markerIndex}`,
        name: marker.name || "Marcador sin nombre",
        category: marker.category || "Sin categoría",
        value: marker.value ?? null,
        unit: marker.unit || "",
        delta: marker.delta ?? null,
        range: marker.range || "Sin rango",
        status: marker.status ?? "pending",
        description: marker.description || "Sin descripción registrada.",
        interpretation: marker.interpretation || "Sin interpretación registrada.",
        recommendation: marker.recommendation || "Sin acción registrada.",
        trend: Array.isArray(marker.trend) ? marker.trend : [],
        resultedAt: marker.resultedAt ?? null,
      })),
    };
  });
}
