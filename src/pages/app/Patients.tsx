import { ArrowUpDown, Edit2, Filter, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PackPill } from "@/components/common/PackPill";
import { PageHeader } from "@/components/common/PageHeader";
import { RiskBadge, RiskDot } from "@/components/common/RiskBadge";
import { SourceStateBadge } from "@/components/common/SourceStateBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/features/auth/auth-context";
import { useCreatePatient, useTenantPatients, useTenantReferences, useUpdatePatient } from "@/hooks/useClinicalData";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { useAuthorization } from "@/hooks/useAuthorization";
import { PACKS } from "@/data/packs";
import { resolveViewSource } from "@/lib/view-source";
import { formatDate, formatInteger } from "@/lib/formatters";

function patientStatusLabel(value: string) {
  const labels: Record<string, string> = {
    active: "Activo",
    monitoring: "En seguimiento",
    at_risk: "En riesgo",
    critical: "Crítico",
    discharged: "Alta",
    stable: "Estable",
  };

  return labels[value] ?? value;
}

export default function Patients() {
  const { isAuthenticated } = useAuth();
  const { activePack, activeTenant, activeTenantId } = useTenantRuntime();
  const { hasPermission } = useAuthorization();
  const { data: patientResult, isLoading } = useTenantPatients();
  const { data: referencesResult } = useTenantReferences();
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const patients = useMemo(() => patientResult?.data ?? [], [patientResult?.data]);
  const organizations = useMemo(
    () => (referencesResult?.data?.organizations ?? []).filter((organization) => Boolean(organization?.id)),
    [referencesResult?.data?.organizations],
  );
  const services = useMemo(
    () =>
      organizations
        .flatMap((organization) => (Array.isArray(organization?.services) ? organization.services : []))
        .filter((service) => Boolean(service?.id)),
    [organizations],
  );
  const branches = useMemo(
    () =>
      organizations
        .flatMap((organization) => (Array.isArray(organization?.branches) ? organization.branches : []))
        .filter((branch) => Boolean(branch?.id)),
    [organizations],
  );
  const serviceById = useMemo(
    () => new Map(services.map((service) => [service.id, service.name || "Servicio sin nombre"])),
    [services],
  );
  const enabledPackOptions = activeTenant?.enabledPacks?.length ? activeTenant?.enabledPacks ?? ["clinical"] : ["clinical"];
  const canCreatePatient = hasPermission("patients.create");
  const canUpdatePatient = hasPermission("patients.update") || hasPermission("patients.create");
  const viewSource = resolveViewSource({
    isAuthenticated,
    sources: [patientResult?.source, referencesResult?.source],
  });
  const [form, setForm] = useState({
    mrn: "",
    firstName: "",
    lastName: "",
    birthDate: "",
    sex: "female",
    primaryPackId: activePack !== "all" ? activePack : "clinical",
    diagnosisSummary: "",
    locationLabel: "",
    phone: "",
    email: "",
    address: "",
    organizationId: "",
    branchId: "",
    serviceId: "",
  });
  const [editForm, setEditForm] = useState({
    mrn: "",
    firstName: "",
    lastName: "",
    birthDate: "",
    sex: "female",
    status: "active",
    riskLevel: "low",
    primaryPackId: "clinical",
    diagnosisSummary: "",
    locationLabel: "",
    nextFollowUpAt: "",
    phone: "",
    email: "",
    address: "",
    organizationId: "",
    branchId: "",
    serviceId: "",
  });

  useEffect(() => {
    if (organizations.length === 0) {
      return;
    }

    setForm((current) => ({
      ...current,
      organizationId: current.organizationId || organizations[0]?.id || "",
      branchId: current.branchId || branches[0]?.id || "",
      serviceId: current.serviceId || services[0]?.id || "",
    }));
  }, [branches, organizations, services]);

  const filtered = useMemo(
    () =>
      patients.filter((patient) => {
        if (activePack !== "all" && !(patient.activePacks ?? []).includes(activePack)) {
          return false;
        }

        if (query && !`${patient.fullName ?? ""} ${patient.mrn ?? ""}`.toLowerCase().includes(query.toLowerCase())) {
          return false;
        }

        return true;
      }),
    [activePack, patients, query],
  );

  async function handleCreatePatient() {
    setFormError(null);

    if (!activeTenantId) {
      setFormError("Selecciona un tenant activo antes de crear pacientes.");
      return;
    }

    if (!canCreatePatient) {
      setFormError("Tu rol no permite crear pacientes en este tenant.");
      return;
    }

    if (!form.organizationId) {
      setFormError("Selecciona una organización institucional.");
      return;
    }

    if (!form.mrn.trim() || !form.firstName.trim() || !form.lastName.trim()) {
      setFormError("MRN, nombre y apellido son obligatorios.");
      return;
    }

    if (form.birthDate && new Date(form.birthDate) > new Date()) {
      setFormError("La fecha de nacimiento no puede estar en el futuro.");
      return;
    }

    try {
      await createPatient.mutateAsync({
        tenantId: activeTenantId,
        organizationId: form.organizationId,
        branchId: form.branchId || null,
        serviceId: form.serviceId || null,
        mrn: form.mrn.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        birthDate: form.birthDate || null,
        sex: form.sex as "female" | "male" | "other",
        primaryPackId: form.primaryPackId,
        activePackIds: [form.primaryPackId],
        diagnosisSummary: form.diagnosisSummary.trim() || null,
        locationLabel: form.locationLabel.trim() || null,
        nextFollowUpAt: null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        contactsTouched: true,
      });

      setForm((current) => ({
        ...current,
        mrn: "",
        firstName: "",
        lastName: "",
        birthDate: "",
        diagnosisSummary: "",
        locationLabel: "",
        phone: "",
        email: "",
        address: "",
      }));
      setShowCreate(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo crear el paciente.");
    }
  }

  function startEditPatient(patient: (typeof patients)[number]) {
    const [firstName = "", ...lastParts] = (patient.fullName || "").split(" ").filter(Boolean);
    setEditError(null);
    setEditingPatientId(patient.id);
    setEditForm({
      mrn: patient.mrn ?? "",
      firstName,
      lastName: lastParts.join(" "),
      birthDate: patient.birthDate ?? "",
      sex: patient.sex ?? "female",
      status: patient.status ?? "active",
      riskLevel: patient.risk ?? "low",
      primaryPackId: patient.primaryPack ?? "clinical",
      diagnosisSummary: patient.diagnosisSummary ?? "",
      locationLabel: patient.location ?? "",
      nextFollowUpAt: patient.nextFollowUpAt ? patient.nextFollowUpAt.slice(0, 10) : "",
      phone: patient.phone ?? "",
      email: patient.email ?? "",
      address: patient.address ?? "",
      organizationId: patient.organizationId ?? organizations[0]?.id ?? "",
      branchId: patient.branchId ?? branches[0]?.id ?? "",
      serviceId: patient.serviceId ?? services[0]?.id ?? "",
    });
  }

  async function handleUpdatePatient() {
    setEditError(null);

    if (!activeTenantId || !editingPatientId) {
      setEditError("Selecciona un tenant y un paciente antes de guardar cambios.");
      return;
    }

    if (!canUpdatePatient) {
      setEditError("Tu rol no permite editar pacientes en este tenant.");
      return;
    }

    if (!editForm.organizationId) {
      setEditError("Selecciona una organización institucional.");
      return;
    }

    if (!editForm.mrn.trim() || !editForm.firstName.trim() || !editForm.lastName.trim()) {
      setEditError("MRN, nombre y apellido son obligatorios.");
      return;
    }

    if (editForm.birthDate && new Date(editForm.birthDate) > new Date()) {
      setEditError("La fecha de nacimiento no puede estar en el futuro.");
      return;
    }

    try {
      await updatePatient.mutateAsync({
        tenantId: activeTenantId,
        patientId: editingPatientId,
        organizationId: editForm.organizationId,
        branchId: editForm.branchId || null,
        serviceId: editForm.serviceId || null,
        mrn: editForm.mrn.trim(),
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        birthDate: editForm.birthDate || null,
        sex: editForm.sex as "female" | "male" | "other",
        status: editForm.status,
        riskLevel: editForm.riskLevel,
        primaryPackId: editForm.primaryPackId,
        activePackIds: [editForm.primaryPackId],
        diagnosisSummary: editForm.diagnosisSummary.trim() || null,
        locationLabel: editForm.locationLabel.trim() || null,
        nextFollowUpAt: editForm.nextFollowUpAt ? new Date(`${editForm.nextFollowUpAt}T12:00:00`).toISOString() : null,
        phone: editForm.phone.trim() || null,
        email: editForm.email.trim() || null,
        address: editForm.address.trim() || null,
        contactsTouched: true,
      });

      setEditingPatientId(null);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "No se pudo actualizar el paciente.");
    }
  }

  return (
    <div>
      <PageHeader
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <span>{`Personas - ${activeTenant?.slug ?? "tenant"}`}</span>
            <SourceStateBadge source={viewSource} />
          </div>
        }
        title="Pacientes"
        subtitle={`${formatInteger(filtered.length)} de ${formatInteger(patients.length)} pacientes ${
          activePack !== "all" ? "en el pack activo" : "del tenant activo"
        }`}
        actions={
          <>
            <Button variant="outline" size="sm" className="h-8 text-[12px]">
              <Filter className="mr-1.5 h-3.5 w-3.5" />
              Filtros
            </Button>
            <Button
              size="sm"
              className="h-8 border-0 text-[12px] text-primary-foreground gradient-primary"
              onClick={() => (canCreatePatient ? setShowCreate(true) : setFormError("Tu rol no permite crear pacientes en este tenant."))}
              disabled={!canCreatePatient}
              title={!canCreatePatient ? "Sin permiso para crear pacientes" : undefined}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Nuevo paciente
            </Button>
          </>
        }
      />

      <div className="space-y-4 p-6">
        {viewSource === "fallback" && (
          <div className="panel px-4 py-3 text-[12px] text-muted-foreground">
            La vista conserva la experiencia completa mientras se completan estructura institucional o pacientes reales del tenant.
          </div>
        )}

        <div className="flex gap-2">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre o MRN..."
              className="h-9 border-border bg-surface-raised/40 pl-9 text-[13px]"
            />
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full tabular text-[13px]">
              <thead>
                <tr className="border-b border-border bg-surface-raised/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  <th className="w-8 px-4 py-2.5 text-left font-normal">Pri.</th>
                  <th className="px-4 py-2.5 text-left font-normal">
                    Paciente <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />
                  </th>
                  <th className="px-4 py-2.5 text-left font-normal">Historia</th>
                  <th className="px-4 py-2.5 text-left font-normal">Edad</th>
                  <th className="px-4 py-2.5 text-left font-normal">Sexo</th>
                  <th className="px-4 py-2.5 text-left font-normal">Pack</th>
                  <th className="px-4 py-2.5 text-left font-normal">Servicio</th>
                  <th className="px-4 py-2.5 text-left font-normal">Diagnóstico</th>
                  <th className="px-4 py-2.5 text-left font-normal">Ubicación</th>
                  <th className="px-4 py-2.5 text-left font-normal">Riesgo</th>
                  <th className="px-4 py-2.5 text-left font-normal">Próx. seg.</th>
                  <th className="px-4 py-2.5 text-right font-normal">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && (
                  <tr>
                    <td colSpan={12} className="px-5 py-12 text-center text-[13px] text-muted-foreground">
                      Cargando pacientes del tenant activo...
                    </td>
                  </tr>
                )}

                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-5 py-12 text-center text-[13px] text-muted-foreground">
                      No hay pacientes visibles para el tenant activo.
                    </td>
                  </tr>
                )}

                {filtered.map((patient) => (
                  <tr key={patient.id} className="group transition-colors hover:bg-surface-raised/40">
                    <td className="px-4 py-3">
                      <RiskDot level={patient.risk} />
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/app/patients/${patient.id}`} className="font-medium transition-colors hover:text-primary">
                        {patient.fullName || "Paciente sin nombre"}
                      </Link>
                      <div className="mt-0.5 text-[10px] font-mono uppercase text-muted-foreground">
                        {patientStatusLabel(patient.status)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{patient.mrn}</td>
                    <td className="px-4 py-3 text-[11px] font-mono">
                      {patient.ageLabel}
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono">
                      {patient.sex === "male" ? "M" : patient.sex === "female" ? "F" : "X"}
                    </td>
                    <td className="px-4 py-3">
                      <PackPill pack={patient.primaryPack} />
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-[12px] text-muted-foreground">
                      {patient.serviceId ? serviceById.get(patient.serviceId) ?? "Sin servicio" : "Sin servicio"}
                    </td>
                    <td className="max-w-[300px] px-4 py-3 text-[12px] text-muted-foreground" title={patient.diagnosisSummary ?? undefined}>
                      <span className="block max-w-[300px] truncate">{patient.diagnosisSummary || "Sin diagnóstico registrado"}</span>
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{patient.location || "No registrado"}</td>
                    <td className="px-4 py-3">
                      <RiskBadge level={patient.risk} />
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">
                      {formatDate(patient.nextFollowUpAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => startEditPatient(patient)}
                          disabled={!canUpdatePatient}
                          title={!canUpdatePatient ? "Sin permiso para editar pacientes" : undefined}
                        >
                          <Edit2 className="mr-1 h-3 w-3" />
                          Editar
                        </Button>
                        <Button asChild variant="outline" size="sm" className="h-7 px-2 text-[11px]">
                          <Link to={`/app/patients/${patient.id}`}>Ver ficha</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent side="right" className="w-[720px] overflow-y-auto sm:max-w-[720px]">
          <SheetHeader>
            <SheetTitle>Nuevo paciente</SheetTitle>
            <SheetDescription>
              Alta clínica en el tenant activo. El registro se guarda sin salir de la tabla.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="MRN">
                <Input value={form.mrn} onChange={(event) => setForm({ ...form, mrn: event.target.value })} />
              </Field>
              <Field label="Pack primario">
                <Select value={form.primaryPackId} onValueChange={(value) => setForm({ ...form, primaryPackId: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {enabledPackOptions.map((packId) => (
                      <SelectItem key={packId} value={packId}>
                        {PACKS[packId]?.name ?? packId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Nombre">
                <Input value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
              </Field>
              <Field label="Apellido">
                <Input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
              </Field>
              <Field label="Fecha de nacimiento">
                <Input type="date" value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} />
              </Field>
              <Field label="Sexo biológico">
                <Select value={form.sex} onValueChange={(value) => setForm({ ...form, sex: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Femenino</SelectItem>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Ubicación">
                <Input value={form.locationLabel} onChange={(event) => setForm({ ...form, locationLabel: event.target.value })} />
              </Field>
              <Field label="Teléfono">
                <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </Field>
              <Field label="Correo">
                <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </Field>
              <Field label="Dirección">
                <Input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
              </Field>
              <Field label="Diagnóstico base">
                <Input
                  value={form.diagnosisSummary}
                  onChange={(event) => setForm({ ...form, diagnosisSummary: event.target.value })}
                />
              </Field>
              <Field label="Organización">
                <Select value={form.organizationId} onValueChange={(value) => setForm({ ...form, organizationId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona organización" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((organization) => (
                      <SelectItem key={organization.id} value={organization.id}>
                        {organization.name ?? "Organización sin nombre"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Sede">
                <Select value={form.branchId} onValueChange={(value) => setForm({ ...form, branchId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona sede" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name ?? "Sede sin nombre"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Servicio">
                <Select value={form.serviceId} onValueChange={(value) => setForm({ ...form, serviceId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name ?? "Servicio sin nombre"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {(formError || createPatient.isError) && (
              <div className="rounded-md border border-risk-high/30 bg-risk-high/10 px-3 py-2 text-[12px] text-risk-high">
                  {formError ?? (createPatient.error instanceof Error ? createPatient.error.message : "No se pudo crear el paciente.")}
              </div>
            )}
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleCreatePatient()} disabled={createPatient.isPending || !activeTenantId || !canCreatePatient}>
              {createPatient.isPending ? "Guardando..." : "Guardar paciente"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(editingPatientId)} onOpenChange={(open) => !open && setEditingPatientId(null)}>
        <SheetContent side="right" className="w-[720px] overflow-y-auto sm:max-w-[720px]">
          <SheetHeader>
            <SheetTitle>Editar paciente</SheetTitle>
            <SheetDescription>
              Actualiza datos clínicos básicos. Los cambios quedan auditados en Supabase.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="MRN">
                <Input value={editForm.mrn} onChange={(event) => setEditForm({ ...editForm, mrn: event.target.value })} />
              </Field>
              <Field label="Pack primario">
                <Select value={editForm.primaryPackId} onValueChange={(value) => setEditForm({ ...editForm, primaryPackId: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {enabledPackOptions.map((packId) => (
                      <SelectItem key={packId} value={packId}>
                        {PACKS[packId]?.name ?? packId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Nombre">
                <Input value={editForm.firstName} onChange={(event) => setEditForm({ ...editForm, firstName: event.target.value })} />
              </Field>
              <Field label="Apellido">
                <Input value={editForm.lastName} onChange={(event) => setEditForm({ ...editForm, lastName: event.target.value })} />
              </Field>
              <Field label="Fecha de nacimiento">
                <Input type="date" value={editForm.birthDate} onChange={(event) => setEditForm({ ...editForm, birthDate: event.target.value })} />
              </Field>
              <Field label="Sexo biológico">
                <Select value={editForm.sex} onValueChange={(value) => setEditForm({ ...editForm, sex: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Femenino</SelectItem>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Estado">
                <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="monitoring">En seguimiento</SelectItem>
                    <SelectItem value="stable">Estable</SelectItem>
                    <SelectItem value="discharged">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Riesgo">
                <Select value={editForm.riskLevel} onValueChange={(value) => setEditForm({ ...editForm, riskLevel: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Bajo</SelectItem>
                    <SelectItem value="moderate">Moderado</SelectItem>
                    <SelectItem value="high">Alto</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Próximo seguimiento">
                <Input
                  value={editForm.nextFollowUpAt}
                  placeholder="AAAA-MM-DD"
                  onChange={(event) => setEditForm({ ...editForm, nextFollowUpAt: event.target.value })}
                />
              </Field>
              <Field label="Ubicación">
                <Input value={editForm.locationLabel} onChange={(event) => setEditForm({ ...editForm, locationLabel: event.target.value })} />
              </Field>
              <Field label="Teléfono">
                <Input value={editForm.phone} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} />
              </Field>
              <Field label="Correo">
                <Input type="email" value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} />
              </Field>
              <Field label="Dirección">
                <Input value={editForm.address} onChange={(event) => setEditForm({ ...editForm, address: event.target.value })} />
              </Field>
              <Field label="Diagnóstico base">
                <Input
                  value={editForm.diagnosisSummary}
                  onChange={(event) => setEditForm({ ...editForm, diagnosisSummary: event.target.value })}
                />
              </Field>
              <Field label="Organización">
                <Select value={editForm.organizationId} onValueChange={(value) => setEditForm({ ...editForm, organizationId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona organización" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((organization) => (
                      <SelectItem key={organization.id} value={organization.id}>
                        {organization.name ?? "Organización sin nombre"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Sede">
                <Select value={editForm.branchId} onValueChange={(value) => setEditForm({ ...editForm, branchId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona sede" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name ?? "Sede sin nombre"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Servicio">
                <Select value={editForm.serviceId} onValueChange={(value) => setEditForm({ ...editForm, serviceId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name ?? "Servicio sin nombre"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {(editError || updatePatient.isError) && (
              <div className="rounded-md border border-risk-high/30 bg-risk-high/10 px-3 py-2 text-[12px] text-risk-high">
                  {editError ?? (updatePatient.error instanceof Error ? updatePatient.error.message : "No se pudo actualizar el paciente.")}
              </div>
            )}
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditingPatientId(null)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleUpdatePatient()} disabled={updatePatient.isPending || !activeTenantId || !canUpdatePatient}>
              {updatePatient.isPending ? "Guardando..." : "Guardar cambios"}
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


