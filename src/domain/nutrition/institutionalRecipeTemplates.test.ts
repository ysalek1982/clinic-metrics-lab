import { describe, expect, it } from "vitest";
import {
  getInstitutionalRecipeTemplate,
  INSTITUTIONAL_RECIPE_TEMPLATES,
  templatesByContext,
} from "./institutionalRecipeTemplates";

describe("institutionalRecipeTemplates", () => {
  it("define plantillas institucionales unicas y con porciones positivas", () => {
    const ids = new Set(INSTITUTIONAL_RECIPE_TEMPLATES.map((template) => template.id));

    expect(ids.size).toBe(INSTITUTIONAL_RECIPE_TEMPLATES.length);
    expect(INSTITUTIONAL_RECIPE_TEMPLATES.length).toBeGreaterThanOrEqual(6);
    INSTITUTIONAL_RECIPE_TEMPLATES.forEach((template) => {
      expect(template.name.trim()).not.toBe("");
      expect(template.portions).toBeGreaterThan(0);
      expect(template.ingredientGuide.length).toBeGreaterThan(0);
    });
  });

  it("incluye recetas para hospitales y escuelas", () => {
    expect(templatesByContext("hospital").length).toBeGreaterThanOrEqual(2);
    expect(templatesByContext("school").length).toBeGreaterThanOrEqual(2);
  });

  it("recupera plantilla por id y no inventa si no existe", () => {
    expect(getInstitutionalRecipeTemplate("school-breakfast-oat-fruit")?.context).toBe("school");
    expect(getInstitutionalRecipeTemplate("missing")).toBeNull();
  });

  it("mantiene textos sin claims clinicos de diagnostico o tratamiento", () => {
    const prohibited = /(diagnostico probable|tratamiento indicado|recomiendo dosis|debe administrarse|prescribir)/i;
    INSTITUTIONAL_RECIPE_TEMPLATES.forEach((template) => {
      const text = `${template.name} ${template.description} ${template.preparationNotes}`;
      expect(text).not.toMatch(prohibited);
    });
  });
});
