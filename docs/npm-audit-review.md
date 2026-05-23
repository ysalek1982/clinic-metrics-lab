# NPM Audit Review - Post RC

Fecha: 2026-05-21

Se ejecuto `npm audit fix` normal, sin `--force`. La auditoria bajo de 21 vulnerabilidades a 6 vulnerabilidades. No se aplicaron cambios que requieran major upgrade forzado.

| Paquete | Severidad | Tipo | Impacto | Accion recomendada | Se puede corregir ahora |
|---|---|---|---|---|---|
| `xlsx` | High | Runtime dependency | Afecta la libreria usada para generar archivos Excel. El riesgo principal documentado por npm aplica a parsing/inputs no confiables; Nutri la usa para exportacion controlada, pero sigue siendo deuda real. | Planificar reemplazo o mitigacion de exportaciones XLSX; no aceptar archivos XLSX externos con esta libreria; mantener exportaciones autorizadas y auditar flujo. | No. `npm audit` reporta `fixAvailable: false`. |
| `vite` / `esbuild` | Moderate | Build/dev tooling | Riesgo ligado a dev server y manejo de assets optimizados. Produccion Vercel sirve build estatico, pero el entorno local/dev queda con deuda. | Evaluar upgrade mayor de Vite en rama separada con QA visual y smoke completo. No usar `npm audit fix --force` en esta tanda. | No sin upgrade mayor forzado a Vite 8. |
| `jsdom` | Low | Dev/test dependency | Riesgo en entorno de tests por dependencia transitiva `http-proxy-agent` / `@tootallnate/once`. No afecta runtime frontend en produccion. | Evaluar upgrade mayor de `jsdom` en rama separada; correr tests de UI/helpers. | No sin upgrade mayor forzado a `jsdom` 29. |
| `http-proxy-agent` | Low | Dev/test transitive | Transitiva de `jsdom`. | Resolver junto con upgrade de `jsdom`. | No sin upgrade mayor. |
| `@tootallnate/once` | Low | Dev/test transitive | Transitiva de `http-proxy-agent`. | Resolver junto con upgrade de `jsdom`. | No sin upgrade mayor. |

## Accion tomada

- Se aplico `npm audit fix` normal.
- Se actualizo `package-lock.json`.
- No se ejecuto `npm audit fix --force`.
- No se hicieron cambios de major version deliberados.
- Build posterior paso con Vite actualizado dentro del rango compatible.

## Pendiente antes de piloto productivo

- Definir estrategia para `xlsx`: reemplazar libreria, aislar exportacion o aceptar riesgo documentado temporalmente.
- Evaluar upgrade mayor de Vite fuera de esta tanda.
- Evaluar upgrade mayor de jsdom fuera de esta tanda.

