# Auditoria local de secretos

Fecha: 2026-05-15

Este guardrail busca nombres y patrones sensibles sin imprimir valores. La auditoria no modifica credenciales, no lee valores para reportarlos y no toca `.env.local`.

## Patrones revisados

| Patron | Clasificacion esperada |
|---|---|
| SUPABASE_ACCESS_TOKEN | Variable requerida, nunca valor versionado |
| SUPABASE_DB_PASSWORD | Variable requerida, nunca valor versionado |
| SUPABASE_SERVICE_ROLE / service_role | Permitido solo en Edge Function server-side o docs |
| postgresql:// | Permitido en docs solo con variable de entorno, no password literal |
| E2E_PASSWORD / QA_PASSWORD | Variable requerida, nunca valor versionado |
| A907 / eyJ | Fragmentos de alto riesgo; se revisan sin imprimir valores |
| storageState / playwright/.auth | Debe estar ignorado y no versionado |

## Resultado local

| Area | Resultado | Nota |
|---|---|---|
| Frontend `src/` | 0 riesgos | No se detecto service role ni credenciales en frontend ejecutable. |
| Repo/artifacts | 0 riesgos repo | `storageState` y `playwright/.auth` quedan cubiertos por `.gitignore`; artifacts generados no imprimen valores. |
| Edge Function | Permitido | `SUPABASE_SERVICE_ROLE_KEY` solo aparece en `supabase/functions/admin-invite-user`. |
| Docs/scripts | Permitido | Mencionan variables y comandos con placeholders o variables de entorno. |
| `.env.local` | No modificado | No se imprime ni se versiona. |

Artifact reciente: `artifacts/security/secrets-local-*.json`

## Criterio

El guardrail falla si aparece un secreto en frontend o un archivo de sesion/versionado riesgoso. Las referencias documentales a variables requeridas no se consideran secretos si no contienen valores.
