export type NutritionValues = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

export type FoodNutritionInput = {
  servingSizeG?: number | null;
  kcal?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  fiberG?: number | null;
};

export type RecipeIngredientInput = {
  food: FoodNutritionInput;
  quantityG: number;
};

export type RecipeNutritionResult = {
  total: NutritionValues;
  perPortion: NutritionValues;
  portions: number;
};

export type WeeklyMenuNutritionItem = {
  dayOfWeek: number;
  mealType: string;
  nutrition: NutritionValues;
};

export type DailyNutritionTotal = NutritionValues & {
  dayOfWeek: number;
};

export type WeeklyMenuNutritionResult = {
  daily: DailyNutritionTotal[];
  weekly: NutritionValues;
};

const EMPTY_TOTALS: NutritionValues = {
  kcal: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  fiberG: 0,
};

function safeNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

export function emptyNutrition(): NutritionValues {
  return { ...EMPTY_TOTALS };
}

export function scaleFoodNutrition(food: FoodNutritionInput, quantityG: number): NutritionValues {
  const servingSizeG = safeNumber(food.servingSizeG) > 0 ? safeNumber(food.servingSizeG) : 100;
  const factor = safeNumber(quantityG) / servingSizeG;

  return {
    kcal: roundOne(safeNumber(food.kcal) * factor),
    proteinG: roundOne(safeNumber(food.proteinG) * factor),
    carbsG: roundOne(safeNumber(food.carbsG) * factor),
    fatG: roundOne(safeNumber(food.fatG) * factor),
    fiberG: roundOne(safeNumber(food.fiberG) * factor),
  };
}

export function sumNutrition(values: NutritionValues[]): NutritionValues {
  return values.reduce(
    (total, item) => ({
      kcal: roundOne(total.kcal + safeNumber(item.kcal)),
      proteinG: roundOne(total.proteinG + safeNumber(item.proteinG)),
      carbsG: roundOne(total.carbsG + safeNumber(item.carbsG)),
      fatG: roundOne(total.fatG + safeNumber(item.fatG)),
      fiberG: roundOne(total.fiberG + safeNumber(item.fiberG)),
    }),
    emptyNutrition(),
  );
}

export function calculateRecipeNutrition(ingredients: RecipeIngredientInput[], portions: number): RecipeNutritionResult {
  const safePortions = safeNumber(portions) > 0 ? safeNumber(portions) : 1;
  const total = sumNutrition(ingredients.map((ingredient) => scaleFoodNutrition(ingredient.food, ingredient.quantityG)));

  return {
    total,
    perPortion: {
      kcal: roundOne(total.kcal / safePortions),
      proteinG: roundOne(total.proteinG / safePortions),
      carbsG: roundOne(total.carbsG / safePortions),
      fatG: roundOne(total.fatG / safePortions),
      fiberG: roundOne(total.fiberG / safePortions),
    },
    portions: safePortions,
  };
}

export function calculateWeeklyMenuNutrition(items: WeeklyMenuNutritionItem[]): WeeklyMenuNutritionResult {
  const daily = Array.from({ length: 7 }, (_, index) => {
    const dayOfWeek = index + 1;
    const dayItems = items.filter((item) => item.dayOfWeek === dayOfWeek).map((item) => item.nutrition);
    return {
      dayOfWeek,
      ...sumNutrition(dayItems),
    };
  });

  return {
    daily,
    weekly: sumNutrition(daily),
  };
}
