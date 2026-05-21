export type InstitutionalRecipeContext = "hospital" | "school" | "community" | "staff";

export type InstitutionalRecipeTemplate = {
  id: string;
  context: InstitutionalRecipeContext;
  name: string;
  category: string;
  description: string;
  portions: number;
  preparationNotes: string;
  ingredientGuide: string[];
};

export const INSTITUTIONAL_RECIPE_TEMPLATES: InstitutionalRecipeTemplate[] = [
  {
    id: "hospital-soup-vegetables-rice",
    context: "hospital",
    name: "Sopa institucional de verduras y arroz",
    category: "Hospitalario",
    description: "Plantilla base para una preparacion de comedor hospitalario. Requiere mapear ingredientes a alimentos reales del tenant antes de calcular nutrientes.",
    portions: 25,
    preparationNotes: "Coccion por lotes. Registrar gramajes reales por ingrediente y ajustar consistencia segun protocolo institucional validado.",
    ingredientGuide: ["arroz", "zanahoria", "zapallo", "papa", "caldo institucional", "aceite vegetal"],
  },
  {
    id: "hospital-puree-legume",
    context: "hospital",
    name: "Pure de leguminosa y cereal",
    category: "Hospitalario",
    description: "Plantilla operativa para preparaciones blandas. No incluye indicaciones clinicas ni recomendaciones terapeuticas.",
    portions: 20,
    preparationNotes: "Procesar hasta textura uniforme. Validar consistencia y porcion final segun cocina y equipo responsable.",
    ingredientGuide: ["lenteja cocida", "arroz cocido", "zanahoria", "aceite vegetal", "agua o caldo"],
  },
  {
    id: "school-breakfast-oat-fruit",
    context: "school",
    name: "Desayuno escolar de avena y fruta",
    category: "Escolar",
    description: "Plantilla para desayuno escolar. Los valores nutricionales se calculan solo cuando se seleccionan alimentos reales.",
    portions: 40,
    preparationNotes: "Estandarizar porcion servida y registrar proveedor/lote cuando aplique.",
    ingredientGuide: ["avena", "leche o bebida base", "banana", "canela", "azucar opcional"],
  },
  {
    id: "school-lunch-rice-beans",
    context: "school",
    name: "Almuerzo escolar de arroz, frejol y ensalada",
    category: "Escolar",
    description: "Plantilla de comedor escolar para documentar receta y gramajes reales, sin sustituir normativa local.",
    portions: 50,
    preparationNotes: "Separar preparacion caliente y ensalada. Registrar mermas si se controlan en cocina.",
    ingredientGuide: ["arroz", "frejol", "tomate", "zanahoria", "aceite vegetal", "sal yodada"],
  },
  {
    id: "community-stew-vegetable-chicken",
    context: "community",
    name: "Guiso comunitario de pollo y verduras",
    category: "Comunitario",
    description: "Plantilla de alto volumen para comedor comunitario. No representa prescripcion individual.",
    portions: 60,
    preparationNotes: "Controlar rendimiento final y registrar porciones realmente servidas.",
    ingredientGuide: ["pollo", "papa", "arveja", "zanahoria", "arroz", "aceite vegetal"],
  },
  {
    id: "staff-snack-yogurt-cereal",
    context: "staff",
    name: "Merienda institucional de yogur y cereal",
    category: "Institucional",
    description: "Plantilla para colacion institucional. El calculo depende de alimentos reales cargados.",
    portions: 30,
    preparationNotes: "Mantener cadena de frio si corresponde y registrar porcion servida.",
    ingredientGuide: ["yogur", "cereal", "fruta fresca", "semillas opcionales"],
  },
];

export function getInstitutionalRecipeTemplate(id: string) {
  return INSTITUTIONAL_RECIPE_TEMPLATES.find((template) => template.id === id) ?? null;
}

export function templatesByContext(context: InstitutionalRecipeContext) {
  return INSTITUTIONAL_RECIPE_TEMPLATES.filter((template) => template.context === context);
}
