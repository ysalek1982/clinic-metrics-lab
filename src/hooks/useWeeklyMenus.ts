import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import {
  addWeeklyMenuItem,
  auditWeeklyMenuExport,
  createWeeklyMenu,
  getWeeklyMenu,
  listWeeklyMenus,
  removeWeeklyMenuItem,
  updateWeeklyMenu,
} from "@/services/weeklyMenuService";

export function weeklyMenuKeys(tenantId: string | null) {
  return {
    all: ["weekly-menus", tenantId] as const,
    list: (patientId?: string | null) => ["weekly-menus", tenantId, "list", patientId ?? "all"] as const,
    detail: (menuId: string | null) => ["weekly-menus", tenantId, "detail", menuId] as const,
    patient: (patientId: string | null) => ["weekly-menus", tenantId, "patient", patientId] as const,
  };
}

function useWeeklyMenuGate() {
  const { activeTenantId, isDemoMode } = useTenantRuntime();
  return {
    activeTenantId,
    enabled: Boolean(activeTenantId) && !isDemoMode,
  };
}

export function useWeeklyMenus(patientId?: string | null) {
  const { activeTenantId, enabled } = useWeeklyMenuGate();
  return useQuery({
    queryKey: weeklyMenuKeys(activeTenantId).list(patientId),
    queryFn: () => listWeeklyMenus(activeTenantId as string, patientId),
    enabled,
    staleTime: 20_000,
  });
}

export function useWeeklyMenu(menuId: string | null) {
  const { activeTenantId, enabled } = useWeeklyMenuGate();
  return useQuery({
    queryKey: weeklyMenuKeys(activeTenantId).detail(menuId),
    queryFn: () => getWeeklyMenu(activeTenantId as string, menuId as string),
    enabled: enabled && Boolean(menuId),
    staleTime: 15_000,
  });
}

export function usePatientWeeklyMenus(patientId: string | null) {
  const { activeTenantId, enabled } = useWeeklyMenuGate();
  return useQuery({
    queryKey: weeklyMenuKeys(activeTenantId).patient(patientId),
    queryFn: () => listWeeklyMenus(activeTenantId as string, patientId),
    enabled: enabled && Boolean(patientId),
    staleTime: 20_000,
  });
}

export function useCreateWeeklyMenu() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWeeklyMenu,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: weeklyMenuKeys(activeTenantId).all });
      await queryClient.invalidateQueries({ queryKey: weeklyMenuKeys(activeTenantId).patient(variables.patientId) });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, variables.patientId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useUpdateWeeklyMenu() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateWeeklyMenu,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: weeklyMenuKeys(activeTenantId).all });
      await queryClient.invalidateQueries({ queryKey: weeklyMenuKeys(activeTenantId).patient(variables.patientId) });
      await queryClient.invalidateQueries({ queryKey: weeklyMenuKeys(activeTenantId).detail(variables.weeklyMenuId) });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, variables.patientId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useAddWeeklyMenuItem() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addWeeklyMenuItem,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: weeklyMenuKeys(activeTenantId).all });
      await queryClient.invalidateQueries({ queryKey: weeklyMenuKeys(activeTenantId).detail(variables.weeklyMenuId) });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useRemoveWeeklyMenuItem() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeWeeklyMenuItem,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: weeklyMenuKeys(activeTenantId).all });
      await queryClient.invalidateQueries({ queryKey: weeklyMenuKeys(activeTenantId).detail(variables.weeklyMenuId) });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useExportWeeklyMenuAudit() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: auditWeeklyMenuExport,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}
