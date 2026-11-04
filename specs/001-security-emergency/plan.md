# Plan técnico — Spec 001

## Estado

Borrador. No implementar hasta resolver las dudas que afecten al frontend y
marcar la spec como `Ready`.

## Módulos afectados

- Configuración central: carga y validación de variables de entorno (RF-1..3).
- JWT: emisión y verificación sin fallback (RF-2, RF-3).
- Auth/security setup: eliminación de logs sensibles (RF-4, RF-5).
- Manejo de errores y logging: redacción y correlación (RF-5).
- Archivos y estáticos: separación local de contenido público/privado y manejo
  de archivos efímeros (RF-6..8).
- Jest/TypeScript: baseline reproducible y pruebas de regresión (RF-9..11).

## Decisiones técnicas propuestas

1. Crear un módulo de configuración validado una sola vez al arrancar. Se
   descarta leer `process.env` con fallbacks en módulos individuales porque hace
   posibles estados parcialmente configurados.
2. Mantener `ApiResponseBuilder` en esta iteración. Se descarta cambiar el
   envelope ahora porque implicaría una ruptura sin beneficio de contención.
3. Separar rutas estáticas públicas de documentos privados. Se descarta ocultar
   URLs únicamente por nombres aleatorios porque eso no es autorización.
4. Validar metadatos y contenido real de archivos. Se descarta confiar solo en
   `mimetype` o extensión porque ambos son controlados por el cliente.
5. Mantener almacenamiento local temporal en Railway. Se descartan S3,
   Cloudinary y equivalentes por costo y alcance. El sistema tratará la ausencia
   del archivo como un estado recuperable y no como corrupción de datos.

## Estrategia de tests

- Unitarios del módulo de configuración con entornos aislados.
- Unitarios de JWT para secreto ausente y claims/expiración.
- Integración de login con Supertest y MongoDB en memoria.
- Prueba que intercepte el logger y confirme redacción.
- Integración de upload: válido, MIME/extensión engañosa, tamaño y cantidad.
- Regresión del envelope HTTP vigente.
- Solicitud directa a comprobante que no debe devolver el archivo.
- Referencia existente cuyo archivo local desapareció: respuesta 404 uniforme.

## Compatibilidad

- RF-1, RF-2, RF-4, RF-5, RF-7, RF-8, RF-9 y RF-11 son compatibles.
- RF-3 puede invalidar sesiones si se reduce inmediatamente la expiración; debe
  aplicarse con una transición definida.
- RF-6 es coordinado si el frontend usa URLs públicas de comprobantes.

## Despliegue y rollback

- Validar variables requeridas antes del despliegue.
- Rotar secretos antes de habilitar la versión endurecida.
- Monitorear errores de configuración, 401 y acceso a archivos.
- No hacer rollback a una clave conocida ni a comprobantes públicos. Si falla el
  nuevo acceso privado, corregir o deshabilitar temporalmente la visualización.
- No se requiere aprovisionar ni configurar almacenamiento externo.

