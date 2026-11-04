# Spec 001 — Contención de seguridad y baseline verificable

**Estado:** Ready

## Contexto y objetivo

El backend existente es consumido por un frontend, pero contiene exposiciones
que permiten filtrar credenciales y operar sin autorización. Esta iteración
establece un baseline reproducible y corrige riesgos compatibles con el contrato,
preparando el cierre coordinado de rutas sensibles.

## Actores

- Usuario anónimo.
- Usuario autenticado.
- Administrador del despliegue.
- Frontend existente.

## Historias de usuario

- H1: Como operador quiero que el servidor rechace configuraciones inseguras para
  no desplegar una instancia vulnerable por accidente.
- H2: Como usuario quiero que mis credenciales y documentos no aparezcan en logs
  ni se expongan públicamente.
- H3: Como equipo quiero pruebas del contrato actual para endurecer el backend sin
  romper el frontend inadvertidamente.

## Requisitos funcionales (EARS)

### Configuración y tokens
- RF-1: CUANDO el servidor inicie sin una configuración válida de `JWT_SECRET`,
  EL SISTEMA abortará antes de aceptar conexiones y mostrará un error sin incluir
  secretos.
- RF-2: EL SISTEMA no utilizará claves secretas predeterminadas en ningún entorno.
- RF-3: CUANDO se emita un token de acceso, EL SISTEMA incluirá únicamente claims
  necesarios y expirará a los 30 minutos. No se conservará la duración anterior
  de 720 horas por compatibilidad.
- RF-4: CUANDO un access token expire y exista una sesión renovable válida, EL
  SISTEMA emitirá un nuevo par mediante un refresh token rotatorio almacenado en
  una cookie `HttpOnly`, `Secure` en producción y con política `SameSite`
  explícita. Cada uso invalidará el refresh token anterior.
- RF-5: SI un refresh token revocado, expirado, reutilizado o desconocido se
  presenta, ENTONCES EL SISTEMA rechazará la renovación y revocará la familia de
  sesión asociada cuando exista evidencia de reutilización.
- RF-6: MIENTRAS una familia de sesión permanezca activa, EL SISTEMA permitirá
  rotaciones solo hasta cumplir 7 días desde el login original; la rotación no
  extenderá ese límite absoluto y después exigirá nuevamente las credenciales.
- RF-7: CUANDO el servidor inicie en producción, EL SISTEMA exigirá al menos un
  origen explícito en `CORS_ORIGINS`; en desarrollo permitirá
  `http://localhost:5173` y nunca utilizará `*` junto con credenciales.
- RF-8: SI frontend y backend operan en sitios diferentes y la cookie requiere
  `SameSite=None`, ENTONCES EL SISTEMA exigirá `Secure`, validará el origen y
  aplicará protección CSRF al endpoint de renovación y cierre de sesión.

### Redacción de información
- RF-9: CUANDO se procese login, renovación, cierre de sesión, recuperación o
  configuración de seguridad, EL
  SISTEMA no registrará contraseñas, hashes, tokens, respuestas de seguridad ni
  documentos completos de usuario.
- RF-10: SI ocurre un error inesperado, ENTONCES EL SISTEMA registrará un
  identificador de correlación y datos técnicos redactados, y responderá con el
  formato vigente sin revelar detalles internos.

### Archivos y exposición
- RF-11: CUANDO se solicite una ruta bajo comprobantes de pago, EL SISTEMA no
  entregará el archivo mediante el middleware estático público y exigirá un
  usuario con permiso para consultarlo. Solo un administrador o el vendedor
  asignado a la reserva asociada podrá obtenerlo; cualquier otro usuario recibirá
  `403` sin revelar la existencia o ruta física del archivo.
- RF-12: CUANDO se cargue una imagen, EL SISTEMA aplicará límites de tamaño y
  cantidad y rechazará extensiones o tipos no permitidos antes de hacerla
  accesible.
- RF-13: SI un archivo local referenciado ya no existe después de un reinicio o
  redespliegue, ENTONCES EL SISTEMA responderá `404` de forma controlada sin
  modificar ni eliminar el registro de MongoDB.

### Baseline y compatibilidad
- RF-14: EL SISTEMA conservará durante esta spec la forma de respuesta
  `statusCode/message/data` para solicitudes válidas existentes.
- RF-15: CUANDO se ejecute la suite, EL SISTEMA descubrirá los tests válidos y
  cubrirá como mínimo login válido, credenciales inválidas, configuración JWT
  ausente, redacción de logs y rechazo de archivo inválido.
- RF-16: CUANDO se ejecute el build, EL SISTEMA compilará en modo TypeScript
  estricto sin depender de archivos generados previamente.

## Requisitos no funcionales

- No agregar secretos ni datos personales al repositorio o fixtures.
- Las pruebas no dependerán de MongoDB externo ni de red pública.
- Los errores válidos conservarán el idioma y estructura consumidos actualmente.
- La instalación será reproducible mediante `npm ci`.
- El almacenamiento seguirá siendo local y temporal; no se añadirán servicios
  externos ni costos de infraestructura en esta spec.

## Casos límite

- `JWT_SECRET` ausente, vacío, corto o con valor de ejemplo.
- Excepción que contiene accidentalmente un objeto de usuario.
- Archivo con extensión permitida pero contenido no permitido.
- Archivo demasiado grande o más archivos que el máximo.
- Solicitud directa a una URL histórica de comprobante.
- Test renombrado que antes no era descubierto por Jest.

## Fuera de alcance

- Matriz completa de autorización por roles.
- Sustitución final del flujo de recuperación de contraseña.
- Almacenamiento persistente externo, copias de seguridad de archivos o CDN.
- Eliminación del historial de Git.
- Cambio general a `/api/v2`.

Estos puntos se implementarán en specs posteriores; las vulnerabilidades críticas
pueden mitigarse operacionalmente mientras tanto.

## Criterios de finalización

- RF-1 a RF-16 tienen pruebas automáticas identificables y verdes.
- `npm run build` y `npm test -- --runInBand` finalizan correctamente.
- Una revisión confirma que no se imprimen datos sensibles en rutas de auth y
  security setup.
- Los comprobantes dejan de estar disponibles por la ruta estática.
- La ausencia de un archivo local devuelve un 404 controlado.
- Se documentan cambios que requieran coordinación con el frontend.

## Dudas abiertas

- [RESUELTA] El access token durará 30 minutos y se renovará mediante refresh
  token rotatorio en cookie `HttpOnly`.
- [RESUELTA] La familia de sesión tendrá una duración máxima absoluta de 7 días
  desde el login original.
- [RESUELTA] Solo el administrador y el vendedor asignado a la reserva pueden
  consultar su comprobante. El uso actual de URLs `/uploads` se verificará al
  inventariar el frontend antes de implementar T7.
- [RESUELTA] Desarrollo usará `http://localhost:5173`. Producción se configurará
  mediante `CORS_ORIGINS`; no se requiere conocer ahora el dominio definitivo.

