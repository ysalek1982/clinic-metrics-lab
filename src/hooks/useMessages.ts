import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import {
  assignThread,
  closeThread,
  createThread,
  getThread,
  getUnreadMessageCount,
  listPatientThreads,
  listThreads,
  markThreadRead,
  sendMessage,
  type MessageThreadFilters,
} from "@/services/messageService";

export function messageKeys(tenantId: string | null) {
  return {
    all: ["messages", tenantId] as const,
    threads: (filters: MessageThreadFilters) => ["messages", tenantId, "threads", filters] as const,
    thread: (threadId: string | null) => ["messages", tenantId, "thread", threadId] as const,
    patient: (patientId: string | null) => ["messages", tenantId, "patient", patientId] as const,
    unread: ["messages", tenantId, "unread"] as const,
  };
}

function useMessageGate() {
  const { activeTenantId, isDemoMode } = useTenantRuntime();
  return {
    activeTenantId,
    enabled: Boolean(activeTenantId) && !isDemoMode,
  };
}

export function useMessageThreads(filters: MessageThreadFilters = {}) {
  const { activeTenantId, enabled } = useMessageGate();

  return useQuery({
    queryKey: messageKeys(activeTenantId).threads(filters),
    queryFn: () => listThreads(activeTenantId as string, filters),
    enabled,
    staleTime: 10_000,
  });
}

export function useMessageThread(threadId: string | null) {
  const { activeTenantId, enabled } = useMessageGate();

  return useQuery({
    queryKey: messageKeys(activeTenantId).thread(threadId),
    queryFn: () => getThread(activeTenantId as string, threadId as string),
    enabled: enabled && Boolean(threadId),
    staleTime: 5_000,
  });
}

export function usePatientMessageThreads(patientId: string | null) {
  const { activeTenantId, enabled } = useMessageGate();

  return useQuery({
    queryKey: messageKeys(activeTenantId).patient(patientId),
    queryFn: () => listPatientThreads(activeTenantId as string, patientId as string),
    enabled: enabled && Boolean(patientId),
    staleTime: 15_000,
  });
}

export function useUnreadMessageCount(enabledOverride = true) {
  const { activeTenantId, enabled } = useMessageGate();

  return useQuery({
    queryKey: messageKeys(activeTenantId).unread,
    queryFn: () => getUnreadMessageCount(activeTenantId as string),
    enabled: enabled && enabledOverride,
    staleTime: 10_000,
  });
}

export function useCreateMessageThread() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createThread,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: messageKeys(activeTenantId).all });
      await queryClient.invalidateQueries({ queryKey: messageKeys(activeTenantId).patient(variables.patientId ?? null) });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, variables.patientId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useSendMessage() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendMessage,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: messageKeys(activeTenantId).all });
      await queryClient.invalidateQueries({ queryKey: messageKeys(activeTenantId).thread(variables.threadId) });
      await queryClient.invalidateQueries({ queryKey: messageKeys(activeTenantId).patient(variables.patientId ?? null) });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId, variables.patientId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useMarkThreadRead() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markThreadRead,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: messageKeys(activeTenantId).all });
      await queryClient.invalidateQueries({ queryKey: messageKeys(activeTenantId).thread(variables.threadId) });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useCloseThread() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: closeThread,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: messageKeys(activeTenantId).all });
      await queryClient.invalidateQueries({ queryKey: messageKeys(activeTenantId).thread(variables.threadId) });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "patient-detail", activeTenantId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useAssignThread() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignThread,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: messageKeys(activeTenantId).all });
      await queryClient.invalidateQueries({ queryKey: messageKeys(activeTenantId).thread(variables.threadId) });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}
