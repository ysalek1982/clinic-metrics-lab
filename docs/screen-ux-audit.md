# Auditoria UX pantalla por pantalla

Fecha: 2026-05-11

| Ruta | Estado visual | Estado funcional | Problemas UX | Botones riesgosos | Accion tomada | Pendiente |
|---|---|---|---|---|---|---|
| `/app` | Media-alta | Dashboard local estable | Requiere densidad real autenticada | Ninguno en auditor local | Smoke y parity docs | Smoke autenticado |
| `/app/patients` | Media-alta | Tabla y detalle reales | Ajustes finos de filtros | Ninguno en auditor local | Estados visibles mantenidos | QA tenant-cross |
| `/app/anthropometry` | Media | Estacion real sin `undefined.data` | Paneles pueden compactarse mas | Ninguno en auditor local | Estado estable documentado | Datos reales amplios |
| `/app/screening` | Media | Screening funcional | Revisar helper text en formularios | Ninguno en auditor local | Audit forms | QA autenticado |
| `/app/plans` | Media | Planes reales | Validaciones clinicas avanzadas fuera de alcance | Ninguno en auditor local | Documentado | QA permisos |
| `/app/agenda` | Alta | Agenda real | Ninguno critico local | Ninguno en auditor local | Documentado | QA permisos |
| `/app/messages` | Alta | Mensajes reales | Ninguno critico local | Ninguno en auditor local | Documentado | QA permisos |
| `/app/alerts` | Alta | Alertas reales | Ninguno critico local | Ninguno en auditor local | Documentado | QA permisos |
| `/app/reports` | Media | Reportes reales | `report.exported` no confirmado en audit | Export requiere evidencia autenticada | Bloqueo preservado | Fase 18A |
| `/app/labs` | Alta | Labs reales | Micro spacing | Ninguno en auditor local | Documentado | QA multi-tenant |
| `/app/foods` | Alta | Biblioteca real | Catalogo depende de tenant | Ninguno en auditor local | Documentado | Datos operativos |
| `/app/recipes` | Alta | Constructor real | Mejoras finas de edicion | Ninguno en auditor local | Documentado | QA permisos |
| `/app/weekly-menu` | Alta | Matriz real | Export audit pendiente | Ninguno en auditor local | Documentado | Evidencia auth |
| `/app/pediatric-curves` | Media | Referencia incompleta controlada | WHO faltante | PDF avanzado deshabilitado | Documentado | CSV WHO/OMS |
| `/app/pack/enteral/cockpit` | Media-alta | Enteral real | E2E reproducible pendiente | Ninguno en auditor local | Documentado | Credenciales E2E |
| `/app/pack/parenteral` | Media | Basico controlado | No avanzado | Ninguno en auditor local | Documentado | No inventar calculos |
| `/app/somatocarta` | Media-alta | Deportivo condicionado | Datos insuficientes honestos | Ninguno en auditor local | Documentado | Datos antropometricos |
| `/app/users` | Media-alta | Memberships reales | Invitar Auth depende Edge Function deploy | Invitar muestra bloqueo | Documentado | SUPABASE_ACCESS_TOKEN |
| `/app/audit` | Media | Eventos reales | Export de auditoria pendiente | Export audit deshabilitado | Documentado | report.exported |
| `/app/settings` | Media | Estado controlado | Acciones futuras deben seguir Proximamente | Ninguno en auditor local | Documentado | Backend especifico |
| `/app/organization` | Media | Estado controlado | Crear sede/acciones futuras deben estar guardadas | Ninguno en auditor local | Documentado | Backend especifico |
