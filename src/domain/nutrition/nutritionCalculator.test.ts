import { describe, expect, it } from "vitest";
import { calculateRecipeNutrition, calculateWeeklyMenuNutrition, scaleFoodNutrition } from "./nutritionCalculator";

describe("nutritionCalculator", () => {
  it("escala nutrientes por gramos desde una base de 100 g", () => {
    expect(scaleFoodNutrition({ servingSizeG: 100, kcal: 200, proteinG: 10, carbsG: 20, fatG: 5, fiberG: 2 }, 50)).toEqual({
      kcal: 100,
      proteinG: 5,
      carbsG: 10,
      fatG: 2.5,
      fiberG: 1,
    });
  });

  it("calcula total y porcion de una receta", () => {
    const result = calculateRecipeNutrition(
      [
        { food: { servingSizeG: 100, kcal: 100, proteinG: 10, carbsG: 5, fatG: 2, fiberG: 1 }, quantityG: 200 },
        { food: { servingSizeG: 100, kcal: 50, proteinG: 0, carbsG: 10, fatG: 1, fiberG: 2 }, quantityG: 100 },
      ],
      2,
    );

    expect(result.total).toEqual({ kcal: 250, proteinG: 20, carbsG: 20, fatG: 5, fiberG: 4 });
    expect(result.perPortion).toEqual({ kcal: 125, proteinG: 10, carbsG: 10, fatG: 2.5, fiberG: 2 });
  });

  it("usa una porcion segura cuando el escalado recibe porciones invalidas", () => {
    const result = calculateRecipeNutrition(
      [{ food: { servingSizeG: 50, kcal: 80, proteinG: 4, carbsG: 10, fatG: 2, fiberG: 1 }, quantityG: 100 }],
      0,
    );

    expect(result.portions).toBe(1);
    expect(result.total).toEqual({ kcal: 160, proteinG: 8, carbsG: 20, fatG: 4, fiberG: 2 });
    expect(result.perPortion).toEqual(result.total);
  });

  it("agrega totales diarios y semanales de menu", () => {
    const result = calculateWeeklyMenuNutrition([
      { dayOfWeek: 1, mealType: "desayuno", nutrition: { kcal: 300, proteinG: 20, carbsG: 35, fatG: 8, fiberG: 4 } },
      { dayOfWeek: 1, mealType: "almuerzo", nutrition: { kcal: 500, proteinG: 30, carbsG: 60, fatG: 14, fiberG: 6 } },
      { dayOfWeek: 2, mealType: "cena", nutrition: { kcal: 400, proteinG: 25, carbsG: 45, fatG: 10, fiberG: 5 } },
    ]);

    expect(result.daily[0]).toEqual({ dayOfWeek: 1, kcal: 800, proteinG: 50, carbsG: 95, fatG: 22, fiberG: 10 });
    expect(result.weekly).toEqual({ kcal: 1200, proteinG: 75, carbsG: 140, fatG: 32, fiberG: 15 });
  });

  it("incluye dias vacios en el menu semanal sin inventar nutrientes", () => {
    const result = calculateWeeklyMenuNutrition([]);

    expect(result.daily).toHaveLength(7);
    expect(result.daily[6]).toEqual({ dayOfWeek: 7, kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 });
    expect(result.weekly).toEqual({ kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 });
  });
});
