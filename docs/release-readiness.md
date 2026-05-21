# Nutri - Release Readiness Piloto

Fecha: 2026-05-11

## Estado general

Nutri queda preparado para piloto funcional controlado, no para produccion abierta. La fuente de verdad autenticada es Supabase, no hay service role en frontend y las rutas principales fueron endurecidas para no caer en ErrorBoundary por `undefined.data` durante carga normal.

## Modulos cerrados funcionalmente

- Nucleo clinico editable: pacientes, episodios, evaluaciones basicas, planes y PatientDetail.
- Labs: funcional y protegido, sin rehacer en fases posteriores.
- Alertas: acciones reales, persistencia, auditoria y contador.
- Agenda: appointments reales, persistencia y audit logs.
- Mensajes: hilos y mensajes reales, lectura, cierre y auditoria.
- Nutricion operativa: alimentos, recetas y menu semanal reales.
- Reportes: `report_runs` reales, vista previa, generacion y auditoria `report.generated`.
- Usuarios, roles y memberships: listar, upsert, activar/desactivar, asignar rol y auditar.
- Enteral: backend, RLS, render estable y flujo UI aceptado previamente; E2E automatizado queda pendiente por credenciales.
- Parenteral: funcional basico controlado, no parenteral avanzado.
- Deportivo: funcional con somatocarta condicionada a datos antropometricos suficientes; reporte deportivo real agregado.

## Modulos parciales o condicionados

- Pediatria: funcional con referencia incompleta controlada. Falta cargar referencias oficiales WHO/OMS completas en `growth_reference_points`.
- Exportaciones: PDF/XLSX reales mejoradas, pero `report.exported` no esta cerrado hasta verlo en `/app/audit`.
- QA Seguridad P0 multi-tenant: bloqueado por falta de usuarios QA Auth confirmados y credenciales.
- Edge Function de invitacion: implementada localmente, despliegue remoto bloqueado por `SUPABASE_ACCESS_TOKEN`.

## Bloqueos antes de produccion

- Desplegar Edge Function `admin-invite-user`.
- Crear usuarios QA Auth confirmados.
- Ejecutar QA Seguridad P0 tenant-cross con usuarios no-superadmin.
- Ejecutar E2E Enteral automatizado con `E2E_EMAIL` y `E2E_PASSWORD`.
- Confirmar `report.exported` visible en `/app/audit`.
- Cargar referencias WHO/OMS oficiales si se quiere declarar Pediatria avanzada completa.

## Evidencia tecnica reciente

- RLS anon verificado para tablas enterales/parenterales: REST devuelve `200 []`.
- `/app/pack/parenteral` renderiza flujo basico controlado con datos reales.
- `/app/pack/pediatric/curves` muestra referencia incompleta sin calcular z-score falso.
- `/app/reports?type=sports_performance` genera reporte deportivo real.
- Smoke visual de rutas principales: sin ErrorBoundary ni `undefined.data` en carga normal.

## Validacion tecnica final de este bloque

- `npm run build`: pasa.
- `npm run lint`: pasa.
- `npm test -- --run`: pasa.
