# Auditoría de paridad visual con prototipo

Generado: 2026-05-23T15:04:50.564Z

- Prototipo: https://preview--clinic-metrics-lab.lovable.app/app
- Nutri local: http://127.0.0.1:4316/app
- Artifact JSON: `artifacts/visual-parity/prototype-parity-2026-05-23T15-04-50-561Z.json`
- Error de setup: ninguno

Esta auditoría usa el prototipo como referencia visual/interactiva. No copia datos demo ni reemplaza fuentes Supabase reales.

| Pantalla | Prototipo observado | Nutri actual | Brecha visual/UX | Acción recomendada | Estado |
|---|---|---|---|---|---|
| Dashboard | Panel ejecutivo institucional | Acceso seguro para equipos de nutrición premium. | Afinar jerarquia de KPIs y densidad segun screenshots autenticados. | Mantener cards premium y datos reales. | Media-alta |
| Pacientes | Pacientes | Acceso seguro para equipos de nutrición premium. | Validar densidad en sesion autenticada. | Smoke autenticado pendiente. | Media |
| Antropometría | Sesión antropométrica | Acceso seguro para equipos de nutrición premium. | Comparar paneles laterales con sesion. | No mover calculos a React. | Media |
| Labs | Centro de laboratorios | Acceso seguro para equipos de nutrición premium. | Micro-ajustes visuales menores. | Mantener interpretacion real. | Alta |
| Reportes | Centro de reportes | Acceso seguro para equipos de nutrición premium. | `report.exported` sigue sin evidencia autenticada. | No cerrar Fase 18A. | Media |
| Nutrición operativa | Biblioteca/constructor/matriz | Foods/recipes/weekly-menu funcionales | Validar paridad visual autenticada. | Mantener calculos en dominio. | Alta |
| Pediatría | Curvas de crecimiento | Acceso seguro para equipos de nutrición premium. | Faltan CSV WHO/OMS. | No inventar z-score/percentil. | Bloqueada |
| Enteral/Parenteral | No siempre visible en prototipo publico | Cockpit/base controlada reales | E2E autenticado pendiente. | No marcar parenteral avanzado. | Media |
| Usuarios/Auditoría | No prioritario en prototipo visual | Admin real y audit trail | Depende de credenciales para QA. | Mantener service role fuera de frontend. | Media |

## Criterios visuales revisados

- Sidebar y topbar oscuros, densos y editoriales.
- Cards con borde fino, jerarquía compacta y acento cian.
- Tablas clínicas densas pero legibles.
- Empty/error/forbidden honestos.
- Botones no implementados deshabilitados o marcados como Próximamente.
- Sin datos demo autenticados.
