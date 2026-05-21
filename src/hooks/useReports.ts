import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import {
  auditReportExported,
  auditReportPrinted,
  generateReportRun,
  listReportRuns,
  listReportTemplates,
  loadReportDataBundle,
  type ReportParameters,
  type ReportPreview,
  type ReportType,
} from "@/services/reportService";

function reportKeys(tenantId: string | null) {
  return {
    bundle: ["reports", "bundle", tenantId] as const,
    runs: ["reports", "runs", tenantId] as const,
  };
}

export function useReportTemplates() {
  return listReportTemplates();
}

export function useReportDataBundle() {
  const { activeTenantId, isAuthenticated, isDemoMode } = useTenantRuntime();
  return useQuery({
    queryKey: reportKeys(activeTenantId).bundle,
    queryFn: () => {
      if (!activeTenantId) throw new Error("Selecciona un tenant activo para consultar reportes.");
      return loadReportDataBundle(activeTenantId);
    },
    enabled: isAuthenticated && !isDemoMode && Boolean(activeTenantId),
    staleTime: 30_000,
  });
}

export function useReportRuns() {
  const { activeTenantId, isAuthenticated, isDemoMode } = useTenantRuntime();
  return useQuery({
    queryKey: reportKeys(activeTenantId).runs,
    queryFn: () => {
      if (!activeTenantId) throw new Error("Selecciona un tenant activo para consultar reportes generados.");
      return listReportRuns(activeTenantId);
    },
    enabled: isAuthenticated && !isDemoMode && Boolean(activeTenantId),
    staleTime: 15_000,
  });
}

export function useGenerateReportRun() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reportType, parameters }: { reportType: ReportType; parameters: ReportParameters }) => {
      if (!activeTenantId) throw new Error("Selecciona un tenant activo para generar reportes.");
      return generateReportRun(activeTenantId, reportType, parameters);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reportKeys(activeTenantId).runs });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function usePrintReportAudit() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ preview, reportRunId }: { preview: ReportPreview; reportRunId?: string | null }) => {
      if (!activeTenantId) throw new Error("Selecciona un tenant activo para auditar impresión.");
      return auditReportPrinted(activeTenantId, preview, reportRunId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useExportReportAudit() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ preview, format, reportRunId }: { preview: ReportPreview; format: "pdf" | "xlsx"; reportRunId?: string | null }) => {
      if (!activeTenantId) throw new Error("Selecciona un tenant activo para auditar exportacion.");
      return auditReportExported(activeTenantId, preview, format, reportRunId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}
