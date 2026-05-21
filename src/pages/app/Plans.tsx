import { Edit2, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { PackPill } from "@/components/common/PackPill";
import { SourceStateBadge } from "@/components/common/SourceStateBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/features/auth/auth-context";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useCreateNutritionPlan, useTenantNutritionPlans, useTenantPatients, useUpdateNutritionPlan } from "@/hooks/useClinicalData";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { resolveViewSource } from "@/lib/view-source";
import { presentUpperStatus } from "@/lib/presentation";
import { formatDate, formatEnergyKcal, formatProteinG, formatVolumeMl, formatClinicalValue } from "@/lib/formatters";

const PLAN_TYPES = [
  { value: "hospitalario", label: "Hospitalario" },
  { value: "enteral", label: "Enteral" },
  { value: "deportivo", label: "Deportivo" },
  { value: "gineco", label: "Gineco-obstétrico" },
  { value: "pediatrico", label: "Pediátrico" },
];

export default function Plans() {
  const { isAuthenticated } = useAuth();
  const { activeTenantId } = useTenantRuntime();
  const { hasPermission } = useAuthorization();
  const { data: plansResult } = useTenantNutritionPlans();
  const { data: patientResult } = useTenantPatients();
  const createPlan = useCreateNutritionPlan();
  const updatePlan = useUpdateNutritionPlan();
  const [showCreate, setShowCreate] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const patients = useMemo(() => patientResult?.data ?? [], [patientResult?.data]);
  const plans = useMemo(() => plansResult?.data ?? [], [plansResult?.data]);
  const canCreatePlan = hasPermission("nutrition_plans.approve");
  const canUpdatePlan = hasPermission("nutrition_plans.approve");
  const viewSource = resolveViewSource({
    isAuthenticated,
    sources: [plansResult?.source, patientResult?.source],
  });
  const [patientId, setPatientId] = useState("");
  const [type, setType] = useState("hospitalario");
  const [kcal, setKcal] = useState("1800");
  const [protein, setProtein] = useState("90");
  const [carbs, setCarbs] = useState("210");
  const [fat, setFat] = useState("55");
  const [fluids, setFluids] = useState("1500");
  const [diet, setDiet] = useState("Fórmula hiperproteica");
  const [goals, setGoals] = useState("Mejorar adherencia\nReevaluar en 7 días");
  const [restrictions, setRestrictions] = useState("");
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [editForm, setEditForm] = useState({
    patientId: "",
    type: "hospitalario",
    kcal: "",
    protein: "",
    carbs: "",
    fat: "",
    fluids: "",
    diet: "",
    goals: "",
    restrictions: "",
    status: "draft",
    nextFollowUpAt: "",
  });

  useEffect(() => {
    if (!patientId && patients[0]?.id) {
      setPatientId(patients[0].id);
    }
  }, [patientId, patients]);

  async function handleCreatePlan() {
    setFormError(null);

    if (!activeTenantId) {
      setFormError("Selecciona un tenant activo antes de crear planes.");
      return;
    }

    if (!canCreatePlan) {
      setFormError("Tu rol no permite crear planes nutricionales en este tenant.");
      return;
    }

    if (!patientId) {
      setFormError("Selecciona un paciente.");
      return;
    }

    const numericFields = [
      { label: "energía", value: Number(kcal) },
      { label: "proteína", value: Number(protein) },
      { label: "carbohidratos", value: Number(carbs) },
      { label: "grasa", value: Number(fat) },
      { label: "líquidos", value: Number(fluids) },
    ];

    const invalidField = numericFields.find((field) => !Number.isFinite(field.value) || field.value < 0);
    if (invalidField) {
      setFormError(`El valor de ${invalidField.label} debe ser un número mayor o igual a cero.`);
      return;
    }

    if (!diet.trim()) {
      setFormError("Describe la dieta, fórmula o prescripción base.");
      return;
    }

    try {
      await createPlan.mutateAsync({
        tenantId: activeTenantId,
        patientId,
        type,
        kcal: Number(kcal),
        proteinG: Number(protein),
        carbsG: Number(carbs),
        fatG: Number(fat),
        fluidsMl: Number(fluids),
        diet: diet.trim(),
        goals: goals
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        restrictions: restrictions
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        status: "draft",
        nextFollowUpAt: nextFollowUpAt ? new Date(`${nextFollowUpAt}T12:00:00`).toISOString() : null,
      });

      setShowCreate(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo crear el plan.");
    }
  }

  function startEditPlan(plan: (typeof plans)[number]) {
    setEditError(null);
    setEditingPlanId(plan.id);
    setEditForm({
      patientId: plan.patientId,
      type: plan.type,
      kcal: plan.kcal?.toString() ?? "",
      protein: plan.proteinG?.toString() ?? "",
      carbs: plan.carbsG?.toString() ?? "",
      fat: plan.fatG?.toString() ?? "",
      fluids: plan.fluidsMl?.toString() ?? "",
      diet: plan.diet ?? "",
      goals: plan.goals.join("\n"),
      restrictions: plan.restrictions.join("\n"),
      status: plan.status,
      nextFollowUpAt: plan.nextFollowUpAt ? plan.nextFollowUpAt.slice(0, 10) : "",
    });
  }

  async function handleUpdatePlan() {
    setEditError(null);

    if (!activeTenantId || !editingPlanId) {
      setEditError("Selecciona un tenant y un plan antes de guardar cambios.");
      return;
    }

    if (!editForm.patientId) {
      setEditError("Selecciona un paciente.");
      return;
    }

    const numericFields = [
      { label: "energía", value: editForm.kcal ? Number(editForm.kcal) : null },
      { label: "proteína", value: editForm.protein ? Number(editForm.protein) : null },
      { label: "carbohidratos", value: editForm.carbs ? Number(editForm.carbs) : null },
      { label: "grasa", value: editForm.fat ? Number(editForm.fat) : null },
      { label: "líquidos", value: editForm.fluids ? Number(editForm.fluids) : null },
    ];

    const invalidField = numericFields.find((field) => field.value !== null && (!Number.isFinite(field.value) || field.value < 0));
    if (invalidField) {
      setEditError(`El valor de ${invalidField.label} debe ser un número mayor o igual a cero.`);
      return;
    }

    if (!editForm.diet.trim()) {
      setEditError("Describe la dieta, fórmula o prescripción base.");
      return;
    }

    try {
      await updatePlan.mutateAsync({
        tenantId: activeTenantId,
        planId: editingPlanId,
        patientId: editForm.patientId,
        type: editForm.type,
        kcal: editForm.kcal ? Number(editForm.kcal) : null,
        proteinG: editForm.protein ? Number(editForm.protein) : null,
        carbsG: editForm.carbs ? Number(editForm.carbs) : null,
        fatG: editForm.fat ? Number(editForm.fat) : null,
        fluidsMl: editForm.fluids ? Number(editForm.fluids) : null,
        diet: editForm.diet.trim(),
        goals: editForm.goals
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        restrictions: editForm.restrictions
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        status: editForm.status,
        nextFollowUpAt: editForm.nextFollowUpAt ? new Date(`${editForm.nextFollowUpAt}T12:00:00`).toISOString() : null,
      });

      setEditingPlanId(null);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "No se pudo actualizar el plan.");
    }
  }

  return (
    <div>
      <PageHeader
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <span>Prescripción - plantillas reutilizables</span>
            <SourceStateBadge source={viewSource} />
          </div>
        }
        title="Planes nutricionales"
        subtitle="Prescripción operativa por calorías, macros, fluidos y tipo de intervención."
        actions={
          <Button
            size="sm"
            className="h-8 border-0 text-[12px] text-primary-foreground gradient-primary"
            onClick={() => (canCreatePlan ? setShowCreate(true) : setFormError("Tu rol no permite crear planes nutricionales en este tenant."))}
            disabled={!canCreatePlan}
            title={!canCreatePlan ? "Sin permiso para crear planes" : undefined}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nuevo plan
          </Button>
        }
      />

      <div className="space-y-4 p-6">
        {viewSource === "fallback" && (
          <div className="panel px-4 py-3 text-[12px] text-muted-foreground">
            La vista conserva la experiencia completa mientras se termina de poblar el dataset remoto de planes.
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const patient = patients.find((item) => item.id === plan.patientId);
            const pack = patient?.primaryPack ?? "clinical";

            return (
              <div key={plan.id} className="panel space-y-4 p-5 transition-colors hover:border-primary/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      {plan.type} - {plan.diet ?? "sin dieta"}
                    </div>
                    <h3 className="mt-0.5 text-[15px] font-medium">{patient?.fullName ?? plan.patientId}</h3>
                    <div className="mt-2">
                      <PackPill pack={pack} />
                    </div>
                  </div>
                  <span className="rounded border border-risk-low/30 bg-risk-low/12 px-1.5 py-0.5 text-[10px] font-mono uppercase text-risk-low">
                    {presentUpperStatus(plan.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 tabular text-[12px]">
                  <Mini label="Energía" value={formatEnergyKcal(plan.kcal)} />
                  <Mini label="Proteína" value={formatProteinG(plan.proteinG)} />
                  <Mini label="Carbohidratos" value={formatClinicalValue(plan.carbsG, "g", "No calculado")} />
                  <Mini label="Grasa" value={formatClinicalValue(plan.fatG, "g", "No calculado")} />
                  <Mini label="Líquidos" value={formatVolumeMl(plan.fluidsMl)} />
                  <Mini
                    label="Inicio"
                    value={formatDate(plan.createdAt)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="h-7 px-2 text-[11px]" onClick={() => startEditPlan(plan)} disabled={!canUpdatePlan}>
                    <Edit2 className="mr-1 h-3 w-3" />
                    Editar plan
                  </Button>
                </div>
              </div>
            );
          })}

          {plans.length === 0 && (
            <div className="panel p-5 text-[13px] text-muted-foreground">
              No hay planes persistidos para el tenant activo.
            </div>
          )}
        </div>
      </div>

      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent side="right" className="w-[680px] overflow-y-auto sm:max-w-[680px]">
          <SheetHeader>
            <SheetTitle>Nuevo plan nutricional</SheetTitle>
            <SheetDescription>
              Prescripción en ventana flotante. El plan se persiste y la grilla se actualiza sin salir de la vista.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Paciente">
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Tipo">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_TYPES.map((planType) => (
                    <SelectItem key={planType.value} value={planType.value}>
                      {planType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Kcal">
              <Input value={kcal} onChange={(event) => setKcal(event.target.value)} />
            </Field>
            <Field label="Proteína">
              <Input value={protein} onChange={(event) => setProtein(event.target.value)} />
            </Field>
            <Field label="Carbohidratos">
              <Input value={carbs} onChange={(event) => setCarbs(event.target.value)} />
            </Field>
            <Field label="Grasa">
              <Input value={fat} onChange={(event) => setFat(event.target.value)} />
            </Field>
            <Field label="Líquidos">
              <Input value={fluids} onChange={(event) => setFluids(event.target.value)} />
            </Field>
            <Field label="Dieta">
              <Input value={diet} onChange={(event) => setDiet(event.target.value)} />
            </Field>
            <Field label="Objetivos y recomendaciones">
              <Textarea value={goals} onChange={(event) => setGoals(event.target.value)} rows={3} />
            </Field>
            <Field label="Restricciones">
              <Textarea value={restrictions} onChange={(event) => setRestrictions(event.target.value)} rows={3} />
            </Field>
            <Field label="Próximo seguimiento">
              <Input type="date" value={nextFollowUpAt} onChange={(event) => setNextFollowUpAt(event.target.value)} />
            </Field>

            {(formError || createPlan.isError) && (
              <div className="rounded-md border border-risk-high/30 bg-risk-high/10 px-3 py-2 text-[12px] text-risk-high md:col-span-2">
                {formError ?? (createPlan.error instanceof Error ? createPlan.error.message : "No se pudo crear el plan.")}
              </div>
            )}
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleCreatePlan()} disabled={createPlan.isPending || !activeTenantId || !canCreatePlan}>
              {createPlan.isPending ? "Guardando..." : "Guardar plan"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(editingPlanId)} onOpenChange={(open) => !open && setEditingPlanId(null)}>
        <SheetContent side="right" className="w-[680px] overflow-y-auto sm:max-w-[680px]">
          <SheetHeader>
            <SheetTitle>Editar plan nutricional</SheetTitle>
            <SheetDescription>
              Ajusta objetivos, macros, restricciones y seguimiento. El cambio queda auditado.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Paciente">
              <Select value={editForm.patientId} onValueChange={(value) => setEditForm({ ...editForm, patientId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tipo">
              <Select value={editForm.type} onValueChange={(value) => setEditForm({ ...editForm, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_TYPES.map((planType) => (
                    <SelectItem key={planType.value} value={planType.value}>
                      {planType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Estado">
              <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Próximo seguimiento">
              <Input type="date" value={editForm.nextFollowUpAt} onChange={(event) => setEditForm({ ...editForm, nextFollowUpAt: event.target.value })} />
            </Field>
            <Field label="Kcal">
              <Input value={editForm.kcal} onChange={(event) => setEditForm({ ...editForm, kcal: event.target.value })} />
            </Field>
            <Field label="Proteína">
              <Input value={editForm.protein} onChange={(event) => setEditForm({ ...editForm, protein: event.target.value })} />
            </Field>
            <Field label="Carbohidratos">
              <Input value={editForm.carbs} onChange={(event) => setEditForm({ ...editForm, carbs: event.target.value })} />
            </Field>
            <Field label="Grasa">
              <Input value={editForm.fat} onChange={(event) => setEditForm({ ...editForm, fat: event.target.value })} />
            </Field>
            <Field label="Líquidos">
              <Input value={editForm.fluids} onChange={(event) => setEditForm({ ...editForm, fluids: event.target.value })} />
            </Field>
            <Field label="Dieta / recomendaciones">
              <Textarea value={editForm.diet} onChange={(event) => setEditForm({ ...editForm, diet: event.target.value })} rows={3} />
            </Field>
            <Field label="Objetivos">
              <Textarea value={editForm.goals} onChange={(event) => setEditForm({ ...editForm, goals: event.target.value })} rows={3} />
            </Field>
            <Field label="Restricciones">
              <Textarea value={editForm.restrictions} onChange={(event) => setEditForm({ ...editForm, restrictions: event.target.value })} rows={3} />
            </Field>

            {(editError || updatePlan.isError) && (
              <div className="rounded-md border border-risk-high/30 bg-risk-high/10 px-3 py-2 text-[12px] text-risk-high md:col-span-2">
                {editError ?? (updatePlan.error instanceof Error ? updatePlan.error.message : "No se pudo actualizar el plan.")}
              </div>
            )}
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditingPlanId(null)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleUpdatePlan()} disabled={updatePlan.isPending || !activeTenantId || !canUpdatePlan}>
              {updatePlan.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-surface-raised/40 p-2">
      <div className="text-[9px] font-mono uppercase text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
