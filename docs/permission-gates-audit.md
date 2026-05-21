# Auditoria local de permission gates

Generado: 2026-05-20T12:06:27.636Z

- Artifact: `artifacts/security/permission-gates-2026-05-20T12-06-27-633Z.json`
- Alcance: heuristica estatica sobre UI. Un hallazgo no implica fuga; indica revision manual.
- Estado: 0 criticos, 0 para revision.
- Accion Macrofase 29: el auditor tambien clasifica acciones protegidas, limitadas, proximamente y dependientes de backend/RLS.

| Categoria | Total | Requiere revision |
|---|---:|---:|
| Protegida por UI | 7 | 0 |
| Limitada/Proximamente | 4 | 0 |

## Acciones para revision

| Ubicacion | Severidad | Categoria | Motivo | Accion detectada | Recomendacion |
|---|---|---|---|---|---|
| -- | -- | -- | -- | Sin hallazgos criticos | -- |

## Muestra de acciones clasificadas como controladas

| Ubicacion | Categoria | Severidad | Accion |
|---|---|---|---|
| `src/pages/app/Dashboard.tsx:126` | Protegida por UI | medium | `<Link to="/app/reports">Generar informe</Link>` |
| `src/pages/app/Foods.tsx:250` | Limitada/Proximamente | medium | `<Button type="submit" disabled={createMutation.isPending}>Guardar alimento</Button>` |
| `src/pages/app/Messages.tsx:631` | Limitada/Proximamente | medium | `<Button type="submit" disabled={createThreadMutation.isPending}>Crear hilo</Button>` |
| `src/pages/app/pack-modules/EnteralCockpit.tsx:453` | Protegida por UI | medium | `<Button variant="outline" size="sm" onClick={() => setStatusAction({ plan, status: "paused" })} disabled={!canClose \|\| updateStatus.isPending} data-testid="enteral-pause-button">` |
| `src/pages/app/pack-modules/EnteralCockpit.tsx:459` | Protegida por UI | medium | `<Button variant="outline" size="sm" onClick={() => setStatusAction({ plan, status: "closed" })} disabled={!canClose \|\| updateStatus.isPending} data-testid="enteral-close-button">` |
| `src/pages/app/pack-modules/ParenteralBase.tsx:356` | Protegida por UI | medium | `<Button variant="outline" size="sm" onClick={() => setClosingPlan(plan)} disabled={!canClose \|\| closePlan.isPending} data-testid="parenteral-close-button">` |
| `src/pages/app/Recipes.tsx:333` | Limitada/Proximamente | medium | `<Button type="submit" disabled={createMutation.isPending \|\| updateMutation.isPending}>Guardar receta</Button>` |
| `src/pages/app/UsersRoles.tsx:313` | Protegida por UI | critical | `{upsertMembership.isPending ? "Guardando..." : "Asignar o actualizar membership"}` |
| `src/pages/app/WeeklyMenu.tsx:376` | Protegida por UI | medium | `<Button variant="outline" size="sm" className="h-8" onClick={() => setStatusAction({ menu: selected, status: "closed" })} disabled={!canClose \|\| selected.status === "closed"}>Cerra` |
| `src/pages/app/WeeklyMenu.tsx:495` | Limitada/Proximamente | medium | `<Button type="submit" disabled={createMenuMutation.isPending \|\| updateMenuMutation.isPending}>Guardar menú</Button>` |
| `src/components/layout/AppTopbar.tsx:262` | Protegida por UI | medium | `<Link to="/onboarding">Crear nuevo tenant</Link>` |
