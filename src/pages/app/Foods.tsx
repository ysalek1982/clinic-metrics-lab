import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Apple, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useCreateTenantFoodItem, useFoodGroups, useFoodItems } from "@/hooks/useFoods";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { formatNumber as formatDisplayNumber } from "@/lib/formatters";
import type { FoodItem } from "@/services/foodService";

type FoodFormState = {
  name: string;
  foodGroupId: string;
  kcal: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
  fiberG: string;
};

const emptyFoodForm: FoodFormState = {
  name: "",
  foodGroupId: "",
  kcal: "",
  proteinG: "",
  carbsG: "",
  fatG: "",
  fiberG: "",
};

export default function Foods() {
  const { activeTenantId, isDemoMode, isLoading: tenantLoading } = useTenantRuntime();
  const { hasPermission } = useAuthorization();
  const canRead = hasPermission("foods.read");
  const canManage = hasPermission("foods.manage");
  const [search, setSearch] = useState("");
  const [groupId, setGroupId] = useState<string>("all");
  const groupsQuery = useFoodGroups();
  const foodsQuery = useFoodItems({ search, groupId });
  const createMutation = useCreateTenantFoodItem();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FoodFormState>(emptyFoodForm);
  const [formError, setFormError] = useState<string | null>(null);

  const groups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data]);
  const foods = useMemo(() => foodsQuery.data ?? [], [foodsQuery.data]);
  const groupCounts = useMemo(() => {
    const counts = new Map<string, number>();
    foods.forEach((food) => {
      if (food.foodGroupId) counts.set(food.foodGroupId, (counts.get(food.foodGroupId) ?? 0) + 1);
    });
    return counts;
  }, [foods]);
  const selected = useMemo(
    () => foods.find((food) => food.id === selectedId) ?? foods[0] ?? null,
    [foods, selectedId],
  );

  useEffect(() => {
    if (!selectedId && foods.length > 0) setSelectedId(foods[0].id);
    if (selectedId && foods.length > 0 && !foods.some((food) => food.id === selectedId)) setSelectedId(foods[0].id);
  }, [foods, selectedId]);

  const handleCreateFood = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeTenantId) return;
    if (!form.name.trim()) {
      setFormError("El nombre del alimento es obligatorio.");
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        tenantId: activeTenantId,
        foodGroupId: form.foodGroupId || null,
        name: form.name,
        kcal: parseOptionalNumber(form.kcal),
        proteinG: parseOptionalNumber(form.proteinG),
        carbsG: parseOptionalNumber(form.carbsG),
        fatG: parseOptionalNumber(form.fatG),
        fiberG: parseOptionalNumber(form.fiberG),
      });
      setSelectedId(created.id);
      setDialogOpen(false);
      setForm(emptyFoodForm);
      setFormError(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo crear el alimento.");
    }
  };

  if (tenantLoading) {
    return <FoodsState title="Biblioteca de alimentos" message="Cargando contexto institucional..." />;
  }

  if (!isDemoMode && !canRead) {
    return <FoodsState title="Biblioteca de alimentos" message="No tienes permiso para consultar alimentos de este tenant." />;
  }

  const isLoading = !isDemoMode && (groupsQuery.isLoading || foodsQuery.isLoading);
  const errorMessage = !isDemoMode && (groupsQuery.error || foodsQuery.error)
    ? "No se pudo cargar la biblioteca de alimentos desde Supabase."
    : null;

  return (
    <div>
      <PageHeader
        meta="Nutrición · Base de alimentos"
        title="Biblioteca de alimentos"
        subtitle="Consulta real de composición nutricional para prescripción, recetas y menús semanales."
        actions={
          <Button
            size="sm"
            className="h-8 gap-2 border-0 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              setForm(emptyFoodForm);
              setFormError(null);
              setDialogOpen(true);
            }}
            disabled={!canManage || isDemoMode}
          >
            <Plus className="h-3.5 w-3.5" />
            Alimento propio
          </Button>
        }
      />

      <div className="grid min-h-[calc(100vh-8rem)] grid-cols-1 gap-4 p-6 xl:grid-cols-[280px_minmax(520px,1fr)_420px]">
        <aside className="panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Grupos alimentarios</div>
            <span className="rounded-full border border-border bg-surface-raised/40 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">{foods.length}</span>
          </div>
          <div className="space-y-1">
            <GroupButton label="Todos los grupos" count={foods.length} active={groupId === "all"} onClick={() => setGroupId("all")} />
            {groups.map((group) => (
              <GroupButton key={group.id} label={group.name} count={groupCounts.get(group.id) ?? 0} active={groupId === group.id} onClick={() => setGroupId(group.id)} />
            ))}
          </div>
        </aside>

        <section className="panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 bg-surface-raised/40 pl-9"
                placeholder="Buscar alimento..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="rounded-full border border-border bg-surface-raised/40 px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              {foods.length} alimentos reales
            </div>
          </div>

          {isLoading ? (
            <InlineState message="Cargando alimentos reales..." />
          ) : errorMessage ? (
            <InlineState message={errorMessage} />
          ) : foods.length === 0 ? (
            <InlineState message="Este módulo aún no tiene datos reales configurados para este tenant." />
          ) : (
            <table className="w-full text-[13px] tabular">
              <thead className="bg-surface-raised/35 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-normal">Alimento</th>
                  <th className="px-4 py-3 text-right font-normal">Kcal</th>
                  <th className="px-4 py-3 text-right font-normal">P</th>
                  <th className="px-4 py-3 text-right font-normal">CHO</th>
                  <th className="px-4 py-3 text-right font-normal">Lip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {foods.map((food) => (
                  <tr
                    key={food.id}
                    className={`cursor-pointer transition-colors hover:bg-surface-raised/35 ${selected?.id === food.id ? "bg-primary/10 shadow-[inset_3px_0_0_hsl(var(--primary))]" : ""}`}
                    onClick={() => setSelectedId(food.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{food.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {food.groupName ?? "Sin grupo"} · {food.tenantId ? "Institucional" : "Global"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{formatNumber(food.kcal)}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatNumber(food.proteinG)} g</td>
                    <td className="px-4 py-3 text-right font-mono">{formatNumber(food.carbsG)} g</td>
                    <td className="px-4 py-3 text-right font-mono">{formatNumber(food.fatG)} g</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <FoodDetail food={selected} />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl border-border bg-surface text-foreground">
          <DialogHeader>
            <DialogTitle>Alimento propio del tenant</DialogTitle>
            <DialogDescription className="text-[12px] text-muted-foreground">
              Registra un alimento institucional. Los valores deben validarse contra la tabla oficial del servicio.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleCreateFood}>
            {formError && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{formError}</div>}
            <Field label="Nombre">
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            </Field>
            <Field label="Grupo">
              <select
                value={form.foodGroupId}
                onChange={(event) => setForm((current) => ({ ...current, foodGroupId: event.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-[13px]"
              >
                <option value="">Sin grupo</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </Field>
            <div className="grid gap-3 md:grid-cols-5">
              <Field label="Kcal">
                <Input type="number" min="0" step="0.1" value={form.kcal} onChange={(event) => setForm((current) => ({ ...current, kcal: event.target.value }))} />
              </Field>
              <Field label="Proteína">
                <Input type="number" min="0" step="0.1" value={form.proteinG} onChange={(event) => setForm((current) => ({ ...current, proteinG: event.target.value }))} />
              </Field>
              <Field label="CHO">
                <Input type="number" min="0" step="0.1" value={form.carbsG} onChange={(event) => setForm((current) => ({ ...current, carbsG: event.target.value }))} />
              </Field>
              <Field label="Grasa">
                <Input type="number" min="0" step="0.1" value={form.fatG} onChange={(event) => setForm((current) => ({ ...current, fatG: event.target.value }))} />
              </Field>
              <Field label="Fibra">
                <Input type="number" min="0" step="0.1" value={form.fiberG} onChange={(event) => setForm((current) => ({ ...current, fiberG: event.target.value }))} />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>Guardar alimento</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GroupButton({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[13px] transition-colors ${
        active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
      }`}
      onClick={onClick}
    >
      <span>{label}</span>
      <span className="font-mono text-[10px] opacity-70">{count}</span>
    </button>
  );
}

function FoodDetail({ food }: { food: FoodItem | null }) {
  if (!food) {
    return (
      <aside className="panel flex min-h-[320px] items-center justify-center p-5 text-center text-[13px] text-muted-foreground">
        Selecciona un alimento para ver su ficha nutricional.
      </aside>
    );
  }

  return (
    <aside className="panel overflow-hidden">
      <div className="border-b border-border p-5">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Ficha nutricional</div>
        <h2 className="mt-2 text-xl font-semibold">{food.name}</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-mono uppercase text-primary">{food.groupName ?? "Sin grupo"}</span>
          <span className="rounded-full border border-border bg-surface-raised/40 px-2 py-0.5 text-[10px] font-mono uppercase text-muted-foreground">{formatScope(food)}</span>
        </div>
        {food.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {food.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] text-muted-foreground">{tag}</span>
            ))}
          </div>
        )}
        {food.source && (
          <div className="mt-4 rounded-lg border border-border bg-surface-raised/25 p-3">
            <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Fuente</div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{food.source}</p>
          </div>
        )}
      </div>
      <div className="space-y-5 p-5">
        <div>
          <div className="mb-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Macronutrientes · 100 g</div>
          <div className="grid grid-cols-2 gap-2">
            <Nutrient label="Kcal" value={formatNumber(food.kcal)} accent />
            <Nutrient label="Proteína" value={`${formatNumber(food.proteinG)} g`} />
            <Nutrient label="Carbohidratos" value={`${formatNumber(food.carbsG)} g`} />
            <Nutrient label="Lípidos" value={`${formatNumber(food.fatG)} g`} />
            <Nutrient label="Fibra" value={`${formatNumber(food.fiberG)} g`} />
            <Nutrient label="Azúcares" value={`${formatNumber(food.sugarG)} g`} />
          </div>
        </div>
        <div>
          <div className="mb-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Micronutrientes e índices</div>
          <div className="grid grid-cols-2 gap-2">
            <Nutrient label="Grasa saturada" value={`${formatNumber(food.saturatedFatG)} g`} />
            <Nutrient label="Índice glucémico" value={formatNumber(food.glycemicIndex)} />
            <Nutrient label="Sodio" value={`${formatNumber(food.sodiumMg)} mg`} />
            <Nutrient label="Potasio" value={`${formatNumber(food.potassiumMg)} mg`} />
            <Nutrient label="Calcio" value={`${formatNumber(food.calciumMg)} mg`} />
            <Nutrient label="Hierro" value={`${formatNumber(food.ironMg)} mg`} />
            <Nutrient label="Vitamina C" value={`${formatNumber(food.vitaminCMg)} mg`} />
            <Nutrient label="Vitamina D" value={`${formatNumber(food.vitaminDMcg)} mcg`} />
          </div>
        </div>
      </div>
    </aside>
  );
}

function FoodsState({ title, message }: { title: string; message: string }) {
  return (
    <div>
      <PageHeader meta="Nutrición · Base de alimentos" title={title} subtitle="Consulta real de composición nutricional para prescripción, recetas y menús semanales." />
      <div className="p-6">
        <div className="panel flex min-h-[320px] items-center justify-center px-6 text-center">
          <div>
            <Apple className="mx-auto h-6 w-6 text-primary" />
            <div className="mt-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Alimentos</div>
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

function Nutrient({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${accent ? "border-primary/40 bg-primary/10" : "border-border bg-surface-raised/30"}`}>
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}

function formatScope(food: FoodItem) {
  if (food.tenantId) return "Institucional";
  if (food.sourceScope === "global_seed") return "Catalogo QA";
  return food.sourceScope;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value: number | null | undefined) {
  return formatDisplayNumber(value, { fallback: "--" });
}
