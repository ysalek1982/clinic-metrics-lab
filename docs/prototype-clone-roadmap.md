# Roadmap de paridad visual con Nutrition OS

Fecha: 2026-05-11

Referencia visual: https://preview--clinic-metrics-lab.lovable.app/app

Este documento usa el prototipo como referencia visual e interactiva. Nutri no copia datos demo ni reemplaza Supabase como fuente de verdad autenticada.

## Criterios

- Mantener marca Nutri.
- Mantener datos reales, RLS, permisos, persistencia y auditoria.
- No mostrar demo con sesion autenticada.
- No inventar formulas, curvas, z-score, somatotipos ni reportes.
- Deshabilitar o marcar como Proximamente toda accion que no tenga backend real.

| Pantalla | Paridad visual | Funcionalidad real | Pendiente para igualar prototipo |
|---|---|---|---|
| Dashboard | Media-alta | KPIs y estados reales/fallback controlado | Validacion visual autenticada con datos reales densos |
| Pacientes | Media-alta | Tabla clinica, busqueda, detalle y RLS | Afinar densidad y microestados tras smoke autenticado |
| PatientDetail | Media | Expediente central con tabs e integraciones | Pulir timeline y jerarquia visual por volumen de datos |
| Antropometria | Media | Render estable, estados seguros, sin calculo falso | Mejorar composicion de tres paneles con datos reales |
| Labs | Alta | Ordenes/resultados reales, interpretacion y tendencia | Ajustes menores de spacing y seleccion visual |
| Reportes | Media | Preview, generar `report_run`, export inicial | Confirmar `report.exported` en audit autenticado |
| Alimentos | Alta | Supabase real y ficha nutricional | Ampliar catalogo real si el tenant lo requiere |
| Recetas | Alta | Constructor real, ingredientes y macros | Micro UX de edicion mas densa |
| Menu semanal | Alta | Matriz real, persistencia y calculos | Export/audit completo pendiente de evidencia |
| Pediatria | Bloqueada | Funcional con referencia incompleta controlada | CSV oficiales WHO/OMS para curvas, z-score y percentil |
| Enteral | Media-alta | Cockpit real, planes, logs, tolerancia y alertas | E2E automatizado requiere credenciales |
| Parenteral | Media | Basico controlado, no avanzado | No implementar calculo avanzado sin reglas validadas |
| Deportivo/Somatocarta | Media-alta | Perfil, evaluaciones, reporte real, datos insuficientes honestos | Completar somatocarta solo con datos antropometricos suficientes |
| Usuarios/Roles | Media | Memberships, roles, permisos, audit | Deploy Edge Function para invitar Auth |
| Auditoria | Media | Eventos reales visibles | Confirmar eventos de export autenticados |
| Settings/Organizacion | Media | Estados y acciones controladas | Conectar acciones futuras o mantener Proximamente |

## Que ya se parece al prototipo

- Shell oscuro tipo Clinical Command Center.
- Sidebar y topbar densos, con jerarquia de producto.
- Cards KPI con borde fino, acento cian y tratamiento premium.
- Tablas densas y estados vacios visibles.
- Modulos de nutricion operativa, reportes, enteral, deportivo y usuarios integrados al mismo lenguaje visual.

## Que no se debe copiar

- Datos demo del prototipo.
- Pantallas decorativas sin backend.
- Curvas pediatricas, somatotipos, formulas o alertas sin datos suficientes.
- Botones de PDF/Excel o crear usuarios si no hay accion real desplegada.

## Bloqueos para cerrar paridad completa

- Credenciales E2E para smoke autenticado y flujo enteral.
- Usuarios Auth QA para seguridad P0.
- `SUPABASE_ACCESS_TOKEN` para desplegar `admin-invite-user`.
- CSV oficiales WHO/OMS para pediatria avanzada.
- Evidencia autenticada de `report.exported` en `/app/audit`.
