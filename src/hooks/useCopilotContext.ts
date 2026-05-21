import { useMemo } from "react";
import { useUpcomingAppointments } from "@/hooks/useAppointments";
import {
  useTenantAlerts,
  useTenantNutritionPlans,
  useTenantPatients,
  useTenantReports,
} from "@/hooks/useClinicalData";
import { useGrowthReferences } from "@/hooks/useGrowthReferences";
import { useLabs } from "@/hooks/useLabs";
import { useEnteralCare, useParenteralCare, useSportsPerformance } from "@/hooks/useSpecialtyModules";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { composeCopilotContext } from "@/services/copilotService";

export function useCopilotContext(selectedPatientId?: string | null) {
  const { activeTenantId, activeTenant, isDemoMode, isLoading: tenantLoading } = useTenantRuntime();
  const patientsQuery = useTenantPatients();
  const alertsQuery = useTenantAlerts();
  const plansQuery = useTenantNutritionPlans();
  const reportsQuery = useTenantReports();
  const appointmentsQuery = useUpcomingAppointments();
  const labsQuery = useLabs();
  const enteralQuery = useEnteralCare();
  const parenteralQuery = useParenteralCare();
  const sportsQuery = useSportsPerformance();
  const growthReferencesQuery = useGrowthReferences();

  const queries = [
    patientsQuery,
    alertsQuery,
    plansQuery,
    reportsQuery,
    appointmentsQuery,
    labsQuery,
    enteralQuery,
    parenteralQuery,
    sportsQuery,
    growthReferencesQuery,
  ];

  const isLoading = tenantLoading || queries.some((query) => query.isLoading);
  const isError = queries.some((query) => query.isError);
  const error = queries.find((query) => query.error)?.error ?? null;

  const context = useMemo(() => {
    const patients = patientsQuery.data?.data ?? [];
    const alerts = alertsQuery.data?.data ?? [];
    const plans = plansQuery.data?.data ?? [];
    const reports = reportsQuery.data?.data ?? [];
    const labs = labsQuery.data?.patients ?? [];
    const appointments = appointmentsQuery.data ?? [];
    const enteralPlans = enteralQuery.data?.data ?? [];
    const parenteralPlans = parenteralQuery.data?.data ?? [];
    const sportsProfiles = sportsQuery.data?.data?.profiles ?? [];
    const sportsSnapshots = sportsQuery.data?.data?.snapshots ?? [];
    const growthReference = growthReferencesQuery.data;
    const pediatricReferenceComplete =
      growthReference?.source === "supabase" &&
      growthReference.referenceSets.length > 0 &&
      growthReference.referencePoints.length > 0;

    return composeCopilotContext(
      {
        patients: patients.map((patient) => ({
          id: patient.id,
          fullName: patient.fullName,
          risk: patient.risk,
          diagnosisSummary: patient.diagnosisSummary,
          location: patient.location,
          activePacks: patient.activePacks,
          nextFollowUpAt: patient.nextFollowUpAt,
        })),
        alerts: alerts.map((alert) => ({
          id: alert.id,
          patientId: alert.patientId,
          severity: alert.severity,
          status: alert.status,
          message: alert.message,
          sourceType: alert.sourceType,
          createdAt: alert.createdAt,
        })),
        labs: labs.map((patient) => ({
          patientId: patient.id,
          status: patient.status,
          outsideCount: patient.outsideCount,
          resultedAt: "latestResultAt" in patient ? String(patient.latestResultAt ?? "") : null,
        })),
        plans: plans.map((plan) => ({
          patientId: plan.patientId,
          status: plan.status,
          createdAt: plan.createdAt,
          nextFollowUpAt: plan.nextFollowUpAt,
        })),
        appointments: appointments.map((appointment) => ({
          patientId: appointment.patientId,
          startsAt: appointment.startsAt,
          status: appointment.status,
          appointmentType: appointment.appointmentType,
        })),
        enteralPlans: enteralPlans.map((plan) => ({
          patientId: plan.patientId,
          status: plan.status,
          toleranceStatus: plan.metrics?.toleranceStatus ?? plan.toleranceStatus,
          volumeDeliveredPct: plan.metrics?.volumeDeliveredPct ?? null,
          latestLogAt: plan.latestLog?.loggedAt ?? null,
          createdAt: plan.createdAt,
        })),
        parenteralPlans: parenteralPlans.map((plan) => ({
          patientId: plan.patientId,
          status: plan.status,
          latestLogAt: plan.latestLog?.loggedAt ?? null,
        })),
        sportsProfiles: sportsProfiles.map((profile) => ({
          patientId: profile.patientId,
          discipline: profile.discipline,
        })),
        sportsSnapshots: sportsSnapshots.map((snapshot) => ({
          patientId: snapshot.patientId,
          endomorphy: snapshot.endomorphy,
          mesomorphy: snapshot.mesomorphy,
          ectomorphy: snapshot.ectomorphy,
          measuredAt: snapshot.measuredAt,
        })),
        reports: reports.map((report) => ({
          id: report.id,
          reportType: report.reportType,
          status: report.status,
          createdAt: report.createdAt,
        })),
        pediatricReferenceComplete,
      },
      selectedPatientId,
    );
  }, [
    alertsQuery.data?.data,
    appointmentsQuery.data,
    enteralQuery.data?.data,
    growthReferencesQuery.data,
    labsQuery.data?.patients,
    parenteralQuery.data?.data,
    patientsQuery.data?.data,
    plansQuery.data?.data,
    reportsQuery.data?.data,
    selectedPatientId,
    sportsQuery.data?.data?.profiles,
    sportsQuery.data?.data?.snapshots,
  ]);

  return {
    activeTenant,
    activeTenantId,
    context,
    enteralCount: enteralQuery.data?.data?.length ?? 0,
    parenteralCount: parenteralQuery.data?.data?.length ?? 0,
    sportsCount: sportsQuery.data?.data?.profiles.length ?? 0,
    isDemoMode,
    isLoading,
    isError,
    error,
    refetch: async () => {
      await Promise.all(queries.map((query) => query.refetch()));
    },
  };
}
