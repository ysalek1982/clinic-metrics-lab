# AGENTS.md - Reglas del proyecto Nutri

## Identidad del producto
El producto se llama Nutri. No renombrar la marca visible.

## Stack actual
Trabajar sobre el stack existente. No proponer migración de framework salvo instrucción explícita.

## Regla de datos
Con sesión autenticada, Supabase es la única fuente de verdad.
No usar src/data/demo.ts, src/data/saas.ts ni src/data/clinical.ts como backing de vistas autenticadas.
El modo demo solo puede existir sin sesión y debe estar claramente marcado como DEMO.

## Autenticación
No crear bypasses locales.
No simular superadministradores en memoria.
Todo usuario real debe existir en Supabase Auth y en las tablas públicas correspondientes.

## Multi-tenant
Toda entidad clínica debe tener tenant_id.
Todo acceso clínico debe resolverse desde memberships reales.
Toda tabla clínica debe tener RLS.
La publishable key anónima no debe exponer datos clínicos privados.

## Permisos
No ocultar errores de permisos.
Las pantallas sin permiso deben mostrar estado forbidden.
Usar helpers centralizados de autorización.

## Módulos especializados
No usar PackView como sustituto de módulos clínicos complejos.
Pediatric Curves, Enteral, Parenteral, Gineco y Deportivo deben tener pantallas propias cuando tengan lógica especializada.

## Lógica clínica
No poner cálculos clínicos dentro de componentes React.
La lógica clínica debe vivir en domain/services.
No inventar curvas, fórmulas ni clasificaciones.
Si una referencia está incompleta, mostrar "Referencia incompleta" y no calcular resultados falsos.

## Español
Toda UI visible debe estar en español.
No dejar badges, estados, tooltips ni errores en inglés.
No dejar texto con codificación rota.

## Definition of Done
Una pantalla solo puede declararse funcional si tiene:
- read path real
- write path real si corresponde
- validación
- permisos
- RLS
- estados loading/empty/error/forbidden
- persistencia comprobada
- pruebas
- build exitoso
- lint sin errores
