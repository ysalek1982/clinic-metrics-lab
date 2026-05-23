import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignPlanToTenant,
  cancelCourtesySubscription,
  extendCourtesySubscription,
  getTenantSubscription,
  grantCourtesySubscription,
  listPlanEntitlements,
  listPlans,
  listSubscriptionEvents,
  listTenantSubscriptions,
  type AssignTenantPlanInput,
} from "@/services/subscriptionService";

export const SUBSCRIPTION_QUERY_KEY = ["saas", "subscriptions"] as const;

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: [...SUBSCRIPTION_QUERY_KEY, "plans"],
    queryFn: listPlans,
    staleTime: 60_000,
    retry: 1,
  });
}

export function usePlanEntitlements() {
  return useQuery({
    queryKey: [...SUBSCRIPTION_QUERY_KEY, "entitlements"],
    queryFn: listPlanEntitlements,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useTenantSubscription(tenantId: string | null | undefined) {
  return useQuery({
    queryKey: [...SUBSCRIPTION_QUERY_KEY, "tenant", tenantId],
    queryFn: () => getTenantSubscription(tenantId ?? ""),
    enabled: Boolean(tenantId),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useTenantSubscriptions() {
  return useQuery({
    queryKey: [...SUBSCRIPTION_QUERY_KEY, "tenant-list"],
    queryFn: () => listTenantSubscriptions("all"),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useSubscriptionEvents(tenantId?: string | null) {
  return useQuery({
    queryKey: [...SUBSCRIPTION_QUERY_KEY, "events", tenantId ?? "all"],
    queryFn: () => listSubscriptionEvents(tenantId),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useAssignTenantPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignTenantPlanInput) => assignPlanToTenant(input),
    onSuccess: () => invalidateSubscriptions(queryClient),
  });
}

export function useGrantCourtesySubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { tenantId: string; endsAt: string; notes?: string | null }) =>
      grantCourtesySubscription(input),
    onSuccess: () => invalidateSubscriptions(queryClient),
  });
}

export function useExtendCourtesySubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { subscriptionId: string; endsAt: string; notes?: string | null }) =>
      extendCourtesySubscription(input),
    onSuccess: () => invalidateSubscriptions(queryClient),
  });
}

export function useCancelCourtesySubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { subscriptionId: string; notes?: string | null }) =>
      cancelCourtesySubscription(input),
    onSuccess: () => invalidateSubscriptions(queryClient),
  });
}

async function invalidateSubscriptions(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: ["saas", "tenants"] }),
    queryClient.invalidateQueries({ queryKey: ["identity-context"] }),
  ]);
}
