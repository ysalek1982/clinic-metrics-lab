import { calculateWeeklyMenuNutrition, emptyNutrition, scaleFoodNutrition, sumNutrition, type NutritionValues, type WeeklyMenuNutritionResult } from "@/domain/nutrition/nutritionCalculator";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { mapFoodItem, type FoodItem } from "@/services/foodService";
import { getRecipe, type RecipeSummary } from "@/services/recipeService";
import { writeAuditLog } from "@/services/clinicalService";

export type WeeklyMenuStatus = "draft" | "active" | "closed";
export type MealType = "desayuno" | "media_manana" | "almuerzo" | "merienda" | "cena" | "colacion";

export type WeeklyMenuItem = {
  id: string;
  dayOfWeek: number;
  mealType: MealType;
  recipeId: string | null;
  foodItemId: string | null;
  recipe: RecipeSummary | null;
  food: FoodItem | null;
  quantityG: number | null;
  portions: number;
  notes: string | null;
  sortOrder: number | null;
  nutrition: NutritionValues;
};

export type WeeklyMenuSummary = {
  id: string;
  tenantId: string;
  patientId: string;
  patientName: string | null;
  patientMrn: string | null;
  name: string;
  weekStart: string;
  kcalTarget: number | null;
  proteinTargetG: number | null;
  carbsTargetG: number | null;
  fatTargetG: number | null;
  status: WeeklyMenuStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: WeeklyMenuItem[];
  nutrition: WeeklyMenuNutritionResult;
};

export type WeeklyMenuPayload = {
  tenantId: string;
  patientId: string;
  name: string;
  weekStart: string;
  kcalTarget?: number | null;
  proteinTargetG?: number | null;
  carbsTargetG?: number | null;
  fatTargetG?: number | null;
  notes?: string | null;
};

export type WeeklyMenuItemPayload = {
  tenantId: string;
  weeklyMenuId: string;
  dayOfWeek: number;
  mealType: MealType;
  recipeId?: string | null;
  foodItemId?: string | null;
  quantityG?: number | null;
  portions?: number;
  notes?: string | null;
};

type QueryResult = {
  data: unknown;
  error: unknown;
};

type SupabaseQueryBuilder = PromiseLike<QueryResult> & {
  select: (...args: unknown[]) => SupabaseQueryBuilder;
  insert: (...args: unknown[]) => SupabaseQueryBuilder;
  update: (...args: unknown[]) => SupabaseQueryBuilder;
  delete: () => SupabaseQueryBuilder;
  eq: (...args: unknown[]) => SupabaseQueryBuilder;
  is: (...args: unknown[]) => SupabaseQueryBuilder;
  in: (...args: unknown[]) => SupabaseQueryBuilder;
  order: (...args: unknown[]) => SupabaseQueryBuilder;
  single: () => Promise<QueryResult>;
};

type SupabaseAnyClient = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
  };
  from: (table: string) => SupabaseQueryBuilder;
};

type MenuRow = {
  id: string;
  tenant_id: string;
  patient_id: string;
  name: string;
  week_start: string;
  kcal_target: number | null;
  protein_target_g: number | null;
  carbs_target_g: number | null;
  fat_target_g: number | null;
  status: WeeklyMenuStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type MenuItemRow = {
  id: string;
  tenant_id: string;
  weekly_menu_id: string;
  day_of_week: number;
  meal_type: MealType;
  recipe_id: string | null;
  food_item_id: string | null;
  quantity_g: number | null;
  portions: number;
  notes: string | null;
  sort_order: number | null;
};

type PatientRow = {
  id: string;
  mrn: string;
  first_name: string;
  last_name: string;
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
  if (error || !data.user) throw new Error("Sesión requerida para operar menús semanales.");
  return data.user.id;
}

function validateMenuPayload(input: WeeklyMenuPayload) {
  if (!input.patientId) throw new Error("Selecciona un paciente real.");
  if (!input.name.trim()) throw new Error("El nombre del menú es obligatorio.");
  if (!input.weekStart) throw new Error("La semana de inicio es obligatoria.");
}

function validateMenuItemPayload(input: WeeklyMenuItemPayload) {
  if (input.dayOfWeek < 1 || input.dayOfWeek > 7) throw new Error("Día de la semana inválido.");
  if (!input.recipeId && !input.foodItemId) throw new Error("Selecciona una receta o alimento.");
  if (input.foodItemId && (!input.quantityG || input.quantityG <= 0)) throw new Error("La cantidad del alimento debe ser mayor a cero.");
  if (input.recipeId && (!input.portions || input.portions <= 0)) throw new Error("Las porciones de receta deben ser mayores a cero.");
}

function scaleRecipePortion(recipe: RecipeSummary, portions: number): NutritionValues {
  const factor = portions > 0 ? portions : 1;
  return {
    kcal: Math.round(recipe.nutrition.perPortion.kcal * factor * 10) / 10,
    proteinG: Math.round(recipe.nutrition.perPortion.proteinG * factor * 10) / 10,
    carbsG: Math.round(recipe.nutrition.perPortion.carbsG * factor * 10) / 10,
    fatG: Math.round(recipe.nutrition.perPortion.fatG * factor * 10) / 10,
    fiberG: Math.round(recipe.nutrition.perPortion.fiberG * factor * 10) / 10,
  };
}

async function hydrateMenus(rows: MenuRow[]) {
  if (rows.length === 0) return [];
  const menuIds = rows.map((row) => row.id);
  const patientIds = [...new Set(rows.map((row) => row.patient_id))];

  const [patientResult, itemResult] = await Promise.all([
    client.from("patients").select("id,mrn,first_name,last_name").in("id", patientIds),
    client.from("weekly_menu_items").select("*").in("weekly_menu_id", menuIds).order("day_of_week", { ascending: true }),
  ]);

  if (patientResult.error) throw patientResult.error;
  if (itemResult.error) throw itemResult.error;

  const patients = new Map<string, PatientRow>();
  ((patientResult.data ?? []) as PatientRow[]).forEach((patient) => patients.set(patient.id, patient));

  const itemRows = (itemResult.data ?? []) as MenuItemRow[];
  const foodIds = [...new Set(itemRows.map((item) => item.food_item_id).filter((id): id is string => Boolean(id)))];
  const recipeIds = [...new Set(itemRows.map((item) => item.recipe_id).filter((id): id is string => Boolean(id)))];

  const { data: foodData, error: foodError } = foodIds.length > 0
    ? await client.from("food_items").select("*").in("id", foodIds)
    : { data: [] as FoodItemRow[], error: null };
  if (foodError) throw foodError;

  const foodMap = new Map<string, FoodItem>();
  ((foodData ?? []) as FoodItemRow[]).forEach((food) => foodMap.set(food.id, mapFoodItem(food)));

  const recipes = await Promise.all(recipeIds.map((recipeId) => getRecipe(rows[0].tenant_id, recipeId)));
  const recipeMap = new Map(recipes.map((recipe) => [recipe.id, recipe]));

  return rows.map((row) => {
    const patient = patients.get(row.patient_id);
    const items = itemRows
      .filter((item) => item.weekly_menu_id === row.id)
      .map((item) => {
        const food = item.food_item_id ? foodMap.get(item.food_item_id) ?? null : null;
        const recipe = item.recipe_id ? recipeMap.get(item.recipe_id) ?? null : null;
        const nutrition = recipe
          ? scaleRecipePortion(recipe, item.portions)
          : food
            ? scaleFoodNutrition(food, item.quantity_g ?? 0)
            : emptyNutrition();

        return {
          id: item.id,
          dayOfWeek: item.day_of_week,
          mealType: item.meal_type,
          recipeId: item.recipe_id,
          foodItemId: item.food_item_id,
          recipe,
          food,
          quantityG: item.quantity_g,
          portions: item.portions,
          notes: item.notes,
          sortOrder: item.sort_order,
          nutrition,
        };
      });

    return {
      id: row.id,
      tenantId: row.tenant_id,
      patientId: row.patient_id,
      patientName: patient ? `${patient.first_name} ${patient.last_name}` : null,
      patientMrn: patient?.mrn ?? null,
      name: row.name,
      weekStart: row.week_start,
      kcalTarget: row.kcal_target,
      proteinTargetG: row.protein_target_g,
      carbsTargetG: row.carbs_target_g,
      fatTargetG: row.fat_target_g,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      items,
      nutrition: calculateWeeklyMenuNutrition(items.map((item) => ({
        dayOfWeek: item.dayOfWeek,
        mealType: item.mealType,
        nutrition: item.nutrition,
      }))),
    };
  });
}

export async function listWeeklyMenus(tenantId: string, patientId?: string | null) {
  let query = client
    .from("weekly_menus")
    .select("*")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("week_start", { ascending: false });

  if (patientId) query = query.eq("patient_id", patientId);

  const { data, error } = await query;
  if (error) throw error;
  return hydrateMenus((data ?? []) as MenuRow[]);
}

export async function getWeeklyMenu(tenantId: string, menuId: string) {
  const { data, error } = await client
    .from("weekly_menus")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", menuId)
    .is("deleted_at", null)
    .single();

  if (error) throw error;
  const [menu] = await hydrateMenus([data as MenuRow]);
  return menu;
}

export async function createWeeklyMenu(input: WeeklyMenuPayload) {
  validateMenuPayload(input);
  const userId = await currentUserId();
  const { data, error } = await client
    .from("weekly_menus")
    .insert({
      tenant_id: input.tenantId,
      patient_id: input.patientId,
      name: input.name.trim(),
      week_start: input.weekStart,
      kcal_target: input.kcalTarget ?? null,
      protein_target_g: input.proteinTargetG ?? null,
      carbs_target_g: input.carbsTargetG ?? null,
      fat_target_g: input.fatTargetG ?? null,
      notes: input.notes ?? null,
      created_by: userId,
      updated_by: userId,
    })
    .select("*")
    .single();

  if (error) throw error;

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId: userId,
    eventType: "weekly_menu.create",
    entityType: "weekly_menu",
    entityId: (data as MenuRow).id,
    afterData: data as Json,
  });

  return getWeeklyMenu(input.tenantId, (data as MenuRow).id);
}

export async function updateWeeklyMenu(input: WeeklyMenuPayload & { weeklyMenuId: string; status?: WeeklyMenuStatus }) {
  validateMenuPayload(input);
  const userId = await currentUserId();
  const before = await getWeeklyMenu(input.tenantId, input.weeklyMenuId);
  const { data, error } = await client
    .from("weekly_menus")
    .update({
      patient_id: input.patientId,
      name: input.name.trim(),
      week_start: input.weekStart,
      kcal_target: input.kcalTarget ?? null,
      protein_target_g: input.proteinTargetG ?? null,
      carbs_target_g: input.carbsTargetG ?? null,
      fat_target_g: input.fatTargetG ?? null,
      notes: input.notes ?? null,
      status: input.status ?? before.status,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", input.tenantId)
    .eq("id", input.weeklyMenuId)
    .select("*")
    .single();

  if (error) throw error;

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId: userId,
    eventType: input.status === "active" ? "weekly_menu.activate" : input.status === "closed" ? "weekly_menu.close" : "weekly_menu.update",
    entityType: "weekly_menu",
    entityId: input.weeklyMenuId,
    beforeData: before as unknown as Json,
    afterData: data as Json,
  });

  return getWeeklyMenu(input.tenantId, input.weeklyMenuId);
}

export async function addWeeklyMenuItem(input: WeeklyMenuItemPayload) {
  validateMenuItemPayload(input);
  const userId = await currentUserId();
  const { data, error } = await client
    .from("weekly_menu_items")
    .insert({
      tenant_id: input.tenantId,
      weekly_menu_id: input.weeklyMenuId,
      day_of_week: input.dayOfWeek,
      meal_type: input.mealType,
      recipe_id: input.recipeId ?? null,
      food_item_id: input.foodItemId ?? null,
      quantity_g: input.quantityG ?? null,
      portions: input.portions ?? 1,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId: userId,
    eventType: "weekly_menu.update",
    entityType: "weekly_menu",
    entityId: input.weeklyMenuId,
    afterData: { item: data } as Json,
  });

  return data as MenuItemRow;
}

export async function removeWeeklyMenuItem(input: { tenantId: string; weeklyMenuItemId: string; weeklyMenuId: string }) {
  const userId = await currentUserId();
  const { data: before, error: beforeError } = await client
    .from("weekly_menu_items")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.weeklyMenuItemId)
    .single();

  if (beforeError) throw beforeError;

  const { error } = await client
    .from("weekly_menu_items")
    .delete()
    .eq("tenant_id", input.tenantId)
    .eq("id", input.weeklyMenuItemId);

  if (error) throw error;

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId: userId,
    eventType: "weekly_menu.update",
    entityType: "weekly_menu",
    entityId: input.weeklyMenuId,
    beforeData: before as Json,
  });
}

export async function auditWeeklyMenuExport(input: { tenantId: string; weeklyMenuId: string; format: "xlsx" | "print" }) {
  const userId = await currentUserId();
  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId: userId,
    eventType: "weekly_menu.exported",
    entityType: "weekly_menu",
    entityId: input.weeklyMenuId,
    afterData: {
      format: input.format,
    } as Json,
  });
}

export function calculateWeeklyMenuTotals(menu: WeeklyMenuSummary) {
  return sumNutrition(menu.items.map((item) => item.nutrition));
}
