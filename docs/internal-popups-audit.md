# Auditoria de popups internos

Generado: 2026-05-20T12:06:26.886Z

- Estado: passed
- Artifact: `artifacts/ui-audit/internal-popups-2026-05-20T12-06-26-886Z.json`
- Resumen: 193 acciones; 0 alto(s), 0 medio(s), 193 bajo(s).
- Regla: altas, ediciones y acciones sensibles deben usar Dialog, Drawer, Sheet o vista interna; no `window.open`, `alert`, `confirm` ni `prompt`.

| Ruta | Accion | Estado actual | Riesgo | Accion recomendada |
|---|---|---|---|---|
| `/app/patients` | setFormError("Selecciona un tenant activo antes de crear pacientes."); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/patients` | setFormError("Tu rol no permite crear pacientes en este tenant."); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/patients` | setFormError(error instanceof Error ? error.message : "No se pudo crear el paciente."); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/patients` | setEditError("Tu rol no permite editar pacientes en este tenant."); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/patients` | setEditError(error instanceof Error ? error.message : "No se pudo actualizar el paciente."); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/patients` | onClick={() => (canCreatePatient ? setShowCreate(true) : setFormError("Tu rol no permite crear pacientes en este tenant."))} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/patients` | title={!canCreatePatient ? "Sin permiso para crear pacientes" : undefined} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/patients` | Nuevo paciente | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/patients` | title={!canUpdatePatient ? "Sin permiso para editar pacientes" : undefined} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/patients` | Editar | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/patients` | <SheetTitle>Nuevo paciente</SheetTitle> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/patients` | {formError ?? (createPatient.error instanceof Error ? createPatient.error.message : "No se pudo crear el paciente.")} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/patients` | Cancelar | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/patients` | <SheetTitle>Editar paciente</SheetTitle> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/patients` | {editError ?? (updatePatient.error instanceof Error ? updatePatient.error.message : "No se pudo actualizar el paciente.")} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/patients` | Cancelar | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/plans` | setFormError("Selecciona un tenant activo antes de crear planes."); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/plans` | setFormError("Tu rol no permite crear planes nutricionales en este tenant."); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/plans` | setFormError(error instanceof Error ? error.message : "No se pudo crear el plan."); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/plans` | setEditError(error instanceof Error ? error.message : "No se pudo actualizar el plan."); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/plans` | onClick={() => (canCreatePlan ? setShowCreate(true) : setFormError("Tu rol no permite crear planes nutricionales en este tenant."))} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/plans` | title={!canCreatePlan ? "Sin permiso para crear planes" : undefined} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/plans` | Nuevo plan | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/plans` | Editar plan | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/plans` | <SheetTitle>Nuevo plan nutricional</SheetTitle> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/plans` | {formError ?? (createPlan.error instanceof Error ? createPlan.error.message : "No se pudo crear el plan.")} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/plans` | Cancelar | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/plans` | <SheetTitle>Editar plan nutricional</SheetTitle> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/plans` | {editError ?? (updatePlan.error instanceof Error ? updatePlan.error.message : "No se pudo actualizar el plan.")} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/plans` | Cancelar | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/agenda` | { value: "control_labs", label: "Control de laboratorios" }, | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/agenda` | setStatusActionError(error instanceof Error ? error.message : "No se pudo actualizar la cita."); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/agenda` | subtitle="Seguimientos, teleconsulta, reevaluaciones y controles programados." | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/agenda` | <DialogTitle>{editingAppointment ? "Editar cita" : "Nueva cita"}</DialogTitle> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/agenda` | <option value="">Sin asignar</option> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/agenda` | <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/agenda` | title={statusAction?.status === "completed" ? "Completar cita" : "Cancelar cita"} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/agenda` | submitLabel={statusAction?.status === "completed" ? "Completar" : "Cancelar cita"} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/agenda` | Esta accion se registrara en la agenda del tenant y mantendra al usuario en la misma pantalla. | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/agenda` | Editar | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/agenda` | Completar | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/agenda` | Cancelar | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/agenda` | <PageHeader meta="Operación clínica" title={title} subtitle="Seguimientos, teleconsulta, reevaluaciones y controles programados." /> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/alerts` | Revisar | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/alerts` | Silenciar | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/alerts` | Atender | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/alerts` | Resolver | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/alerts` | <SheetTitle>Atender alerta</SheetTitle> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/alerts` | description="Ir al resumen longitudinal del caso y revisar timeline, laboratorios, screening, antropometría y planes." | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/alerts` | title="Registrar atención" | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/alerts` | description="La acción Atender persiste estado, usuario y auditoría antes de navegar al expediente." | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/alerts` | title="Resolver evento" | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/alerts` | description="Usa Resolver cuando el evento clínico ya fue gestionado por el equipo." | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/alerts` | Revisar | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/alerts` | Atender caso | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/reports` | createReportPreviewExcelArtifact, | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/reports` | createReportPreviewPdfArtifact, | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/reports` | downloadExportArtifact, | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/reports` | } from "@/lib/exportArtifacts"; | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/reports` | setOperationError(error instanceof Error ? error.message : "No se pudo generar el reporte."); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/reports` | setOperationError(error instanceof Error ? error.message : "No se pudo imprimir el reporte."); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/reports` | async function handleExport(preview: ReportPreview, format: "pdf" \| "xlsx") { | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/reports` | format === "pdf" | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/reports` | ? createReportPreviewPdfArtifact(preview) | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/reports` | : await createReportPreviewExcelArtifact(preview); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/reports` | downloadExportArtifact(artifact); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/reports` | setOperationError(error instanceof Error ? error.message : "No se pudo exportar el reporte."); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/reports` | PDF desde vista previa | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/reports` | Excel desde vista previa | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/reports` | <StatePanel title="Sin datos de reportes" message="No hay datos reales suficientes para generar reportes en este tenant." /> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/reports` | onClick={() => void handleExport(activePreview, "pdf")} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/reports` | PDF | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/reports` | Excel | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/reports` | description="Vista interna preparada sin abrir ventanas externas. Para archivo descargable usa PDF o Excel desde la vista previa." | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/reports` | footer={<AsyncActionFooter cancelLabel="Cerrar" onCancel={() => setPrintPreviewDialog(null)} />} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/reports` | {isGenerating ? "Generando..." : "Generar"} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/recipes` | title={foods.length === 0 ? "Carga alimentos reales antes de crear recetas." : !canCreate ? "Sin permiso para crear recetas." : undefined} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/recipes` | <DialogTitle>{editingRecipe ? "Editar receta" : "Nueva receta"}</DialogTitle> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/recipes` | <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/recipes` | Editar | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/weekly-menu` | import { exportWeeklyMenuToExcel } from "@/lib/exportArtifacts"; | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/weekly-menu` | setStatusActionError(error instanceof Error ? error.message : "No se pudo actualizar el estado del menu."); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/weekly-menu` | const handleExportMenuExcel = async () => { | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/weekly-menu` | await exportWeeklyMenuToExcel(selected); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/weekly-menu` | title: "No se pudo exportar", | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/weekly-menu` | Imprimir | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/weekly-menu` | <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => void handleExportMenuExcel()} disabled={!selected \|\| exportAudit.isPending}> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/weekly-menu` | Excel | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/weekly-menu` | Nuevo menú | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/weekly-menu` | <Button variant="outline" size="sm" className="h-8" onClick={() => openEditMenu(selected)} disabled={!canUpdate}>Editar metas</Button> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/weekly-menu` | <Button variant="outline" size="sm" className="h-8" onClick={() => setStatusAction({ menu: selected, status: "closed" })} disabled={!canClose \|\| selected.status | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/weekly-menu` | <DialogTitle>{editingMenu ? "Editar menú semanal" : "Nuevo menú semanal"}</DialogTitle> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/weekly-menu` | <Button type="button" variant="outline" onClick={() => setMenuDialogOpen(false)}>Cancelar</Button> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/weekly-menu` | title={statusAction?.status === "closed" ? "Cerrar menu semanal" : "Activar menu semanal"} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/weekly-menu` | submitLabel={statusAction?.status === "closed" ? "Cerrar menu" : "Activar menu"} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/weekly-menu` | description="Vista interna preparada sin abrir ventanas externas. Usa Excel para descargar un archivo." | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/weekly-menu` | footer={<AsyncActionFooter cancelLabel="Cerrar" onCancel={() => setPrintMenu(null)} />} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/weekly-menu` | <Button type="button" variant="outline" onClick={() => setItemDialogOpen(false)}>Cancelar</Button> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/enteral/cockpit` | import { exportEnteralPlanToPdf } from "@/lib/exportArtifacts"; | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/enteral/cockpit` | toast({ title: "Soporte enteral guardado", description: "El plan y el primer control quedaron persistidos." }); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/enteral/cockpit` | toast({ title: "Sin permisos", description: "Tu rol no puede registrar controles enterales." }); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/enteral/cockpit` | toast({ title: "Control diario guardado", description: "La tolerancia enteral quedó registrada en Supabase." }); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/enteral/cockpit` | setStatusActionError(error instanceof Error ? error.message : "No se pudo actualizar el estado enteral."); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/enteral/cockpit` | exportEnteralPlanToPdf(plan, patientName); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/enteral/cockpit` | await exportAudit.mutateAsync({ tenantId: activeTenantId, planId: plan.id, format: "pdf" }); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/enteral/cockpit` | title: "No se pudo exportar", | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/enteral/cockpit` | Nuevo soporte | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/enteral/cockpit` | Editar | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/enteral/cockpit` | <Button variant="outline" size="sm" onClick={() => setSelectedPlan(plan)} disabled={!canLog \|\| plan.status === "closed"} data-testid="enteral-control-button"> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/enteral/cockpit` | Control | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/enteral/cockpit` | <Button variant="outline" size="sm" onClick={() => void handleExportPlan(plan)} disabled={!canExport \|\| exportAudit.isPending} data-testid="enteral-export-pdf-b | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/enteral/cockpit` | PDF | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/enteral/cockpit` | Pausar | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/enteral/cockpit` | Cerrar | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/enteral/cockpit` | <SheetTitle>{editingPlan ? "Editar soporte enteral" : "Nuevo soporte enteral"}</SheetTitle> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/enteral/cockpit` | <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/enteral/cockpit` | <SheetTitle>Control diario enteral</SheetTitle> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/enteral/cockpit` | <Button variant="outline" onClick={() => setSelectedPlan(null)}>Cancelar</Button> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/enteral/cockpit` | {createDailyLog.isPending ? "Guardando..." : "Guardar control"} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/enteral/cockpit` | title={statusAction?.status === "closed" ? "Cerrar soporte enteral" : "Pausar soporte enteral"} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/enteral/cockpit` | submitLabel={statusAction?.status === "closed" ? "Cerrar plan" : "Pausar plan"} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/parenteral` | toast({ title: "Paciente requerido", description: "Selecciona un paciente real para crear el plan." }); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/parenteral` | toast({ title: "Plan parenteral creado", description: "Base funcional controlada registrada en Supabase." }); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/parenteral` | toast({ title: "Sin permisos", description: "Tu rol no puede registrar monitoreo parenteral." }); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/parenteral` | setCloseError(error instanceof Error ? error.message : "No se pudo cerrar el plan parenteral."); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/parenteral` | { label: "Planes parenterales", value: parenteralPlans.length, hint: "base funcional controlada" }, | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/parenteral` | { label: "Activos o borrador", value: activePlans.length, hint: "sin cerrar" }, | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/parenteral` | <h3 className="mt-1 text-[16px] font-medium">Base funcional controlada, no parenteral avanzado</h3> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/parenteral` | Nuevo plan | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/parenteral` | Editar | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/parenteral` | Cerrar | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/parenteral` | <SheetTitle>{editingPlan ? "Editar plan parenteral" : "Nuevo plan parenteral"}</SheetTitle> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/parenteral` | <Button variant="outline" onClick={() => setShowPlan(false)}>Cancelar</Button> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/parenteral` | <Button variant="outline" onClick={() => setSelectedPlan(null)}>Cancelar</Button> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/parenteral` | title="Cerrar plan parenteral" | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pack/parenteral` | submitLabel="Cerrar plan" | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/users` | Invitar usuario | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/users` | <h3 className="mt-1 text-[15px] font-medium">Invitar usuario Auth</h3> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/users` | Usa service role solo del lado servidor y valida users.manage/memberships.manage antes de invitar. | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/users` | {adminInviteUser.isPending ? "Invitando..." : "Invitar usuario Auth"} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/users` | <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/users` | {adminInviteUser.error instanceof Error ? adminInviteUser.error.message : "No se pudo invitar el usuario Auth."} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/users` | <h3 className="text-[15px] font-medium">Asignar usuario a organizacion</h3> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/users` | {upsertMembership.isPending ? "Guardando..." : "Asignar o actualizar membership"} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/users` | {adminInviteUser.isPending ? "Invitando..." : "Invitar Auth seguro"} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/users` | {upsertMembership.error instanceof Error ? upsertMembership.error.message : "No se pudo actualizar el membership."} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/users` | {adminInviteUser.error instanceof Error ? adminInviteUser.error.message : "No se pudo invitar el usuario Auth."} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/users` | Actualizar rol | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/users` | {memberships.length > 0 ? "Membership visible" : "Crear en Supabase Auth si no existe"} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/users` | La creacion de usuarios Auth usa la Edge Function segura admin-invite-user si esta desplegada. Si no responde, se debe crear el usuario en Supabase Dashboard y  | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/copilot` | sin acciones sensibles visibles en codigo | sin_acciones | bajo | Sin cambio requerido. |
| `/app/foods` | setFormError(error instanceof Error ? error.message : "No se pudo crear el alimento."); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/foods` | <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/messages` | setFormError(error instanceof Error ? error.message : "No se pudo crear el hilo."); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/messages` | Nuevo hilo | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/messages` | Crea o selecciona un hilo clínico real para revisar la conversación. | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/messages` | Cerrar hilo | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/messages` | <Field label="Asignar a"> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/messages` | <option value="">Sin asignar</option> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/messages` | Asignar hilo | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/messages` | <DialogTitle>Nuevo hilo clínico</DialogTitle> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/messages` | <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/messages` | <Button type="submit" disabled={createThreadMutation.isPending}>Crear hilo</Button> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/screening` | title={!canCreateScreening ? "Sin permiso para crear screenings" : undefined} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/screening` | Nuevo screening | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/screening` | <SheetTitle>Nuevo screening</SheetTitle> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/screening` | Cancelar | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/encounters` | setFormError("Selecciona un tenant activo antes de crear episodios."); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/encounters` | setFormError(error instanceof Error ? error.message : "No se pudo crear el episodio."); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/encounters` | setEditError(error instanceof Error ? error.message : "No se pudo actualizar el episodio."); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/encounters` | Nuevo episodio | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/encounters` | Editar | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/encounters` | <SheetTitle>Nuevo episodio</SheetTitle> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/encounters` | <SelectItem value="Control de composición corporal">Control de composición corporal</SelectItem> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/encounters` | {formError ?? (createEncounter.error instanceof Error ? createEncounter.error.message : "No se pudo crear el episodio.")} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/encounters` | Cancelar | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/encounters` | <SheetTitle>Editar episodio</SheetTitle> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/encounters` | {editError ?? (updateEncounter.error instanceof Error ? updateEncounter.error.message : "No se pudo actualizar el episodio.")} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/encounters` | Cancelar | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/encounters` | Cerrar episodio | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pediatric-curves` | setValidationError("Usa longitud o talla, no ambas en el mismo control."); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pediatric-curves` | description: "El control pediátrico quedó persistido con resultados y auditoría.", | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pediatric-curves` | subtitle="Seguimiento antropométrico pediátrico con referencias reales o referencia incompleta controlada." | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pediatric-curves` | Imprimir Próximamente | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pediatric-curves` | title="La exportación PDF se habilitará cuando existan referencias oficiales completas." | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pediatric-curves` | PDF Próximamente | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pediatric-curves` | {selectedResult?.interpretation ?? "Selecciona un paciente con controles registrados para evaluar el indicador."} | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pediatric-curves` | No hay controles registrados para este indicador. | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pediatric-curves` | <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Controles registrados</div> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pediatric-curves` | <h3 className="mt-1 text-[16px] font-medium">{records.length} controles</h3> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/pediatric-curves` | Cancelar | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/somatocarta` | toast({ title: "Sin permisos", description: "Tu rol no puede registrar datos deportivos." }); | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
| `/app/somatocarta` | <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button> | popup_interno | bajo | Mantener flujo interno con loading/error visible y evitar doble submit. |
