import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { archiveRecipe, createRecipe, getRecipe, listRecipes, updateRecipe } from "@/services/recipeService";

export function recipeKeys(tenantId: string | null) {
  return {
    all: ["recipes", tenantId] as const,
    list: ["recipes", tenantId, "list"] as const,
    detail: (recipeId: string | null) => ["recipes", tenantId, "detail", recipeId] as const,
  };
}

function useRecipeGate() {
  const { activeTenantId, isDemoMode } = useTenantRuntime();
  return {
    activeTenantId,
    enabled: Boolean(activeTenantId) && !isDemoMode,
  };
}

export function useRecipes() {
  const { activeTenantId, enabled } = useRecipeGate();
  return useQuery({
    queryKey: recipeKeys(activeTenantId).list,
    queryFn: () => listRecipes(activeTenantId as string),
    enabled,
    staleTime: 20_000,
  });
}

export function useRecipe(recipeId: string | null) {
  const { activeTenantId, enabled } = useRecipeGate();
  return useQuery({
    queryKey: recipeKeys(activeTenantId).detail(recipeId),
    queryFn: () => getRecipe(activeTenantId as string, recipeId as string),
    enabled: enabled && Boolean(recipeId),
    staleTime: 20_000,
  });
}

export function useCreateRecipe() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRecipe,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recipeKeys(activeTenantId).all });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useUpdateRecipe() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRecipe,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: recipeKeys(activeTenantId).all });
      await queryClient.invalidateQueries({ queryKey: recipeKeys(activeTenantId).detail(variables.recipeId) });
      await queryClient.invalidateQueries({ queryKey: ["weekly-menus", activeTenantId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}

export function useArchiveRecipe() {
  const { activeTenantId } = useTenantRuntime();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveRecipe,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: recipeKeys(activeTenantId).all });
      await queryClient.invalidateQueries({ queryKey: ["weekly-menus", activeTenantId] });
      await queryClient.invalidateQueries({ queryKey: ["clinical", "audit", activeTenantId] });
    },
  });
}
