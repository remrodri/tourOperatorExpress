# Prompts de trabajo SDD

## Clarificación

> Revisa la spec activa como QA y especialista en seguridad. Detecta
> ambigüedades, contradicciones, casos límite ausentes y conflictos con la
> constitución o el contrato actual. No escribas código ni resuelvas las dudas.

## Plan

> Lee AGENTS.md, constitución, contrato actual y spec activa. Sin escribir código,
> actualiza plan.md con módulos, decisiones justificadas, compatibilidad,
> migración, rollback y estrategia de pruebas. Indica los RF cubiertos.

## Tareas

> Divide el plan en tareas pequeñas ordenadas por dependencia. Cada tarea debe
> indicar RF y una condición Hecho cuando verificable. Separa cambios de backend,
> frontend, datos y despliegue cuando requieran coordinación.

## Implementación

> Implementa solamente la tarea Tn de la spec activa. Escribe primero las
> pruebas, ejecuta las verificaciones de AGENTS.md, marca la tarea solo si cumple
> Hecho cuando y detente.

## Validación

> Recorre la spec RF por RF. Para cada requisito indica prueba, resultado y
> evidencia. Verifica además compatibilidad, migración y rollback. Emite un
> veredicto final sin corregir código durante esta fase.

## Cambio

> Registra el nuevo requisito actualizando primero spec.md. Muestra el impacto en
> RF, contrato, migración, plan y tareas. No modifiques implementación todavía.

