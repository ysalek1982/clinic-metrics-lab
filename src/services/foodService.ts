import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { writeAuditLog } from "@/services/clinicalService";

export type FoodGroup = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number | null;
};

export type FoodItem = {
  id: string;
  tenantId: string | null;
  foodGroupId: string | null;
  groupName: string | null;
  name: string;
  source: string | null;
  sourceScope: string;
  servingSizeG: number;
  kcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  sugarG: number | null;
  saturatedFatG: number | null;
  glycemicIndex: number | null;
  sodiumMg: number | null;
  potassiumMg: number | null;
  calciumMg: number | null;
  ironMg: number | null;
  vitaminCMg: number | null;
  vitaminDMcg: number | null;
  tags: string[];
  isActive: boolean;
};

export type FoodFilters = {
  search?: string;
  groupId?: string | "all";
};

export type CreateTenantFoodItemPayload = {
  tenantId: string;
  foodGroupId?: string | null;
  name: string;
  servingSizeG?: number;
  kcal?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  fiberG?: number | null;
  tags?: string[];
};

type QueryResult = {
  data: unknown;
  error: unknown;
};

type SupabaseQueryBuilder = PromiseLike<QueryResult> & {
  select: (...args: unknown[]) => SupabaseQueryBuilder;
  insert: (...args: unknown[]) => SupabaseQueryBuilder;
  eq: (...args: unknown[]) => SupabaseQueryBuilder;
  is: (...args: unknown[]) => SupabaseQueryBuilder;
  order: (...args: unknown[]) => SupabaseQueryBuilder;
  single: () => Promise<QueryResult>;
};

type SupabaseAnyClient = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
  };
  from: (table: string) => SupabaseQueryBuilder;
};

type FoodGroupRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number | null;
};

type FoodItemRow = {
  id: string;
  tenant_id: string | null;
  food_group_id: string | null;
  name: string;
  source: string | null;
  source_scope: string;
  serving_size_g: number;
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  saturated_fat_g: number | null;
  glycemic_index: number | null;
  sodium_mg: number | null;
  potassium_mg: number | null;
  calcium_mg: number | null;
  iron_mg: number | null;
  vitamin_c_mg: number | null;
  vitamin_d_mcg: number | null;
  tags: string[] | null;
  is_active: boolean;
};

const client = supabase as unknown as SupabaseAnyClient;

async function currentUserId() {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("Sesión requerida para operar alimentos.");
  return data.user.id;
}

function mapFoodGroup(row: FoodGroupRow): FoodGroup {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sortOrder: row.sort_order,
  };
}

export function mapFoodItem(row: FoodItemRow, groupMap = new Map<string, FoodGroup>()): FoodItem {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    foodGroupId: row.food_group_id,
    groupName: row.food_group_id ? groupMap.get(row.food_group_id)?.name ?? null : null,
    name: row.name,
    source: row.source,
    sourceScope: row.source_scope,
    servingSizeG: row.serving_size_g,
    kcal: row.kcal,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    fiberG: row.fiber_g,
    sugarG: row.sugar_g,
    saturatedFatG: row.saturated_fat_g,
    glycemicIndex: row.glycemic_index,
    sodiumMg: row.sodium_mg,
    potassiumMg: row.potassium_mg,
    calciumMg: row.calcium_mg,
    ironMg: row.iron_mg,
    vitaminCMg: row.vitamin_c_mg,
    vitaminDMcg: row.vitamin_d_mcg,
    tags: row.tags ?? [],
    isActive: row.is_active,
  };
}

export async function listFoodGroups() {
  const { data, error } = await client
    .from("food_groups")
    .select("id,name,slug,description,sort_order")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as FoodGroupRow[]).map(mapFoodGroup);
}

export async function listFoodItems(tenantId: string, filters: FoodFilters = {}) {
  if (!tenantId) throw new Error("Tenant requerido para consultar alimentos.");
  const groups = await listFoodGroups();
  const groupMap = new Map(groups.map((group) => [group.id, group]));

  const { data, error } = await client
    .from("food_items")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;

  const search = filters.search?.trim().toLowerCase();
  return ((data ?? []) as FoodItemRow[])
    .map((row) => mapFoodItem(row, groupMap))
    .filter((item) => {
      if (filters.groupId && filters.groupId !== "all" && item.foodGroupId !== filters.groupId) return false;
      if (!search) return true;
      return [item.name, item.groupName, item.source, ...(item.tags ?? [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
}

export async function getFoodItem(foodItemId: string) {
  const groups = await listFoodGroups();
  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const { data, error } = await client.from("food_items").select("*").eq("id", foodItemId).single();
  if (error) throw error;
  return mapFoodItem(data as FoodItemRow, groupMap);
}

export async function createTenantFoodItem(input: CreateTenantFoodItemPayload) {
  const userId = await currentUserId();
  if (!input.name.trim()) throw new Error("El nombre del alimento es obligatorio.");

  const { data, error } = await client
    .from("food_items")
    .insert({
      tenant_id: input.tenantId,
      food_group_id: input.foodGroupId ?? null,
      name: input.name.trim(),
      source_scope: "tenant",
      source: "Alimento personalizado del tenant",
      serving_size_g: input.servingSizeG ?? 100,
      kcal: input.kcal ?? null,
      protein_g: input.proteinG ?? null,
      carbs_g: input.carbsG ?? null,
      fat_g: input.fatG ?? null,
      fiber_g: input.fiberG ?? null,
      tags: input.tags ?? [],
      created_by: userId,
    })
    .select("*")
    .single();

  if (error) throw error;

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId: userId,
    eventType: "food_item.create",
    entityType: "food_item",
    entityId: (data as FoodItemRow).id,
    afterData: data as Json,
  });

  return mapFoodItem(data as FoodItemRow);
}
