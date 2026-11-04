# Plan técnico — Spec 001

## Estado

Listo para implementación. Las decisiones de sesión, CORS y acceso a
comprobantes están resueltas. La URL definitiva de producción se suministrará
por configuración y no bloquea el backend.

## Módulos afectados

- Configuración central: carga y validación de variables de entorno (RF-1..3).
- Sesiones: access token de 30 minutos y refresh rotatorio persistido de forma
  revocable, con límite absoluto de 7 días (RF-3..6).
- CORS y CSRF: allowlist por entorno y protección de cookies cross-site
  (RF-7, RF-8).
- Auth/security setup: eliminación de logs sensibles (RF-9, RF-10).
- Manejo de errores y logging: redacción y correlación (RF-10).
- Archivos y estáticos: separación local de contenido público/privado y manejo
  de archivos efímeros (RF-11..13).
- Jest/TypeScript: baseline reproducible y pruebas de regresión (RF-14..16).

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
6. Persistir únicamente hashes de refresh tokens y metadatos de la familia de
   sesión. Se descarta guardar refresh tokens utilizables en texto plano.
7. Resolver el comprobante desde el pago y su reserva, y autorizar al
   administrador o al vendedor asignado. Se descarta confiar en una ruta de
   archivo enviada por el cliente.
8. Configurar CORS mediante allowlist. Para cookies cross-site se utilizará
   `SameSite=None; Secure` más protección CSRF; para despliegues same-site se
   preferirá `SameSite=Lax`.

## Estrategia de tests

- Unitarios del módulo de configuración con entornos aislados.
- Unitarios de JWT para secreto ausente y claims/expiración.
- Integración de login con Supertest y MongoDB en memoria.
- Prueba que intercepte el logger y confirme redacción.
- Integración de upload: válido, MIME/extensión engañosa, tamaño y cantidad.
- Regresión del envelope HTTP vigente.
- Solicitud directa a comprobante que no debe devolver el archivo.
- Comprobante solicitado por administrador, vendedor asignado, otro vendedor y
  usuario sin sesión.
- Referencia existente cuyo archivo local desapareció: respuesta 404 uniforme.

## Compatibilidad

- RF-1, RF-2, RF-7, RF-8, RF-9, RF-10, RF-12, RF-13, RF-14 y RF-16 son
  compatibles.
- RF-3 cambia la sesión esperada por el frontend: los nuevos access tokens
  expirarán a los 30 minutos. No se mantendrá la duración insegura anterior; la
  estrategia de renovación se definirá antes de implementar T4.
- RF-4 a RF-6 requieren que el frontend use cookies con credenciales y renueve
  la sesión.
- RF-11 es coordinado si el frontend usa URLs públicas de comprobantes.

## Despliegue y rollback

- Validar variables requeridas antes del despliegue.
- Rotar secretos antes de habilitar la versión endurecida.
- Monitorear errores de configuración, 401 y acceso a archivos.
- No hacer rollback a una clave conocida ni a comprobantes públicos. Si falla el
  nuevo acceso privado, corregir o deshabilitar temporalmente la visualización.
- No se requiere aprovisionar ni configurar almacenamiento externo.

