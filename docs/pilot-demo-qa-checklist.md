# Checklist QA para demo de piloto

## Recorrido

- [ ] Login con usuario autorizado.
- [ ] Ver dashboard sin DEMO autenticado.
- [ ] Abrir pacientes.
- [ ] Abrir PatientDetail.
- [ ] Revisar labs.
- [ ] Revisar agenda.
- [ ] Revisar alertas.
- [ ] Revisar reportes.
- [ ] Revisar alimentos, recetas y menu semanal.
- [ ] Revisar pediatria y confirmar referencia incompleta si faltan WHO/OMS.
- [ ] Revisar enteral.
- [ ] Revisar parenteral basico.
- [ ] Revisar deportivo/somatocarta.
- [ ] Revisar usuarios/roles.
- [ ] Revisar auditoria.

## Observaciones esperadas

- Pediatria no calcula z-score sin referencias oficiales.
- QA Seguridad P0 requiere usuarios Auth reales.
- E2E Enteral requiere credenciales E2E.
- Edge Function requiere `SUPABASE_ACCESS_TOKEN`.
- `report.exported` requiere evidencia autenticada en `/app/audit`.

## Captura de hallazgos

| Pantalla | Resultado | Evidencia | Observacion |
|---|---|---|---|
| Dashboard | | | |
| Pacientes | | | |
| PatientDetail | | | |
| Labs | | | |
| Reportes | | | |
| Enteral | | | |
| Parenteral | | | |
| Deportivo | | | |
| Usuarios | | | |
| Auditoria | | | |
