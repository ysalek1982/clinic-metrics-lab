import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignRoleToUser,
  approveAccessRequest,
  createInviteCode,
  deactivateInviteCode,
  grantCourtesyMembership,
  listAccessRequests,
  listCourtesyMemberships,
  listEffectivePermissions,
  listInviteCodes,
  listPlatformUsers,
  rejectAccessRequest,
  removeRoleFromUser,
  revokeCourtesyMembership,
  submitAccessRequest,
  updatePlatformMembershipStatus,
  type AccessRequest,
  type ApproveAccessRequestInput,
  type CreateInviteCodeInput,
  type GrantCourtesyMembershipInput,
  type PlatformUser,
  type RejectAccessRequestInput,
  type SubmitAccessRequestInput,
} from "@/services/saasAdminService";

const SAAS_ADMIN_QUERY_KEY = ["saas-admin"] as const;

export function useSaasAdminRequests() {
  return useQuery({
    queryKey: [...SAAS_ADMIN_QUERY_KEY, "requests"],
    queryFn: () => listAccessRequests("all"),
    retry: 1,
    staleTime: 30_000,
  });
}

export function useSaasAdminInviteCodes() {
  return useQuery({
    queryKey: [...SAAS_ADMIN_QUERY_KEY, "invite-codes"],
    queryFn: listInviteCodes,
    retry: 1,
    staleTime: 30_000,
  });
}

export function useSaasAdminCourtesyMemberships() {
  return useQuery({
    queryKey: [...SAAS_ADMIN_QUERY_KEY, "courtesy-memberships"],
    queryFn: () => listCourtesyMemberships("all"),
    retry: 1,
    staleTime: 30_000,
  });
}

export function useSaasAdminPlatformUsers() {
  return useQuery({
    queryKey: [...SAAS_ADMIN_QUERY_KEY, "platform-users"],
    queryFn: listPlatformUsers,
    retry: 1,
    staleTime: 30_000,
  });
}

export function useSaasAdminEffectivePermissions(userId?: string | null, tenantId?: string | null) {
  return useQuery({
    queryKey: [...SAAS_ADMIN_QUERY_KEY, "effective-permissions", userId, tenantId],
    queryFn: () => listEffectivePermissions(userId ?? "", tenantId ?? null),
    enabled: Boolean(userId),
    retry: 1,
    staleTime: 30_000,
  });
}

export function useSubmitAccessRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitAccessRequestInput) => submitAccessRequest(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SAAS_ADMIN_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ["identity-context"] });
    },
  });
}

export function useApproveAccessRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ApproveAccessRequestInput) => approveAccessRequest(input),
    onSuccess: async () => invalidateSaasAdmin(queryClient),
  });
}

export function useRejectAccessRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RejectAccessRequestInput) => rejectAccessRequest(input),
    onSuccess: async () => invalidateSaasAdmin(queryClient),
  });
}

export function useCreateInviteCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInviteCodeInput) => createInviteCode(input),
    onSuccess: async () => invalidateSaasAdmin(queryClient),
  });
}

export function useDeactivateInviteCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => deactivateInviteCode(inviteId),
    onSuccess: async () => invalidateSaasAdmin(queryClient),
  });
}

export function useGrantCourtesyMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GrantCourtesyMembershipInput) => grantCourtesyMembership(input),
    onSuccess: async () => invalidateSaasAdmin(queryClient),
  });
}

export function useRevokeCourtesyMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ grantId, reason }: { grantId: string; reason?: string | null }) =>
      revokeCourtesyMembership(grantId, reason),
    onSuccess: async () => invalidateSaasAdmin(queryClient),
  });
}

export function useAssignRoleToUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { membershipId: string; roleCode: string }) => assignRoleToUser(input),
    onSuccess: async () => invalidateSaasAdmin(queryClient),
  });
}

export function useRemoveRoleFromUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { membershipId: string; roleCode: string }) => removeRoleFromUser(input),
    onSuccess: async () => invalidateSaasAdmin(queryClient),
  });
}

export function useUpdatePlatformMembershipStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { membershipId: string; status: PlatformUser["status"] }) =>
      updatePlatformMembershipStatus(input),
    onSuccess: async () => invalidateSaasAdmin(queryClient),
  });
}

export function getPendingRequests(requests: AccessRequest[] | undefined) {
  return (requests ?? []).filter((request) => request.status === "pending");
}

async function invalidateSaasAdmin(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: SAAS_ADMIN_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: ["identity-context"] }),
    queryClient.invalidateQueries({ queryKey: ["saas", "tenants"] }),
    queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
  ]);
}
