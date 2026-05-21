import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Archive, ChefHat, Edit3, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { INSTITUTIONAL_RECIPE_TEMPLATES, type InstitutionalRecipeTemplate } from "@/domain/nutrition/institutionalRecipeTemplates";
import { calculateRecipeNutrition } from "@/domain/nutrition/nutritionCalculator";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useFoodItems } from "@/hooks/useFoods";
import { useArchiveRecipe, useCreateRecipe, useRecipes, useUpdateRecipe } from "@/hooks/useRecipes";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { formatNumber as formatDisplayNumber } from "@/lib/formatters";
import type { RecipeIngredientPayload, RecipeSummary } from "@/services/recipeService";

type RecipeFormState = {
  name: string;
  category: string;
  description: string;
  portions: string;
  preparationNotes: string;
  status: "draft" | "active";
  ingredients: RecipeIngredientPayload[];
};

const emptyRecipeForm: RecipeFormState = {
  name: "",
  category: "",
  description: "",
  portions: "1",
  preparationNotes: "",
  status: "active",
  ingredients: [],
};

export default function Recipes() {
  const { activeTenantId, isDemoMode, isLoading: tenantLoading } = useTenantRuntime();
  const { hasPermission } = useAuthorization();
  const canRead = hasPermission("recipes.read");
  const canCreate = hasPermission("recipes.create");
  const canUpdate = hasPermission("recipes.update");
  const recipesQuery = useRecipes();
  const foodsQuery = useFoodItems();
  const createMutation = useCreateRecipe();
  const updateMutation = useUpdateRecipe();
  const archiveMutation = useArchiveRecipe();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeSummary | null>(null);
  const [form, setForm] = useState<RecipeFormState>(emptyRecipeForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const recipes = useMemo(() => recipesQuery.data ?? [], [recipesQuery.data]);
  const foods = useMemo(() => foodsQuery.data ?? [], [foodsQuery.data]);
  const selected = useMemo(() => recipes.find((recipe) => recipe.id === selectedId) ?? recipes[0] ?? null, [recipes, selectedId]);
  const draftNutrition = useMemo(() => {
    const foodMap = new Map(foods.map((food) => [food.id, food]));
    return calculateRecipeNutrition(
      form.ingredients
        .map((ingredient) => {
          const food = foodMap.get(ingredient.foodItemId);
          return food ? { food, quantityG: ingredient.quantityG } : null;
        })
        .filter((ingredient): ingredient is { food: (typeof foods)[number]; quantityG: number } => Boolean(ingredient)),
      Number(form.portions) || 1,
    );
  }, [foods, form.ingredients, form.portions]);

  useEffect(() => {
    if (!selectedId && recipes.length > 0) setSelectedId(recipes[0].id);
    if (selectedId && recipes.length > 0 && !recipes.some((recipe) => recipe.id === selectedId)) setSelectedId(recipes[0].id);
  }, [recipes, selectedId]);

  const openCreateDialog = () => {
    setEditingRecipe(null);
    setForm(emptyRecipeForm);
    setFormError(null);
    setFormNotice(null);
    setDialogOpen(true);
  };

  const openEditDialog = (recipe: RecipeSummary) => {
    setEditingRecipe(recipe);
    setForm({
      name: recipe.name,
      category: recipe.category ?? "",
      description: recipe.description ?? "",
      portions: String(recipe.portions),
      preparationNotes: recipe.preparationNotes ?? "",
      status: recipe.status === "archived" ? "draft" : recipe.status,
      ingredients: recipe.ingredients.map((ingredient) => ({
        foodItemId: ingredient.foodItemId,
        quantityG: ingredient.quantityG,
        displayUnit: ingredient.displayUnit ?? "g",
      })),
    });
    setFormError(null);
    setFormNotice(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    if (!activeTenantId) {
      setFormError("Selecciona una organizacion activa antes de guardar recetas.");
      return;
    }
    if (form.ingredients.length === 0) {
      setFormError("Agrega al menos un ingrediente real del tenant antes de guardar la receta.");
      return;
    }
    const payload = {
      tenantId: activeTenantId,
      name: form.name,
      category: form.category || null,
      description: form.description || null,
      portions: Number(form.portions) || 1,
      preparationNotes: form.preparationNotes || null,
      status: form.status,
      ingredients: form.ingredients,
    };

    try {
      const saved = editingRecipe
        ? await updateMutation.mutateAsync({ ...payload, recipeId: editingRecipe.id })
        : await createMutation.mutateAsync(payload);
      setSelectedId(saved.id);
      setDialogOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo guardar la receta.");
    }
  };

  if (tenantLoading) {
    return <RecipesState title="Recetas" message="Cargando contexto institucional..." />;
  }

  if (!isDemoMode && !canRead) {
    return <RecipesState title="Recetas" message="No tienes permiso para consultar recetas de este tenant." />;
  }

  const isLoading = !isDemoMode && (recipesQuery.isLoading || foodsQuery.isLoading);
  const errorMessage = !isDemoMode && (recipesQuery.error || foodsQuery.error) ? "No se pudieron cargar recetas y alimentos reales desde Supabase." : null;

  return (
    <div>
      <PageHeader
        meta="Nutrición · Plantillas culinarias"
        title="Recetas"
        subtitle="Editor real de preparaciones institucionales con cálculo nutricional por ingrediente."
        actions={
          <Button
            size="sm"
            className="h-8 gap-2 border-0 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={openCreateDialog}
            disabled={!canCreate || isDemoMode || foods.length === 0}
            title={foods.length === 0 ? "Carga alimentos reales antes de crear recetas." : !canCreate ? "Sin permiso para crear recetas." : undefined}
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva receta
          </Button>
        }
      />

      <div className="grid gap-4 p-6 xl:grid-cols-[minmax(520px,1fr)_460px]">
        <section className="panel overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Recetas del tenant</div>
                <h2 className="mt-1 text-[15px] font-medium">{recipes.length} preparaciones reales</h2>
              </div>
              <span className="rounded-full border border-border bg-surface-raised/40 px-3 py-1 text-[10px] font-mono uppercase text-muted-foreground">Cálculo real</span>
            </div>
          </div>
          {isLoading ? (
            <InlineState message="Cargando recetas reales..." />
          ) : errorMessage ? (
            <InlineState message={errorMessage} />
          ) : recipes.length === 0 ? (
            <InlineState message="Este módulo aún no tiene recetas reales configuradas para este tenant." />
          ) : (
            <div className="grid gap-3 p-4 md:grid-cols-2">
              {recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => setSelectedId(recipe.id)}
                  className={`rounded-xl border p-4 text-left transition-colors hover:bg-surface-raised/50 ${
                    selected?.id === recipe.id ? "border-primary/60 bg-primary/10 shadow-[inset_3px_0_0_hsl(var(--primary))]" : "border-border bg-surface-raised/25"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{recipe.category ?? "Sin categoría"}</div>
                      <h3 className="mt-2 text-[15px] font-semibold">{recipe.name}</h3>
                    </div>
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-mono uppercase text-primary">
                      {recipe.status === "active" ? "Activa" : recipe.status === "draft" ? "Borrador" : "Archivada"}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    <RecipeMetric label="Kcal/porción" value={formatNumber(recipe.nutrition.perPortion.kcal)} />
                    <RecipeMetric label="Proteína" value={`${formatNumber(recipe.nutrition.perPortion.proteinG)} g`} />
                    <RecipeMetric label="CHO" value={`${formatNumber(recipe.nutrition.perPortion.carbsG)} g`} />
                    <RecipeMetric label="Grasa" value={`${formatNumber(recipe.nutrition.perPortion.fatG)} g`} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <RecipeDetail recipe={selected} canUpdate={canUpdate && !isDemoMode} onEdit={openEditDialog} onArchive={(recipe) => archiveMutation.mutate({ tenantId: recipe.tenantId, recipeId: recipe.id })} />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto border-border bg-surface text-foreground">
          <DialogHeader>
            <DialogTitle>{editingRecipe ? "Editar receta" : "Nueva receta"}</DialogTitle>
            <DialogDescription className="text-[12px] text-muted-foreground">
              Selecciona alimentos reales y cantidades en gramos. El cálculo se ejecuta en el motor de dominio nutricional.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            {formError && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{formError}</div>}
            {formNotice && <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-[12px] text-primary">{formNotice}</div>}
            {!editingRecipe && (
              <div className="rounded-xl border border-border bg-surface-raised/25 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Plantillas institucionales</div>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      Precargan nombre, categoria, porciones y guia operativa. No se guardan hasta seleccionar alimentos reales del tenant.
                    </p>
                  </div>
                  <span className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-mono uppercase text-muted-foreground">
                    No persistente
                  </span>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {INSTITUTIONAL_RECIPE_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className="rounded-lg border border-border bg-background/45 p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/10"
                      onClick={() => applyTemplate(template)}
                    >
                      <div className="text-[10px] font-mono uppercase tracking-wider text-primary">{template.category}</div>
                      <div className="mt-1 text-[13px] font-semibold">{template.name}</div>
                      <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                        Guia: {template.ingredientGuide.join(", ")}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Nombre">
                <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
              </Field>
              <Field label="Categoría">
                <Input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Clínico, deportivo, hospitalario..." />
              </Field>
              <Field label="Porciones">
                <Input type="number" min="1" step="0.5" value={form.portions} onChange={(event) => setForm((current) => ({ ...current, portions: event.target.value }))} required />
              </Field>
              <Field label="Estado">
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as "draft" | "active" }))} className="h-10 w-full rounded-md border border-border bg-background px-3 text-[13px]">
                  <option value="active">Activa</option>
                  <option value="draft">Borrador</option>
                </select>
              </Field>
            </div>
            <Field label="Descripción">
              <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            </Field>

            <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
              <div className="rounded-xl border border-border">
                <div className="border-b border-border px-4 py-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Ingredientes reales</div>
                </div>
                <div className="space-y-3 p-4">
                  {form.ingredients.map((ingredient, index) => (
                    <div key={`${ingredient.foodItemId}-${index}`} className="grid gap-2 md:grid-cols-[1fr_120px_40px]">
                      <select
                        value={ingredient.foodItemId}
                        onChange={(event) => updateIngredient(index, { foodItemId: event.target.value })}
                        className="h-10 rounded-md border border-border bg-background px-3 text-[13px]"
                      >
                        <option value="">Selecciona alimento</option>
                        {foods.map((food) => (
                          <option key={food.id} value={food.id}>{food.name}</option>
                        ))}
                      </select>
                      <Input type="number" min="1" step="1" value={ingredient.quantityG} onChange={(event) => updateIngredient(index, { quantityG: Number(event.target.value) })} />
                      <Button type="button" variant="outline" size="icon" onClick={() => removeIngredient(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => setForm((current) => ({ ...current, ingredients: [...current.ingredients, { foodItemId: foods[0]?.id ?? "", quantityG: 100, displayUnit: "g" }] }))} disabled={foods.length === 0}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Agregar ingrediente
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface-raised/30 p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Panel nutricional</div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <RecipeMetric label="Kcal total" value={formatNumber(draftNutrition.total.kcal)} />
                  <RecipeMetric label="Kcal porción" value={formatNumber(draftNutrition.perPortion.kcal)} />
                  <RecipeMetric label="Proteína" value={`${formatNumber(draftNutrition.perPortion.proteinG)} g`} />
                  <RecipeMetric label="CHO" value={`${formatNumber(draftNutrition.perPortion.carbsG)} g`} />
                  <RecipeMetric label="Grasa" value={`${formatNumber(draftNutrition.perPortion.fatG)} g`} />
                  <RecipeMetric label="Fibra" value={`${formatNumber(draftNutrition.perPortion.fiberG)} g`} />
                </div>
              </div>
            </div>

            <Field label="Preparación">
              <Textarea value={form.preparationNotes} onChange={(event) => setForm((current) => ({ ...current, preparationNotes: event.target.value }))} />
            </Field>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>Guardar receta</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );

  function updateIngredient(index: number, patch: Partial<RecipeIngredientPayload>) {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, itemIndex) => (itemIndex === index ? { ...ingredient, ...patch } : ingredient)),
    }));
  }

  function removeIngredient(index: number) {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function applyTemplate(template: InstitutionalRecipeTemplate) {
    setForm((current) => ({
      ...current,
      name: template.name,
      category: template.category,
      description: template.description,
      portions: String(template.portions),
      preparationNotes: `${template.preparationNotes}\n\nGuia de ingredientes a mapear: ${template.ingredientGuide.join(", ")}.`,
      status: "active",
      ingredients: [],
    }));
    setFormError(null);
    setFormNotice("Plantilla aplicada. Selecciona alimentos reales del tenant antes de guardar.");
  }
}

function RecipeDetail({ recipe, canUpdate, onEdit, onArchive }: { recipe: RecipeSummary | null; canUpdate: boolean; onEdit: (recipe: RecipeSummary) => void; onArchive: (recipe: RecipeSummary) => void }) {
  if (!recipe) {
    return (
      <aside className="panel flex min-h-[360px] items-center justify-center p-6 text-center text-[13px] text-muted-foreground">
        Selecciona una receta para ver ingredientes y cálculo nutricional.
      </aside>
    );
  }

  return (
    <aside className="panel overflow-hidden">
      <div className="border-b border-border p-5">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{recipe.category ?? "Receta"}</div>
        <h2 className="mt-2 text-xl font-semibold">{recipe.name}</h2>
        <p className="mt-2 text-[12px] text-muted-foreground">{recipe.description ?? "Sin descripción registrada."}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="h-8" onClick={() => onEdit(recipe)} disabled={!canUpdate}>
            <Edit3 className="mr-1.5 h-3.5 w-3.5" />
            Editar
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => onEdit(recipe)} disabled={!canUpdate}>
            Escalar porciones
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => onArchive(recipe)} disabled={!canUpdate}>
            <Archive className="mr-1.5 h-3.5 w-3.5" />
            Archivar
          </Button>
        </div>
      </div>
      <div className="border-b border-border p-5">
        <div className="mb-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Panel nutricional</div>
        <div className="grid grid-cols-2 gap-2">
          <RecipeMetric label="Porciones" value={String(recipe.portions)} />
          <RecipeMetric label="Kcal total" value={formatNumber(recipe.nutrition.total.kcal)} />
          <RecipeMetric label="Kcal/porción" value={formatNumber(recipe.nutrition.perPortion.kcal)} />
          <RecipeMetric label="Proteína" value={`${formatNumber(recipe.nutrition.perPortion.proteinG)} g`} />
          <RecipeMetric label="CHO" value={`${formatNumber(recipe.nutrition.perPortion.carbsG)} g`} />
          <RecipeMetric label="Grasa" value={`${formatNumber(recipe.nutrition.perPortion.fatG)} g`} />
          <RecipeMetric label="Fibra" value={`${formatNumber(recipe.nutrition.perPortion.fiberG)} g`} />
          <RecipeMetric label="Fuente" value="Alimentos" />
        </div>
      </div>
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Constructor de ingredientes</div>
          <span className="rounded-full border border-border bg-surface-raised/40 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">{recipe.ingredients.length} ítems</span>
        </div>
        <div className="space-y-2">
          {recipe.ingredients.map((ingredient) => (
            <div key={ingredient.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-raised/35 px-3 py-2">
              <div>
                <div className="text-[13px] font-medium">{ingredient.food.name}</div>
                <div className="text-[11px] text-muted-foreground">{ingredient.food.groupName ?? "Sin grupo"}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-mono text-muted-foreground">{ingredient.quantityG} g</div>
                <div className="text-[10px] font-mono text-primary">{formatNumber(ingredient.food.kcal)} kcal/100 g</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function RecipesState({ title, message }: { title: string; message: string }) {
  return (
    <div>
      <PageHeader meta="Nutrición · Plantillas culinarias" title={title} subtitle="Editor real de preparaciones institucionales con cálculo nutricional por ingrediente." />
      <div className="p-6">
        <div className="panel flex min-h-[320px] items-center justify-center px-6 text-center">
          <div>
            <ChefHat className="mx-auto h-6 w-6 text-primary" />
            <div className="mt-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Recetas</div>
            <div className="mt-2 text-sm text-muted-foreground">{message}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InlineState({ message }: { message: string }) {
  return <div className="flex min-h-[360px] items-center justify-center px-6 text-center text-[13px] text-muted-foreground">{message}</div>;
}

function RecipeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-raised/30 p-3">
      <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-[12px] font-semibold">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function formatNumber(value: number | null | undefined) {
  return formatDisplayNumber(value, { fallback: "--" });
}
