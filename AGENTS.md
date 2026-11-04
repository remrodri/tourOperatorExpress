# AGENTS.md — tourOperatorExpress

## Proyecto
Backend REST de una operadora de turismo, construido con Node.js, Express,
TypeScript, MongoDB/Mongoose y Zod. La aplicación existente está consumida por
un frontend; por tanto, este es un proyecto brownfield y la compatibilidad del
contrato HTTP debe preservarse o migrarse explícitamente.

## Documentos obligatorios
Antes de modificar código:

1. Leer `docs/constitution.md`.
2. Leer `docs/current-api-contract.md`.
3. Leer la spec activa, su `plan.md` y su `tasks.md`.
4. Implementar solamente la tarea solicitada.

Si el comportamiento requerido no está definido, actualizar primero la spec y
resolver la ambigüedad antes de escribir código.

## Comandos
- Instalar dependencias: `npm ci`
- Desarrollo: `npm run dev`
- Compilar: `npm run build`
- Pruebas: `npm test -- --runInBand`

## Estilo y convenciones
- TypeScript estricto; evitar `any` nuevo.
- Identificadores de código en inglés y mensajes de API en español mientras el
  contrato vigente así lo requiera.
- Controladores finos; reglas de negocio en servicios; acceso a datos en
  repositorios.
- Validar toda entrada externa con esquemas Zod.
- Nunca registrar secretos, tokens, contraseñas, hashes, respuestas de
  seguridad ni documentos personales.

## Reglas de compatibilidad y seguridad
- No cambiar rutas, códigos HTTP ni la forma `statusCode/message/data` sin una
  spec de migración y pruebas de contrato.
- Las rutas privadas deben aplicar autenticación, autorización por rol y,
  cuando corresponda, propiedad del recurso.
- La identidad autenticada proviene del token validado, no de un `userId`
  enviado por el cliente.
- No añadir secretos ni `.env` al repositorio. `uploads` local está permitido en
  ejecución como almacenamiento temporal, pero no se deben agregar nuevos
  archivos subidos al control de versiones.
- No introducir S3, Cloudinary ni otro servicio de pago sin una nueva spec y
  aprobación explícita.
- No debilitar controles para hacer pasar una prueba.
- Las migraciones de datos deben documentar respaldo, reversión e idempotencia.

## Al terminar cualquier tarea
- Ejecutar las pruebas relacionadas y la suite completa.
- Ejecutar `npm run build`.
- Asociar cada prueba nueva con sus RF.
- Marcar la tarea como hecha solo si su condición `Hecho cuando` se cumple.
- Informar cambios de contrato, riesgos pendientes y verificaciones realizadas.

