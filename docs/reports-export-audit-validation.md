# Reports export audit validation

Fecha: 2026-05-22

Estado: cerrado con evidencia autenticada en Vercel usando usuario QA Clinic/Hospital. No se usaron datos clinicos reales; el tenant y paciente de prueba son sinteticos QA.

| Paso | Estado | Evidencia | Pendiente |
|---|---|---|---|
| Entrar a `/app/reports` | Cerrado | `npm run e2e:report-export` con `playwright/.auth/qa-clinic.json`. | No versionar storage state. |
| Generar reporte | Cerrado | `reportRunId`: `bc6fe006-6214-42a4-8365-079cab31e8de`; audit `report.generated`: `d28dcf11-4759-4de4-8799-359580890a1b`. | Ninguno. |
| Exportar PDF | Cerrado | Artifact local `artifacts/e2e/reports-export/report-export-1779479702791.pdf`, 5284 bytes. | No versionar artifact salvo decision explicita. |
| Exportar Excel | Cerrado | Artifact local `artifacts/e2e/reports-export/report-export-1779479704288.xlsx`, 11293 bytes. | No versionar artifact salvo decision explicita. |
| Ver audit log `report.exported` | Cerrado | Audit IDs `38cc6e35-6e96-471f-b611-05964349a3de` y `35badfec-4c1a-4991-be5b-099b5d504b63`; screenshot `artifacts/e2e/reports-export/02-report-exported-audit.png`. | Ninguno. |

Resultado del artifact:

```json
{
  "status": "passed",
  "baseUrl": "https://clinic-metrics-lab.vercel.app",
  "reportRunId": "bc6fe006-6214-42a4-8365-079cab31e8de",
  "exports": ["pdf", "xlsx"],
  "audit": ["report.generated", "report.exported"]
}
```

Nota RLS: con QA Pro se pudo generar reporte, pero no leer auditoria institucional. La validacion de auditoria se ejecuto con QA Clinic/Hospital, que es el plan correcto para auditoria institucional.
# Macrofase 51 - Reports Export Revalidation

Fecha local: 2026-05-23.

Reporte revalidado en produccion con usuario QA Clinic.

| Evento | Estado | Evidencia |
|---|---|---|
| `report.generated` | Presente | `artifacts/e2e/reports-export/result.json` |
| `report.exported` PDF | Presente | PDF generado, 5284 bytes |
| `report.exported` XLSX | Presente | XLSX generado, 11293 bytes |

Ultimo `report_run_id` validado: `0fecebfc-aa0a-44b7-9fdd-749956c66714`.
