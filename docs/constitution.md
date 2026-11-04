# Constitución — tourOperatorExpress

Principios innegociables. Toda spec, plan, tarea y cambio debe cumplirlos.

1. **La spec manda:** ningún comportamiento nuevo se implementa sin un RF en la
   spec activa. Los cambios comienzan en la documentación, no en el código.
2. **Compatibilidad explícita:** el frontend existente no se rompe de forma
   silenciosa. Todo cambio de contrato se clasifica como compatible, coordinado,
   transitorio o ruptura versionada, e incluye su estrategia de retirada.
3. **Seguridad por defecto:** toda ruta es privada salvo que la spec justifique
   que sea pública. Autenticación, rol y propiedad son controles diferentes y
   se prueban por separado.
4. **Datos sensibles protegidos:** secretos, tokens, credenciales, hashes y
   respuestas de seguridad no se registran ni se versionan. Los archivos locales
   temporales se permiten por las restricciones del proyecto, pero los
   comprobantes y datos personales solo se entregan a sujetos autorizados.
5. **Tests como puerta:** cada RF tiene al menos una prueba automática. No se
   avanza con pruebas o compilación en rojo.
6. **Validación en límites:** parámetros, query, body, archivos, configuración y
   datos persistidos se validan antes de entrar a la lógica de negocio.
7. **Integridad transaccional:** índices y restricciones de base de datos son la
   fuente final de integridad. Las operaciones de varios documentos definen
   atomicidad, concurrencia y recuperación ante fallos.
8. **Cambios pequeños y reversibles:** una tarea produce un cambio revisable y
   desplegable. Migraciones y despliegues de riesgo incluyen rollback.
9. **Observabilidad sin filtraciones:** errores y eventos se registran de forma
   estructurada, con correlación y redacción de datos sensibles.
10. **Una sola arquitectura:** controladores, servicios, repositorios e
    inyección de dependencias siguen un patrón uniforme; no se agregan variantes
    paralelas sin decisión registrada.

## Restricción de infraestructura aceptada

Mientras este siga siendo un proyecto personal y temporal, se permite usar el
disco local de Railway para `uploads`. No se exige contratar almacenamiento
externo. Se acepta expresamente que los archivos pueden desaparecer al
redesplegar, reiniciar o eliminar la instancia; el sistema debe tolerar archivos
faltantes sin corromper reservas, pagos o usuarios.

