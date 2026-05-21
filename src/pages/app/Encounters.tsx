import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Edit2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
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
import { useCreateEncounter, useTenantEncounters, useTenantPatients, useTenantTeam, useUpdateEncounter } from "@/hooks/useClinicalData";
import { useTenantRuntime } from "@/hooks/useTenantRuntime";
import { resolveViewSource } from "@/lib/view-source";

function encounterTypeLabel(value: string) {
  const labels: Record<string, string> = {
    admission: "Internación",
    outpatient: "Consulta externa",
    sports_season: "Temporada deportiva",
    teleconsult: "Teleconsulta",
    follow_up: "Seguimiento",
  };

  return labels[value] ?? value;
}

function encounterStatusLabel(value: string) {
  const labels: Record<string, string> = {
    open: "Abierto",
    closed: "Cerrado",
    on_hold: "En pausa",
  };

  return labels[value] ?? value;
}

export default function Encounters() {
  const { isAuthenticated } = useAuth();
  const { activeTenant, activeTenantId } = useTenantRuntime();
  const { data: encounterResult, isLoading: encountersLoading } = useTenantEncounters();
  const { data: patientResult, isLoading: patientsLoading } = useTenantPatients();
  const { data: teamResult } = useTenantTeam();
  const createEncounter = useCreateEncounter();
  const updateEncounter = useUpdateEncounter();
  const [showCreate, setShowCreate] = useState(false);
  const [editingEncounterId, setEditingEncounterId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [title, setTitle] = useState("Seguimiento nutricional longitudinal");
  const [type, setType] = useState("follow_up");
  const patients = useMemo(() => patientResult?.data ?? [], [patientResult?.data]);
  const team = useMemo(() => teamResult?.data ?? [], [teamResult?.data]);
  const encounters = useMemo(() => encounterResult?.data ?? [], [encounterResult?.data]);
  const viewSource = resolveViewSource({
    isAuthenticated,
    sources: [encounterResult?.source, patientResult?.source, teamResult?.source],
  });
  const [patientId, setPatientId] = useState("");
  const [ownerUserId, setOwnerUserId] = useState("");
  const [editForm, setEditForm] = useState({
    patientId: "",
    ownerUserId: "",
    type: "follow_up",
    title: "",
    status: "open",
    openedAt: "",
    notes: "",
  });

  useEffect(() => {
    if (!patientId && patients[0]?.id) {
      setPatientId(patients[0].id);
    }
    if (!ownerUserId && team[0]?.id) {
      setOwnerUserId(team[0].id);
    }
  }, [ownerUserId, patientId, patients, team]);

  async function handleCreateEncounter() {
    setFormError(null);

    if (!activeTenantId) {
      setFormError("Selecciona un tenant activo antes de crear episodios.");
      return;
    }

    if (!patientId) {
      setFormError("Selecciona un paciente para abrir el episodio.");
      return;
    }

    if (!title.trim()) {
      setFormError("El título del episodio es obligatorio.");
      return;
    }

    try {
      await createEncounter.mutateAsync({
        tenantId: activeTenantId,
        patientId,
        title: title.trim(),
        type,
        ownerUserId: ownerUserId || null,
      });

      setShowCreate(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo crear el episodio.");
    }
  }

  function startEditEncounter(encounter: (typeof encounters)[number]) {
    setEditError(null);
    setEditingEncounterId(encounter.id);
    setEditForm({
      patientId: encounter.patientId,
      ownerUserId: encounter.ownerId || "",
      type: encounter.type,
      title: encounter.title,
      status: encounter.status,
      openedAt: encounter.openedAt,
      notes: encounter.notes ?? "",
    });
  }

  async function handleUpdateEncounter(statusOverride: string) {
    setEditError(null);

    if (!activeTenantId || !editingEncounterId) {
      setEditError("Selecciona un tenant y un episodio antes de guardar cambios.");
      return;
    }

    if (!editForm.patientId) {
      setEditError("Selecciona el paciente asociado.");
      return;
    }

    if (!editForm.title.trim()) {
      setEditError("El motivo o título del episodio es obligatorio.");
      return;
    }

    if (!editForm.openedAt) {
      setEditError("La fecha de apertura es obligatoria.");
      return;
    }

    try {
      await updateEncounter.mutateAsync({
        tenantId: activeTenantId,
        encounterId: editingEncounterId,
        patientId: editForm.patientId,
        type: editForm.type,
        title: editForm.title.trim(),
        status: statusOverride ?? editForm.status,
        openedAt: new Date(`${editForm.openedAt}T12:00:00`).toISOString(),
        notes: editForm.notes.trim() || null,
        ownerUserId: editForm.ownerUserId || null,
      });
      setEditingEncounterId(null);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "No se pudo actualizar el episodio.");
    }
  }

  return (
    <div>
      <PageHeader
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <span>{`Flujo clínico - ${activeTenant?.slug ?? "tenant"}`}</span>
            <SourceStateBadge source={viewSource} />
          </div>
        }
        title="Episodios, casos y consultas"
        subtitle="Internación, consulta externa, temporada deportiva, teleconsulta y seguimiento longitudinal."
        actions={
          <Button
            size="sm"
            className="h-8 border-0 text-primary-foreground gradient-primary"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nuevo episodio
          </Button>
        }
      />

      <div className="space-y-4 p-6">
        {viewSource === "fallback" && (
          <div className="panel px-4 py-3 text-[12px] text-muted-foreground">
            La vista conserva el flujo operativo mientras se completan pacientes, responsables o episodios reales del tenant.
          </div>
        )}

        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full tabular text-[13px]">
              <thead>
                <tr className="border-b border-border bg-surface-raised/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 text-left font-normal">Episodio</th>
                  <th className="px-4 py-2.5 text-left font-normal">Paciente</th>
                  <th className="px-4 py-2.5 text-left font-normal">Historia</th>
                  <th className="px-4 py-2.5 text-left font-normal">Tipo</th>
                  <th className="px-4 py-2.5 text-left font-normal">Responsable</th>
                  <th className="px-4 py-2.5 text-left font-normal">Estado</th>
                  <th className="px-4 py-2.5 text-left font-normal">Apertura</th>
                  <th className="px-4 py-2.5 text-right font-normal">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(encountersLoading || patientsLoading) && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-[13px] text-muted-foreground">
                      Cargando episodios y pacientes del tenant activo...
                    </td>
                  </tr>
                )}

                {!encountersLoading && encounters.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <ClipboardCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                      <div className="text-[14px] font-medium">Sin episodios abiertos para este tenant</div>
                      <div className="mt-1 text-[12px] text-muted-foreground">
                        Crea un episodio para comenzar el flujo clínico.
                      </div>
                    </td>
                  </tr>
                )}

                {encounters.map((encounter) => {
                  const patient = patients.find((item) => item.id === encounter.patientId);
                  const owner = team.find((member) => member.id === encounter.ownerId);

                  return (
                    <tr key={encounter.id} className="transition-colors hover:bg-surface-raised/40">
                      <td className="max-w-[280px] px-4 py-3">
                        <div className="font-medium">{encounter.title}</div>
                        <div className="mt-0.5 text-[10px] font-mono uppercase text-muted-foreground">{encounter.id.slice(0, 8)}</div>
                      </td>
                      <td className="px-4 py-3">
                        {patient ? (
                          <Link to={`/app/patients/${patient.id}`} className="font-medium transition-colors hover:text-primary">
                            {patient.fullName}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">Paciente no disponible</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{patient?.mrn ?? "--"}</td>
                      <td className="px-4 py-3 text-[12px] text-muted-foreground">{encounterTypeLabel(encounter.type)}</td>
                      <td className="px-4 py-3 text-[12px]">{owner?.name ?? "Equipo clínico"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-mono uppercase text-primary">
                          {encounterStatusLabel(encounter.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{encounter.openedAt}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="h-7 px-2 text-[11px]" onClick={() => startEditEncounter(encounter)}>
                            <Edit2 className="mr-1 h-3 w-3" />
                            Editar
                          </Button>
                          <Button asChild variant="outline" size="sm" className="h-7 px-2 text-[11px]">
                            <Link to={patient ? `/app/patients/${patient.id}` : "/app/patients"}>Ver caso</Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {patients.length > 0 && (
          <div className="text-[11px] text-muted-foreground">
            Pacientes disponibles{" "}
            {patients.slice(0, 4).map((patient) => (
              <Link key={patient.id} to={`/app/patients/${patient.id}`} className="mr-3 underline underline-offset-2">
                {patient.fullName}
              </Link>
            ))}
          </div>
        )}
      </div>

      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent side="right" className="w-[640px] overflow-y-auto sm:max-w-[640px]">
          <SheetHeader>
            <SheetTitle>Nuevo episodio</SheetTitle>
            <SheetDescription>
              Crea el episodio sin salir del flujo. La lista se actualiza en cuanto se guarda.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 grid gap-4">
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
                  <SelectItem value="follow_up">Seguimiento</SelectItem>
                  <SelectItem value="admission">Internación</SelectItem>
                  <SelectItem value="outpatient">Consulta externa</SelectItem>
                  <SelectItem value="teleconsult">Teleconsulta</SelectItem>
                  <SelectItem value="sports_season">Temporada deportiva</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Título">
              <Select value={title} onValueChange={setTitle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Seguimiento nutricional longitudinal">Seguimiento nutricional longitudinal</SelectItem>
                  <SelectItem value="Admisión con screening inicial">Admisión con screening inicial</SelectItem>
                  <SelectItem value="Control de composición corporal">Control de composición corporal</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Responsable">
              <Select value={ownerUserId} onValueChange={setOwnerUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona responsable" />
                </SelectTrigger>
                <SelectContent>
                  {team.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {(formError || createEncounter.isError) && (
              <div className="rounded-md border border-risk-high/30 bg-risk-high/10 px-3 py-2 text-[12px] text-risk-high">
                {formError ?? (createEncounter.error instanceof Error ? createEncounter.error.message : "No se pudo crear el episodio.")}
              </div>
            )}
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleCreateEncounter()} disabled={createEncounter.isPending || !activeTenantId}>
              {createEncounter.isPending ? "Guardando..." : "Guardar episodio"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(editingEncounterId)} onOpenChange={(open) => !open && setEditingEncounterId(null)}>
        <SheetContent side="right" className="w-[640px] overflow-y-auto sm:max-w-[640px]">
          <SheetHeader>
            <SheetTitle>Editar episodio</SheetTitle>
            <SheetDescription>
              Actualiza motivo, tipo, estado, fecha y notas. El cierre queda auditado.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 grid gap-4">
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
                  <SelectItem value="follow_up">Seguimiento</SelectItem>
                  <SelectItem value="admission">Internación</SelectItem>
                  <SelectItem value="outpatient">Consulta externa</SelectItem>
                  <SelectItem value="teleconsult">Teleconsulta</SelectItem>
                  <SelectItem value="sports_season">Temporada deportiva</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Motivo o título">
              <Input value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} />
            </Field>
            <Field label="Estado">
              <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Abierto</SelectItem>
                  <SelectItem value="on_hold">En pausa</SelectItem>
                  <SelectItem value="closed">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Fecha de apertura">
              <Input
                value={editForm.openedAt}
                placeholder="AAAA-MM-DD"
                onChange={(event) => setEditForm({ ...editForm, openedAt: event.target.value })}
              />
            </Field>
            <Field label="Responsable">
              <Select value={editForm.ownerUserId} onValueChange={(value) => setEditForm({ ...editForm, ownerUserId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona responsable" />
                </SelectTrigger>
                <SelectContent>
                  {team.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Notas">
              <Input value={editForm.notes} onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })} />
            </Field>

            {(editError || updateEncounter.isError) && (
              <div className="rounded-md border border-risk-high/30 bg-risk-high/10 px-3 py-2 text-[12px] text-risk-high">
                {editError ?? (updateEncounter.error instanceof Error ? updateEncounter.error.message : "No se pudo actualizar el episodio.")}
              </div>
            )}
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditingEncounterId(null)}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={() => void handleUpdateEncounter("closed")} disabled={updateEncounter.isPending || !activeTenantId}>
              Cerrar episodio
            </Button>
            <Button onClick={() => void handleUpdateEncounter()} disabled={updateEncounter.isPending || !activeTenantId}>
              {updateEncounter.isPending ? "Guardando..." : "Guardar cambios"}
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
