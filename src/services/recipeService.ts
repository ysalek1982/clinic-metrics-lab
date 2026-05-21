import { calculateRecipeNutrition, type RecipeNutritionResult } from "@/domain/nutrition/nutritionCalculator";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { mapFoodItem, type FoodItem } from "@/services/foodService";
import { writeAuditLog } from "@/services/clinicalService";

export type RecipeStatus = "draft" | "active" | "archived";

export type RecipeIngredient = {
  id: string;
  foodItemId: string;
  food: FoodItem;
  quantityG: number;
  displayUnit: string | null;
  sortOrder: number | null;
};

export type RecipeSummary = {
  id: string;
  tenantId: string;
  name: string;
  category: string | null;
  description: string | null;
  portions: number;
  preparationNotes: string | null;
  tags: string[];
  status: RecipeStatus;
  createdAt: string;
  updatedAt: string;
  ingredients: RecipeIngredient[];
  nutrition: RecipeNutritionResult;
};

export type RecipeIngredientPayload = {
  foodItemId: string;
  quantityG: number;
  displayUnit?: string | null;
};

export type RecipePayload = {
  tenantId: string;
  name: string;
  category?: string | null;
  description?: string | null;
  portions: number;
  preparationNotes?: string | null;
  tags?: string[];
  status?: RecipeStatus;
  ingredients: RecipeIngredientPayload[];
};

export type UpdateRecipePayload = RecipePayload & {
  recipeId: string;
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

type RecipeRow = {
  id: string;
  tenant_id: string;
  name: string;
  category: string | null;
  description: string | null;
  portions: number;
  preparation_notes: string | null;
  tags: string[] | null;
  status: RecipeStatus;
  created_at: string;
  updated_at: string;
};

type IngredientRow = {
  id: string;
  tenant_id: string;
  recipe_id: string;
  food_item_id: string;
  quantity_g: number;
  display_unit: string | null;
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
  if (error || !data.user) throw new Error("Sesión requerida para operar recetas.");
  return data.user.id;
}

function validateRecipePayload(input: RecipePayload) {
  if (!input.name.trim()) throw new Error("El nombre de la receta es obligatorio.");
  if (!input.portions || input.portions <= 0) throw new Error("Las porciones deben ser mayores a cero.");
  if (input.ingredients.length === 0) throw new Error("Agrega al menos un ingrediente real.");
  input.ingredients.forEach((ingredient) => {
    if (!ingredient.foodItemId) throw new Error("Cada ingrediente debe tener un alimento.");
    if (!ingredient.quantityG || ingredient.quantityG <= 0) throw new Error("Cada ingrediente debe tener una cantidad mayor a cero.");
  });
}

function mapRecipe(
  row: RecipeRow,
  ingredientRows: IngredientRow[],
  foodMap: Map<string, FoodItem>,
): RecipeSummary {
  const ingredients = ingredientRows
    .filter((ingredient) => ingredient.recipe_id === row.id)
    .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))
    .map((ingredient) => {
      const food = foodMap.get(ingredient.food_item_id);
      if (!food) return null;
      return {
        id: ingredient.id,
        foodItemId: ingredient.food_item_id,
        food,
        quantityG: ingredient.quantity_g,
        displayUnit: ingredient.display_unit,
        sortOrder: ingredient.sort_order,
      };
    })
    .filter((ingredient): ingredient is RecipeIngredient => Boolean(ingredient));

  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    category: row.category,
    description: row.description,
    portions: row.portions,
    preparationNotes: row.preparation_notes,
    tags: row.tags ?? [],
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ingredients,
    nutrition: calculateRecipeNutrition(
      ingredients.map((ingredient) => ({
        food: ingredient.food,
        quantityG: ingredient.quantityG,
      })),
      row.portions,
    ),
  };
}

async function hydrateRecipes(recipeRows: RecipeRow[]) {
  if (recipeRows.length === 0) return [];
  const recipeIds = recipeRows.map((recipe) => recipe.id);

  const { data: ingredientData, error: ingredientError } = await client
    .from("recipe_ingredients")
    .select("*")
    .in("recipe_id", recipeIds)
    .order("sort_order", { ascending: true });

  if (ingredientError) throw ingredientError;
  const ingredients = (ingredientData ?? []) as IngredientRow[];
  const foodIds = [...new Set(ingredients.map((ingredient) => ingredient.food_item_id))];

  const { data: foodData, error: foodError } = foodIds.length > 0
    ? await client.from("food_items").select("*").in("id", foodIds)
    : { data: [] as FoodItemRow[], error: null };

  if (foodError) throw foodError;
  const foodMap = new Map<string, FoodItem>();
  ((foodData ?? []) as FoodItemRow[]).forEach((food) => foodMap.set(food.id, mapFoodItem(food)));

  return recipeRows.map((row) => mapRecipe(row, ingredients, foodMap));
}

export async function listRecipes(tenantId: string) {
  const { data, error } = await client
    .from("recipes")
    .select("*")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return hydrateRecipes((data ?? []) as RecipeRow[]);
}

export async function getRecipe(tenantId: string, recipeId: string) {
  const { data, error } = await client
    .from("recipes")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", recipeId)
    .is("deleted_at", null)
    .single();

  if (error) throw error;
  const [recipe] = await hydrateRecipes([data as RecipeRow]);
  return recipe;
}

export async function createRecipe(input: RecipePayload) {
  validateRecipePayload(input);
  const userId = await currentUserId();

  const { data: recipe, error } = await client
    .from("recipes")
    .insert({
      tenant_id: input.tenantId,
      name: input.name.trim(),
      category: input.category ?? null,
      description: input.description ?? null,
      portions: input.portions,
      preparation_notes: input.preparationNotes ?? null,
      tags: input.tags ?? [],
      status: input.status ?? "active",
      created_by: userId,
      updated_by: userId,
    })
    .select("*")
    .single();

  if (error) throw error;

  await insertIngredients(input.tenantId, (recipe as RecipeRow).id, input.ingredients);

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId: userId,
    eventType: "recipe.create",
    entityType: "recipe",
    entityId: (recipe as RecipeRow).id,
    afterData: recipe as Json,
  });

  return getRecipe(input.tenantId, (recipe as RecipeRow).id);
}

export async function updateRecipe(input: UpdateRecipePayload) {
  validateRecipePayload(input);
  const userId = await currentUserId();
  const before = await getRecipe(input.tenantId, input.recipeId);

  const { data, error } = await client
    .from("recipes")
    .update({
      name: input.name.trim(),
      category: input.category ?? null,
      description: input.description ?? null,
      portions: input.portions,
      preparation_notes: input.preparationNotes ?? null,
      tags: input.tags ?? [],
      status: input.status ?? "active",
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", input.tenantId)
    .eq("id", input.recipeId)
    .select("*")
    .single();

  if (error) throw error;

  const { error: deleteError } = await client.from("recipe_ingredients").delete().eq("tenant_id", input.tenantId).eq("recipe_id", input.recipeId);
  if (deleteError) throw deleteError;

  await insertIngredients(input.tenantId, input.recipeId, input.ingredients);
  const after = await getRecipe(input.tenantId, input.recipeId);

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId: userId,
    eventType: "recipe.update",
    entityType: "recipe",
    entityId: input.recipeId,
    beforeData: before as unknown as Json,
    afterData: data as Json,
  });

  return after;
}

export async function archiveRecipe(input: { tenantId: string; recipeId: string }) {
  const userId = await currentUserId();
  const before = await getRecipe(input.tenantId, input.recipeId);
  const { data, error } = await client
    .from("recipes")
    .update({
      status: "archived",
      deleted_at: new Date().toISOString(),
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", input.tenantId)
    .eq("id", input.recipeId)
    .select("*")
    .single();

  if (error) throw error;

  await writeAuditLog({
    tenantId: input.tenantId,
    actorUserId: userId,
    eventType: "recipe.archived",
    entityType: "recipe",
    entityId: input.recipeId,
    beforeData: before as unknown as Json,
    afterData: data as Json,
  });

  return data as RecipeRow;
}

async function insertIngredients(tenantId: string, recipeId: string, ingredients: RecipeIngredientPayload[]) {
  const rows = ingredients.map((ingredient, index) => ({
    tenant_id: tenantId,
    recipe_id: recipeId,
    food_item_id: ingredient.foodItemId,
    quantity_g: ingredient.quantityG,
    display_unit: ingredient.displayUnit ?? "g",
    sort_order: index + 1,
  }));

  const { error } = await client.from("recipe_ingredients").insert(rows);
  if (error) throw error;
}
