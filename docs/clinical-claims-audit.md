# Auditoria local de claims clinicos

Fecha: 2026-05-15

Este guardrail revisa `src`, `docs` y `scripts` para detectar promesas clinicas no permitidas. No llama servicios externos y no valida decisiones medicas; solo evita que el producto prometa capacidades que no tiene.

## Patrones revisados

| Patron | Riesgo buscado | Estado |
|---|---|---|
| diagnostico probable | Diagnostico generado o sugerido por UI/reglas | Sin riesgo activo |
| recomiendo dosis | Recomendacion de dosis | Sin riesgo activo |
| debe administrarse | Instruccion de administracion | Sin riesgo activo |
| tratamiento indicado | Tratamiento prescriptivo | Sin riesgo activo |
| pronostico | Pronostico clinico | Sin riesgo activo |
| prescribir / prescripcion | Prescripcion farmacologica o ambigua | Sin riesgo activo; prescripcion nutricional se clasifica como no farmacologica |
| medicacion | Medicacion sugerida | Sin riesgo activo |
| cura / curar | Promesa de curacion | Sin riesgo activo |
| IA generativa activa | Promesa de IA generativa disponible | Sin riesgo activo |
| diagnostico automatico | Diagnostico automatico | Sin riesgo activo |

## Resultado local

| Area | Resultado | Nota |
|---|---|---|
| UI `src/` | 0 riesgos | Los disclaimers de Copilot se clasifican como permitidos por contexto negativo. |
| Reglas Copilot | 0 riesgos | Las reglas locales resumen datos registrados; no diagnostican ni prescriben. |
| Tests | Permitido | Las menciones existen como aserciones negativas. |
| Docs | Permitido | Las menciones documentan lo prohibido o bloqueado. |
| Scripts | Permitido | Las menciones pertenecen al guardrail. |

Artifact reciente: `artifacts/security/clinical-claims-*.json`

## Criterio

El guardrail falla solo si detecta claims clinicos riesgosos en UI o reglas. Las menciones documentales de restricciones se mantienen permitidas para no ocultar el criterio de seguridad.
