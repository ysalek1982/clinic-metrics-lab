# Notas para usuario final del piloto local

Estas notas son para revisar Nutri como piloto local controlado. No sustituyen validacion de produccion, QA multi-tenant ni revision clinica profesional.

## Que puede probar

- Entrar al sistema con una cuenta autorizada.
- Revisar Dashboard, pacientes y expediente.
- Abrir Labs, Alertas, Agenda, Mensajes, Reportes, Alimentos, Recetas y Menu semanal.
- Revisar Pediatria en modo de referencia incompleta.
- Revisar Enteral y Parenteral basico controlado.
- Revisar Deportivo/Somatocarta cuando existan datos suficientes.
- Abrir Usuarios/Roles para memberships existentes.
- Abrir Auditoria para eventos reales disponibles.
- Abrir Copilot clinico como centro contextual de prioridades, tareas, timeline y enlaces internos.

## Que no debe probar como cierre productivo todavia

- QA Seguridad P0 multi-tenant final.
- E2E Enteral autenticado final.
- Creacion/invitacion Auth por Edge Function remota.
- Cierre de `report.exported` en `/app/audit`.
- Pediatria avanzada WHO/OMS con z-score/percentil real.

Estos puntos requieren credenciales, usuarios Auth QA, evidencia autenticada o CSV oficiales.

## Modulos listos localmente

- Shell Nutri, Dashboard y navegacion principal.
- Pacientes y expediente con estados visibles.
- Labs, Alertas, Agenda y Mensajes.
- Nutricion operativa: Alimentos, Recetas y Menu semanal.
- Reportes con generacion local y exportaciones iniciales.
- Enteral y Parenteral basico controlado.
- Deportivo/Somatocarta condicionado a datos suficientes.
- Usuarios/Roles para memberships existentes.
- Copilot contextual sin IA generativa.

## Modulos condicionados o bloqueados

- Pediatria: muestra referencia incompleta si faltan CSV oficiales WHO/OMS. No debe esperarse z-score real sin esas referencias.
- QA Seguridad P0: requiere usuarios reales de prueba.
- E2E Enteral: requiere `E2E_EMAIL` y `E2E_PASSWORD`.
- Edge Function `admin-invite-user`: requiere `SUPABASE_ACCESS_TOKEN` para despliegue.
- `report.exported`: requiere validar evento visible en `/app/audit` con sesion autenticada.

## Advertencia sobre Copilot

Copilot no es IA medica.

- No diagnostica.
- No prescribe.
- No recomienda dosis.
- No emite pronosticos.
- No llama servicios externos ni OpenAI.
- Solo resume datos registrados y aplica reglas locales conservadoras.

Cualquier decision clinica debe revisarla un profesional en el modulo correspondiente.

## Como reportar observaciones

Registrar cada observacion con:

| Campo | Que anotar |
|---|---|
| Ruta | Ejemplo: `/app/copilot`, `/app/patients`, `/app/reports` |
| Usuario/rol | Rol visible y tenant activo |
| Que esperaba | Resultado esperado |
| Que ocurrio | Resultado observado |
| Captura | Screenshot si aplica |
| Severidad | Bloqueante, alta, media o baja |

No incluir passwords, tokens, storage state ni datos sensibles innecesarios en el reporte.
