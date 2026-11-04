# Flujo SDD del proyecto

## Secuencia obligatoria

Constitución → inventario del contrato → spec → clarificación → plan → tareas →
implementación (una tarea, tests primero) → validación RF por RF → despliegue.

## Estados de una spec

- **Draft:** puede contener dudas abiertas; no autoriza implementación.
- **Ready:** sin ambigüedades bloqueantes, plan y tareas aprobados.
- **In progress:** se implementa una sola tarea por vez.
- **Validated:** todos los RF tienen pruebas verdes y evidencia de validación.
- **Released:** desplegada con observación y rollback definidos.

## Clasificación de compatibilidad

- **Compatible:** el frontend no necesita cambios.
- **Coordinada:** backend y frontend deben soportar el cambio en una ventana
  común.
- **Transitoria:** durante un plazo definido se aceptan contratos viejo y nuevo.
- **Ruptura versionada:** se introduce una nueva versión y se anuncia la fecha de
  retirada de la anterior.

## Regla de cambio

Cuando aparece un requisito nuevo, primero se actualiza `spec.md`, se revisan sus
casos límite y efectos sobre el contrato, y después se actualizan plan y tareas.
No se modifica directamente la implementación.

## Validación final

La validación enumera cada RF, la prueba que lo cubre, su resultado y cualquier
evidencia manual necesaria. Una spec no queda validada si existe un RF sin prueba
o una excepción de seguridad sin resolver.

