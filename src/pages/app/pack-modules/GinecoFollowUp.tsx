import { useMemo, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SourceStateBadge } from "@/components/common/SourceStateBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useCreatePregnancyRecord, usePregnancyRecords } from "@/hooks/useSpecialtyModules";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { useToast } from "@/hooks/use-toast";
import type { AlertSummary } from "@/services/clinicalService";
import type { SaasPatientSnapshot } from "@/types/saas";
import { ModuleListCard } from "./shared";

export function GinecoFollowUp({ patients, alerts }: { patients: SaasPatientSnapshot[]; alerts: AlertSummary[] }) {
  const { activeTenantId } = useTenantRuntime();
  const { hasPermission } = useAuthorization();
  const { toast } = useToast();
  const pregnancyQuery = usePregnancyRecords();
  const createPregnancy = useCreatePregnancyRecord();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    patientId: "",
    gestationalWeek: "28",
    prePregnancyWeight: "",
    currentWeight: "",
    expectedGainMin: "",
    expectedGainMax: "",
    flags: "",
  });

  const pregnancyResult = pregnancyQuery.data ?? { source: "supabase" as const, data: [] };
  const pregnancyRecords = pregnancyResult.data ?? [];
  const patientIds = new Set(patients.map((patient) => patient.id));
  const packRecords = pregnancyRecords.filter((record) => patientIds.has(record.patientId));
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
  const canManage = hasPermission("gineco.manage");
  const trimester = useMemo(() => resolveTrimester(Number(form.gestationalWeek)), [form.gestationalWeek]);
  const trend = packRecords
    .slice()
    .reverse()
    .map((record) => ({
      week: String(record.gestationalWeek),
      expected: record.expectedGainMax ?? 0,
      actual: record.actualGain ?? 0,
    }));

  async function handleSave() {
    if (!activeTenantId) {
      toast({ title: "No hay tenant activo", description: "Selecciona un tenant antes de guardar." });
      return;
    }
    if (!canManage) {
      toast({ title: "Sin permisos", description: "Tu rol no puede registrar controles gineco-obstétricos." });
      return;
    }
    const gestationalWeek = Number(form.gestationalWeek);
    const prePregnancyWeight = parseOptionalNumber(form.prePregnancyWeight);
    const currentWeight = parseOptionalNumber(form.currentWeight);
    const actualGain = prePregnancyWeight != null && currentWeight != null ? Number((currentWeight - prePregnancyWeight).toFixed(2)) : null;

    try {
      await createPregnancy.mutateAsync({
        tenantId: activeTenantId,
        patientId: form.patientId,
        gestationalWeek,
        trimester,
        prePregnancyWeight,
        currentWeight,
        expectedGainMin: parseOptionalNumber(form.expectedGainMin),
        expectedGainMax: parseOptionalNumber(form.expectedGainMax),
        actualGain,
        flags: form.flags
          .split(",")
          .map((flag) => flag.trim())
          .filter(Boolean),
      });
      toast({ title: "Control guardado", description: "El seguimiento gineco-obstétrico quedó persistido." });
      setShowCreate(false);
      setForm({ patientId: "", gestationalWeek: "28", prePregnancyWeight: "", currentWeight: "", expectedGainMin: "", expectedGainMax: "", flags: "" });
    } catch (error) {
      toast({
        title: "No se pudo guardar",
        description: error instanceof Error ? error.message : "Revisa los datos e intenta nuevamente.",
        variant: "destructive",
      });
    }
  }

  return (
    <>
      <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Seguimiento por trimestre</div>
              <h3 className="mt-1 text-[16px] font-medium">Ganancia gestacional y control materno</h3>
            </div>
            <div className="flex items-center gap-2">
              <SourceStateBadge source={pregnancyResult.source === "supabase" ? "real" : "demo"} />
              <Button size="sm" onClick={() => setShowCreate(true)} disabled={!canManage}>
                <Plus className="h-4 w-4" />
                Nuevo control
              </Button>
            </div>
          </div>
          <div className="mt-4 h-80">
            {pregnancyQuery.isLoading ? (
              <StateText>Cargando controles gineco-obstétricos...</StateText>
            ) : trend.length === 0 ? (
              <StateText>No hay controles gestacionales reales registrados para este pack.</StateText>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--surface-raised))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                    }}
                  />
                  <Line type="monotone" dataKey="expected" stroke="hsl(var(--pack-enteral))" strokeWidth={2} />
                  <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <ModuleListCard
            title="Pacientes gineco"
            subtitle="Control por trimestre"
            rows={packRecords.slice(0, 5).map((record) => ({
              title: patientMap.get(record.patientId)?.fullName ?? "Paciente gineco",
              body: `Semana ${record.gestationalWeek} - ganancia ${record.actualGain ?? "sin dato"} kg - ${record.trimester}`,
              badge: record.flags[0] ?? "seguimiento",
            }))}
          />
          <ModuleListCard
            title="Alertas maternas"
            subtitle="Micronutrientes y seguimiento"
            rows={alerts.slice(0, 5).map((alert) => ({
              title: alert.patientName,
              body: alert.message,
              badge: alert.severity,
            }))}
          />
        </div>
      </div>

      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent side="right" className="w-[560px] overflow-y-auto sm:max-w-[560px]">
          <SheetHeader>
            <SheetTitle>Nuevo control gineco-obstétrico</SheetTitle>
            <SheetDescription>Registra semana gestacional, peso y banderas de seguimiento para el tenant activo.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <Field label="Paciente">
              <Select value={form.patientId} onValueChange={(value) => setForm((current) => ({ ...current, patientId: value }))}>
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
            <div className="grid grid-cols-2 gap-3">
              <Field label="Semana gestacional">
                <Input value={form.gestationalWeek} type="number" min={1} max={45} onChange={(event) => setForm((current) => ({ ...current, gestationalWeek: event.target.value }))} />
              </Field>
              <Field label="Trimestre">
                <Input value={trimester} disabled />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Peso pregestacional (kg)">
                <Input value={form.prePregnancyWeight} type="number" step="0.1" onChange={(event) => setForm((current) => ({ ...current, prePregnancyWeight: event.target.value }))} />
              </Field>
              <Field label="Peso actual (kg)">
                <Input value={form.currentWeight} type="number" step="0.1" onChange={(event) => setForm((current) => ({ ...current, currentWeight: event.target.value }))} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ganancia esperada min.">
                <Input value={form.expectedGainMin} type="number" step="0.1" onChange={(event) => setForm((current) => ({ ...current, expectedGainMin: event.target.value }))} />
              </Field>
              <Field label="Ganancia esperada max.">
                <Input value={form.expectedGainMax} type="number" step="0.1" onChange={(event) => setForm((current) => ({ ...current, expectedGainMax: event.target.value }))} />
              </Field>
            </div>
            <Field label="Banderas clínicas">
              <Input value={form.flags} placeholder="anemia, seguimiento semanal" onChange={(event) => setForm((current) => ({ ...current, flags: event.target.value }))} />
            </Field>
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createPregnancy.isPending || !form.patientId}>
              {createPregnancy.isPending ? "Guardando..." : "Guardar control"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

function StateText({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-border bg-surface-raised/20 text-center text-[13px] text-muted-foreground">
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2 text-[12px] font-medium text-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveTrimester(week: number) {
  if (!Number.isFinite(week) || week < 14) return "Primer trimestre";
  if (week < 28) return "Segundo trimestre";
  return "Tercer trimestre";
}
