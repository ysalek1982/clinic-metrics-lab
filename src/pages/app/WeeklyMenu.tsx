import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { CalendarDays, Download, Plus, Printer, Trash2 } from "lucide-react";
import { ActionDialog } from "@/components/common/ActionDialog";
import { AsyncActionFooter } from "@/components/common/AsyncActionFooter";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useFoodItems } from "@/hooks/useFoods";
import { useTenantPatients } from "@/hooks/useClinicalData";
import { useRecipes } from "@/hooks/useRecipes";
import {
  useAddWeeklyMenuItem,
  useCreateWeeklyMenu,
  useExportWeeklyMenuAudit,
  useRemoveWeeklyMenuItem,
  useUpdateWeeklyMenu,
  useWeeklyMenus,
} from "@/hooks/useWeeklyMenus";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { useToast } from "@/hooks/use-toast";
import { exportWeeklyMenuToExcel } from "@/lib/exportArtifacts";
import { formatNumber as formatDisplayNumber } from "@/lib/formatters";
import type { MealType, WeeklyMenuSummary } from "@/services/weeklyMenuService";

const days = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 7, label: "Dom" },
];

const meals: Array<{ value: MealType; label: string }> = [
  { value: "desayuno", label: "Desayuno" },
  { value: "media_manana", label: "Media mañana" },
  { value: "almuerzo", label: "Almuerzo" },
  { value: "merienda", label: "Merienda" },
  { value: "cena", label: "Cena" },
  { value: "colacion", label: "Colación" },
];

type MenuFormState = {
  patientId: string;
  name: string;
  weekStart: string;
  kcalTarget: string;
  proteinTargetG: string;
  carbsTargetG: string;
  fatTargetG: string;
  notes: string;
};

type ItemFormState = {
  dayOfWeek: number;
  mealType: MealType;
  mode: "recipe" | "food";
  recipeId: string;
  foodItemId: string;
  quantityG: string;
  portions: string;
  notes: string;
};

function startOfWeekInput(date = new Date()) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return formatDateInput(next);
}

function formatDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildMenuForm(patientId = ""): MenuFormState {
  return {
    patientId,
    name: "Menú semanal nutricional",
    weekStart: startOfWeekInput(),
    kcalTarget: "",
    proteinTargetG: "",
    carbsTargetG: "",
    fatTargetG: "",
    notes: "",
  };
}

function buildItemForm(dayOfWeek = 1, mealType: MealType = "desayuno"): ItemFormState {
  return {
    dayOfWeek,
    mealType,
    mode: "recipe",
    recipeId: "",
    foodItemId: "",
    quantityG: "100",
    portions: "1",
    notes: "",
  };
}

export default function WeeklyMenu() {
  const { activeTenantId, isDemoMode, isLoading: tenantLoading } = useTenantRuntime();
  const { hasPermission } = useAuthorization();
  const canRead = hasPermission("weekly_menus.read");
  const canCreate = hasPermission("weekly_menus.create");
  const canUpdate = hasPermission("weekly_menus.update");
  const canClose = hasPermission("weekly_menus.close");
  const patientsQuery = useTenantPatients();
  const menusQuery = useWeeklyMenus();
  const recipesQuery = useRecipes();
  const foodsQuery = useFoodItems();
  const createMenuMutation = useCreateWeeklyMenu();
  const updateMenuMutation = useUpdateWeeklyMenu();
  const addItemMutation = useAddWeeklyMenuItem();
  const removeItemMutation = useRemoveWeeklyMenuItem();
  const exportAudit = useExportWeeklyMenuAudit();
  const { toast } = useToast();
  const patients = useMemo(() => patientsQuery.data?.data ?? [], [patientsQuery.data]);
  const menus = useMemo(() => menusQuery.data ?? [], [menusQuery.data]);
  const recipes = useMemo(() => recipesQuery.data ?? [], [recipesQuery.data]);
  const foods = useMemo(() => foodsQuery.data ?? [], [foodsQuery.data]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => menus.find((menu) => menu.id === selectedId) ?? menus[0] ?? null, [menus, selectedId]);
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<WeeklyMenuSummary | null>(null);
  const [menuForm, setMenuForm] = useState<MenuFormState>(() => buildMenuForm());
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemForm, setItemForm] = useState<ItemFormState>(() => buildItemForm());
  const [statusAction, setStatusAction] = useState<{ menu: WeeklyMenuSummary; status: "active" | "closed" } | null>(null);
  const [printMenu, setPrintMenu] = useState<WeeklyMenuSummary | null>(null);
  const [statusActionError, setStatusActionError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && menus.length > 0) setSelectedId(menus[0].id);
    if (selectedId && menus.length > 0 && !menus.some((menu) => menu.id === selectedId)) setSelectedId(menus[0].id);
  }, [menus, selectedId]);

  const openCreateMenu = () => {
    setEditingMenu(null);
    setMenuForm(buildMenuForm(patients[0]?.id ?? ""));
    setFormError(null);
    setMenuDialogOpen(true);
  };

  const openEditMenu = (menu: WeeklyMenuSummary) => {
    setEditingMenu(menu);
    setMenuForm({
      patientId: menu.patientId,
      name: menu.name,
      weekStart: menu.weekStart,
      kcalTarget: toInput(menu.kcalTarget),
      proteinTargetG: toInput(menu.proteinTargetG),
      carbsTargetG: toInput(menu.carbsTargetG),
      fatTargetG: toInput(menu.fatTargetG),
      notes: menu.notes ?? "",
    });
    setFormError(null);
    setMenuDialogOpen(true);
  };

  const openAddItem = (dayOfWeek: number, mealType: MealType) => {
    setItemForm({
      ...buildItemForm(dayOfWeek, mealType),
      recipeId: recipes[0]?.id ?? "",
      foodItemId: foods[0]?.id ?? "",
    });
    setFormError(null);
    setItemDialogOpen(true);
  };

  const handleMenuSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeTenantId) return;
    const payload = {
      tenantId: activeTenantId,
      patientId: menuForm.patientId,
      name: menuForm.name,
      weekStart: menuForm.weekStart,
      kcalTarget: parseOptionalNumber(menuForm.kcalTarget),
      proteinTargetG: parseOptionalNumber(menuForm.proteinTargetG),
      carbsTargetG: parseOptionalNumber(menuForm.carbsTargetG),
      fatTargetG: parseOptionalNumber(menuForm.fatTargetG),
      notes: menuForm.notes || null,
    };

    try {
      const saved = editingMenu
        ? await updateMenuMutation.mutateAsync({ ...payload, weeklyMenuId: editingMenu.id })
        : await createMenuMutation.mutateAsync(payload);
      setSelectedId(saved.id);
      setMenuDialogOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo guardar el menú.");
    }
  };

  const handleItemSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeTenantId || !selected) return;
    try {
      await addItemMutation.mutateAsync({
        tenantId: activeTenantId,
        weeklyMenuId: selected.id,
        dayOfWeek: itemForm.dayOfWeek,
        mealType: itemForm.mealType,
        recipeId: itemForm.mode === "recipe" ? itemForm.recipeId : null,
        foodItemId: itemForm.mode === "food" ? itemForm.foodItemId : null,
        quantityG: itemForm.mode === "food" ? Number(itemForm.quantityG) : null,
        portions: itemForm.mode === "recipe" ? Number(itemForm.portions) || 1 : 1,
        notes: itemForm.notes || null,
      });
      setItemDialogOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo agregar el alimento o receta.");
    }
  };

  const changeMenuStatus = async (menu: WeeklyMenuSummary, status: "active" | "closed") => {
    if (!activeTenantId) return;
    await updateMenuMutation.mutateAsync({
      tenantId: activeTenantId,
      weeklyMenuId: menu.id,
      patientId: menu.patientId,
      name: menu.name,
      weekStart: menu.weekStart,
      kcalTarget: menu.kcalTarget,
      proteinTargetG: menu.proteinTargetG,
      carbsTargetG: menu.carbsTargetG,
      fatTargetG: menu.fatTargetG,
      notes: menu.notes,
      status,
    });
  };

  const confirmMenuStatus = async () => {
    if (!statusAction) return;
    setStatusActionError(null);
    try {
      await changeMenuStatus(statusAction.menu, statusAction.status);
      setStatusAction(null);
    } catch (error) {
      setStatusActionError(error instanceof Error ? error.message : "No se pudo actualizar el estado del menu.");
    }
  };

  const handlePrintMenu = async () => {
    if (!selected || !activeTenantId) return;
    try {
      await exportAudit.mutateAsync({ tenantId: activeTenantId, weeklyMenuId: selected.id, format: "print" });
      setPrintMenu(selected);
    } catch (error) {
      toast({
        title: "No se pudo preparar la impresión",
        description: error instanceof Error ? error.message : "Revisa permisos y datos del menú.",
        variant: "destructive",
      });
    }
  };

  const handleExportMenuExcel = async () => {
    if (!selected || !activeTenantId) return;
    try {
      await exportWeeklyMenuToExcel(selected);
      await exportAudit.mutateAsync({ tenantId: activeTenantId, weeklyMenuId: selected.id, format: "xlsx" });
    } catch (error) {
      toast({
        title: "No se pudo exportar",
        description: error instanceof Error ? error.message : "Revisa permisos y datos del menú.",
        variant: "destructive",
      });
    }
  };

  if (tenantLoading) {
    return <WeeklyMenuState title="Menú semanal" message="Cargando contexto institucional..." />;
  }

  if (!isDemoMode && !canRead) {
    return <WeeklyMenuState title="Menú semanal" message="No tienes permiso para consultar menús semanales de este tenant." />;
  }

  const isLoading = !isDemoMode && (menusQuery.isLoading || patientsQuery.isLoading || recipesQuery.isLoading || foodsQuery.isLoading);
  const errorMessage = !isDemoMode && (menusQuery.error || patientsQuery.error || recipesQuery.error || foodsQuery.error)
    ? "No se pudo cargar el menú semanal desde Supabase."
    : null;

  return (
    <div>
      <PageHeader
        meta="Nutrición · Planificación semanal"
        title="Menú semanal"
        subtitle="Matriz real por día y comida con alimentos, recetas y cálculo nutricional."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => void handlePrintMenu()} disabled={!selected || exportAudit.isPending}>
              <Printer className="h-3.5 w-3.5" />
              Imprimir
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => void handleExportMenuExcel()} disabled={!selected || exportAudit.isPending}>
              <Download className="h-3.5 w-3.5" />
              Excel
            </Button>
            <Button size="sm" className="h-8 gap-2 border-0 bg-primary text-primary-foreground hover:bg-primary/90" onClick={openCreateMenu} disabled={!canCreate || isDemoMode || patients.length === 0}>
              <Plus className="h-3.5 w-3.5" />
              Nuevo menú
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 p-6 xl:grid-cols-[320px_1fr]">
        <aside className="panel overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Menús del tenant</div>
            <h2 className="mt-1 text-[15px] font-medium">{menus.length} registros</h2>
          </div>
          {isLoading ? (
            <InlineState message="Cargando menús reales..." />
          ) : errorMessage ? (
            <InlineState message={errorMessage} />
          ) : menus.length === 0 ? (
            <InlineState message="Este módulo aún no tiene datos reales configurados para este tenant." />
          ) : (
            <div className="divide-y divide-border">
              {menus.map((menu) => (
                <button
                  key={menu.id}
                  type="button"
                  onClick={() => setSelectedId(menu.id)}
                  className={`w-full px-4 py-3 text-left transition-colors hover:bg-surface-raised/40 ${selected?.id === menu.id ? "bg-primary/10" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[13px] font-semibold">{menu.name}</div>
                      <div className="mt-1 text-[11px] font-mono text-muted-foreground">{menu.patientName ?? "Paciente"} · {menu.weekStart}</div>
                    </div>
                    <StatusBadge status={menu.status} />
                  </div>
                  <div className="mt-3 text-[11px] text-muted-foreground">{formatNumber(menu.nutrition.weekly.kcal)} kcal semanales</div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <main className="space-y-4">
          {!selected ? (
            <div className="panel flex min-h-[420px] items-center justify-center text-center text-[13px] text-muted-foreground">
              Crea o selecciona un menú semanal real.
            </div>
          ) : (
            <>
              <section className="panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Paciente</div>
                    <h2 className="mt-1 text-xl font-semibold">{selected.patientName ?? "Paciente sin nombre"}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] font-mono text-muted-foreground">
                      <span>{selected.patientMrn ?? "--"}</span>
                      <span>·</span>
                      <span>Semana {selected.weekStart}</span>
                      <StatusBadge status={selected.status} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="h-8" onClick={() => openEditMenu(selected)} disabled={!canUpdate}>Editar metas</Button>
                    <Button variant="outline" size="sm" className="h-8" onClick={() => setStatusAction({ menu: selected, status: "active" })} disabled={!canClose || selected.status === "active"}>Activar</Button>
                    <Button variant="outline" size="sm" className="h-8" onClick={() => setStatusAction({ menu: selected, status: "closed" })} disabled={!canClose || selected.status === "closed"}>Cerrar</Button>
                  </div>
                </div>
                <div className="mt-5 grid gap-2 md:grid-cols-4">
                  <Metric label="Kcal semanales" value={formatNumber(selected.nutrition.weekly.kcal)} target={weeklyTarget(selected.nutrition.weekly.kcal, selected.kcalTarget)} />
                  <Metric label="Proteína" value={`${formatNumber(selected.nutrition.weekly.proteinG)} g`} target={weeklyTarget(selected.nutrition.weekly.proteinG, selected.proteinTargetG, "g")} />
                  <Metric label="CHO" value={`${formatNumber(selected.nutrition.weekly.carbsG)} g`} target={weeklyTarget(selected.nutrition.weekly.carbsG, selected.carbsTargetG, "g")} />
                  <Metric label="Grasa" value={`${formatNumber(selected.nutrition.weekly.fatG)} g`} target={weeklyTarget(selected.nutrition.weekly.fatG, selected.fatTargetG, "g")} />
                </div>
              </section>

              <section className="panel overflow-x-auto">
                <div className="min-w-[1060px]">
                  <div className="grid grid-cols-[130px_repeat(7,minmax(130px,1fr))] border-b border-border bg-surface-raised/35">
                    <div className="px-3 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Comida</div>
                    {days.map((day) => (
                      <div key={day.value} className="border-l border-border px-3 py-3">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{day.label}</div>
                        <div className="mt-1 text-[11px] font-mono text-primary">{formatNumber(dayTotal(selected, day.value).kcal)} kcal</div>
                      </div>
                    ))}
                  </div>
                  {meals.map((meal) => (
                    <div key={meal.value} className="grid min-h-[140px] grid-cols-[130px_repeat(7,minmax(130px,1fr))] border-b border-border last:border-b-0">
                      <div className="px-3 py-3 text-[12px] font-semibold">{meal.label}</div>
                      {days.map((day) => {
                        const cellItems = selected.items.filter((item) => item.dayOfWeek === day.value && item.mealType === meal.value);
                        return (
                          <div key={`${day.value}-${meal.value}`} className="space-y-2 border-l border-border p-2">
                            {cellItems.map((item) => (
                              <div key={item.id} className="rounded-lg border border-border bg-surface-raised/35 p-2">
                                <div className="text-[12px] font-medium">{item.recipe?.name ?? item.food?.name ?? "Item"}</div>
                                <div className="mt-1 text-[10px] font-mono text-muted-foreground">
                                  {formatNumber(item.nutrition.kcal)} kcal · {formatNumber(item.nutrition.proteinG)} g P
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="mt-2 h-6 px-2 text-[10px]"
                                  onClick={() => removeItemMutation.mutate({ tenantId: selected.tenantId, weeklyMenuItemId: item.id, weeklyMenuId: selected.id })}
                                  disabled={!canUpdate}
                                >
                                  <Trash2 className="mr-1 h-3 w-3" />
                                  Quitar
                                </Button>
                              </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" className="h-7 w-full text-[10px]" onClick={() => openAddItem(day.value, meal.value)} disabled={!canUpdate || (recipes.length === 0 && foods.length === 0)}>
                              <Plus className="mr-1 h-3 w-3" />
                              Agregar
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div className="grid grid-cols-[130px_repeat(7,minmax(130px,1fr))] bg-surface-raised/20">
                    <div className="px-3 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Totales diarios</div>
                    {days.map((day) => {
                      const total = dayTotal(selected, day.value);
                      return (
                        <div key={`total-${day.value}`} className="border-l border-border px-3 py-3">
                          <div className="text-[12px] font-semibold">{formatNumber(total.kcal)} kcal</div>
                          <div className="mt-1 text-[10px] font-mono text-muted-foreground">
                            P {formatNumber(total.proteinG)} · CHO {formatNumber(total.carbsG)} · G {formatNumber(total.fatG)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      <Dialog open={menuDialogOpen} onOpenChange={setMenuDialogOpen}>
        <DialogContent className="max-w-2xl border-border bg-surface text-foreground">
          <DialogHeader>
            <DialogTitle>{editingMenu ? "Editar menú semanal" : "Nuevo menú semanal"}</DialogTitle>
            <DialogDescription className="text-[12px] text-muted-foreground">Asocia el menú a un paciente real y define metas semanales.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleMenuSubmit}>
            {formError && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{formError}</div>}
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Paciente">
                <select value={menuForm.patientId} onChange={(event) => setMenuForm((current) => ({ ...current, patientId: event.target.value }))} className="h-10 w-full rounded-md border border-border bg-background px-3 text-[13px]" required>
                  <option value="">Selecciona paciente</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>{patient.fullName} · {patient.mrn}</option>
                  ))}
                </select>
              </Field>
              <Field label="Semana inicio">
                <Input type="date" value={menuForm.weekStart} onChange={(event) => setMenuForm((current) => ({ ...current, weekStart: event.target.value }))} required />
              </Field>
              <Field label="Nombre">
                <Input value={menuForm.name} onChange={(event) => setMenuForm((current) => ({ ...current, name: event.target.value }))} required />
              </Field>
              <Field label="Meta kcal">
                <Input type="number" min="0" step="1" value={menuForm.kcalTarget} onChange={(event) => setMenuForm((current) => ({ ...current, kcalTarget: event.target.value }))} />
              </Field>
              <Field label="Meta proteína">
                <Input type="number" min="0" step="1" value={menuForm.proteinTargetG} onChange={(event) => setMenuForm((current) => ({ ...current, proteinTargetG: event.target.value }))} />
              </Field>
              <Field label="Meta CHO">
                <Input type="number" min="0" step="1" value={menuForm.carbsTargetG} onChange={(event) => setMenuForm((current) => ({ ...current, carbsTargetG: event.target.value }))} />
              </Field>
              <Field label="Meta grasa">
                <Input type="number" min="0" step="1" value={menuForm.fatTargetG} onChange={(event) => setMenuForm((current) => ({ ...current, fatTargetG: event.target.value }))} />
              </Field>
            </div>
            <Field label="Notas">
              <Textarea value={menuForm.notes} onChange={(event) => setMenuForm((current) => ({ ...current, notes: event.target.value }))} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setMenuDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMenuMutation.isPending || updateMenuMutation.isPending}>Guardar menú</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ActionDialog
        open={Boolean(statusAction)}
        onOpenChange={(open) => {
          if (!open) setStatusAction(null);
        }}
        title={statusAction?.status === "closed" ? "Cerrar menu semanal" : "Activar menu semanal"}
        description={statusAction?.menu.name}
        loading={updateMenuMutation.isPending}
        error={statusActionError}
        destructive={statusAction?.status === "closed"}
        submitLabel={statusAction?.status === "closed" ? "Cerrar menu" : "Activar menu"}
        loadingLabel="Actualizando..."
        onSubmit={confirmMenuStatus}
      >
        <div className="rounded-md border border-border bg-surface-raised/40 px-3 py-2 text-[12px] text-muted-foreground">
          Esta accion cambia el estado del menu semanal sin salir de la pantalla.
        </div>
      </ActionDialog>

      <ActionDialog
        open={Boolean(printMenu)}
        onOpenChange={(open) => {
          if (!open) setPrintMenu(null);
        }}
        title={printMenu?.name ?? "Vista imprimible"}
        description="Vista interna preparada sin abrir ventanas externas. Usa Excel para descargar un archivo."
        className="max-w-5xl"
        footer={<AsyncActionFooter cancelLabel="Cerrar" onCancel={() => setPrintMenu(null)} />}
      >
        {printMenu && <PrintableWeeklyMenu menu={printMenu} />}
      </ActionDialog>

      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-xl border-border bg-surface text-foreground">
          <DialogHeader>
            <DialogTitle>Agregar alimento o receta</DialogTitle>
            <DialogDescription className="text-[12px] text-muted-foreground">La matriz usa alimentos y recetas reales del tenant.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleItemSubmit}>
            {formError && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{formError}</div>}
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Día">
                <select value={itemForm.dayOfWeek} onChange={(event) => setItemForm((current) => ({ ...current, dayOfWeek: Number(event.target.value) }))} className="h-10 w-full rounded-md border border-border bg-background px-3 text-[13px]">
                  {days.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
                </select>
              </Field>
              <Field label="Comida">
                <select value={itemForm.mealType} onChange={(event) => setItemForm((current) => ({ ...current, mealType: event.target.value as MealType }))} className="h-10 w-full rounded-md border border-border bg-background px-3 text-[13px]">
                  {meals.map((meal) => <option key={meal.value} value={meal.value}>{meal.label}</option>)}
                </select>
              </Field>
              <Field label="Tipo">
                <select value={itemForm.mode} onChange={(event) => setItemForm((current) => ({ ...current, mode: event.target.value as "recipe" | "food" }))} className="h-10 w-full rounded-md border border-border bg-background px-3 text-[13px]">
                  <option value="recipe">Receta</option>
                  <option value="food">Alimento</option>
                </select>
              </Field>
              {itemForm.mode === "recipe" ? (
                <>
                  <Field label="Receta">
                    <select value={itemForm.recipeId} onChange={(event) => setItemForm((current) => ({ ...current, recipeId: event.target.value }))} className="h-10 w-full rounded-md border border-border bg-background px-3 text-[13px]" required>
                      <option value="">Selecciona receta</option>
                      {recipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Porciones">
                    <Input type="number" min="0.25" step="0.25" value={itemForm.portions} onChange={(event) => setItemForm((current) => ({ ...current, portions: event.target.value }))} />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Alimento">
                    <select value={itemForm.foodItemId} onChange={(event) => setItemForm((current) => ({ ...current, foodItemId: event.target.value }))} className="h-10 w-full rounded-md border border-border bg-background px-3 text-[13px]" required>
                      <option value="">Selecciona alimento</option>
                      {foods.map((food) => <option key={food.id} value={food.id}>{food.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Gramos">
                    <Input type="number" min="1" step="1" value={itemForm.quantityG} onChange={(event) => setItemForm((current) => ({ ...current, quantityG: event.target.value }))} />
                  </Field>
                </>
              )}
            </div>
            <Field label="Notas">
              <Textarea value={itemForm.notes} onChange={(event) => setItemForm((current) => ({ ...current, notes: event.target.value }))} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setItemDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={addItemMutation.isPending}>Agregar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WeeklyMenuState({ title, message }: { title: string; message: string }) {
  return (
    <div>
      <PageHeader meta="Nutrición · Planificación semanal" title={title} subtitle="Matriz real por día y comida con alimentos, recetas y cálculo nutricional." />
      <div className="p-6">
        <div className="panel flex min-h-[320px] items-center justify-center px-6 text-center">
          <div>
            <CalendarDays className="mx-auto h-6 w-6 text-primary" />
            <div className="mt-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Menú semanal</div>
            <div className="mt-2 text-sm text-muted-foreground">{message}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InlineState({ message }: { message: string }) {
  return <div className="flex min-h-[280px] items-center justify-center px-6 text-center text-[13px] text-muted-foreground">{message}</div>;
}

function StatusBadge({ status }: { status: string }) {
  const label = status === "active" ? "Activo" : status === "closed" ? "Cerrado" : "Borrador";
  const color = status === "active" ? "border-primary/40 bg-primary/10 text-primary" : status === "closed" ? "border-muted/40 bg-muted/10 text-muted-foreground" : "border-warning/40 bg-warning/10 text-warning";
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase ${color}`}>{label}</span>;
}

function Metric({ label, value, target }: { label: string; value: string; target?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-raised/30 p-3">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular">{value}</div>
      {target && <div className="mt-1 text-[10px] text-muted-foreground">{target}</div>}
    </div>
  );
}

function PrintableWeeklyMenu({ menu }: { menu: WeeklyMenuSummary }) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-background p-4 text-[12px]">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Menú semanal</div>
        <h3 className="mt-1 text-lg font-semibold">{menu.name}</h3>
        <p className="mt-1 text-muted-foreground">
          {menu.patientName ?? "Paciente sin nombre"} · semana {menu.weekStart}
        </p>
      </div>
      <div className="grid gap-2 md:grid-cols-4">
        <Metric label="Kcal semanales" value={formatNumber(menu.nutrition.weekly.kcal)} />
        <Metric label="Proteína" value={`${formatNumber(menu.nutrition.weekly.proteinG)} g`} />
        <Metric label="CHO" value={`${formatNumber(menu.nutrition.weekly.carbsG)} g`} />
        <Metric label="Grasa" value={`${formatNumber(menu.nutrition.weekly.fatG)} g`} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead className="text-[10px] font-mono uppercase text-muted-foreground">
            <tr>
              <th className="border border-border px-3 py-2">Día</th>
              <th className="border border-border px-3 py-2">Comida</th>
              <th className="border border-border px-3 py-2">Item</th>
              <th className="border border-border px-3 py-2">Kcal</th>
              <th className="border border-border px-3 py-2">Proteína</th>
            </tr>
          </thead>
          <tbody>
            {menu.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="border border-border px-3 py-8 text-center text-muted-foreground">
                  Sin alimentos o recetas registrados.
                </td>
              </tr>
            ) : (
              menu.items.map((item) => (
                <tr key={item.id}>
                  <td className="border border-border px-3 py-2">{days.find((day) => day.value === item.dayOfWeek)?.label ?? item.dayOfWeek}</td>
                  <td className="border border-border px-3 py-2">{meals.find((meal) => meal.value === item.mealType)?.label ?? item.mealType}</td>
                  <td className="border border-border px-3 py-2">{item.recipe?.name ?? item.food?.name ?? "Item sin nombre"}</td>
                  <td className="border border-border px-3 py-2 font-mono">{formatNumber(item.nutrition.kcal)}</td>
                  <td className="border border-border px-3 py-2 font-mono">{formatNumber(item.nutrition.proteinG)} g</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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

function parseOptionalNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toInput(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

function dayTotal(menu: WeeklyMenuSummary, dayOfWeek: number) {
  return menu.nutrition.daily.find((day) => day.dayOfWeek === dayOfWeek) ?? {
    dayOfWeek,
    kcal: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
  };
}

function weeklyTarget(actual: number, target: number | null | undefined, unit = "") {
  if (!target) return undefined;
  const delta = actual - target;
  const sign = delta > 0 ? "+" : "";
  return `Meta ${formatNumber(target)}${unit ? ` ${unit}` : ""} · ${sign}${formatNumber(delta)}${unit ? ` ${unit}` : ""}`;
}

function formatNumber(value: number | null | undefined) {
  return formatDisplayNumber(value, { fallback: "--" });
}
