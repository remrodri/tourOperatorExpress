# Spec 001 — Contención de seguridad y baseline verificable

**Estado:** Draft

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
  necesarios y una expiración configurable; el valor inicial de migración se
  documentará sin ampliar las 720 h actuales.

### Redacción de información
- RF-4: CUANDO se procese login, recuperación o configuración de seguridad, EL
  SISTEMA no registrará contraseñas, hashes, tokens, respuestas de seguridad ni
  documentos completos de usuario.
- RF-5: SI ocurre un error inesperado, ENTONCES EL SISTEMA registrará un
  identificador de correlación y datos técnicos redactados, y responderá con el
  formato vigente sin revelar detalles internos.

### Archivos y exposición
- RF-6: CUANDO se solicite una ruta bajo comprobantes de pago, EL SISTEMA no
  entregará el archivo mediante el middleware estático público y exigirá un
  usuario con permiso para consultarlo.
- RF-7: CUANDO se cargue una imagen, EL SISTEMA aplicará límites de tamaño y
  cantidad y rechazará extensiones o tipos no permitidos antes de hacerla
  accesible.
- RF-8: SI un archivo local referenciado ya no existe después de un reinicio o
  redespliegue, ENTONCES EL SISTEMA responderá `404` de forma controlada sin
  modificar ni eliminar el registro de MongoDB.

### Baseline y compatibilidad
- RF-9: EL SISTEMA conservará durante esta spec la forma de respuesta
  `statusCode/message/data` para solicitudes válidas existentes.
- RF-10: CUANDO se ejecute la suite, EL SISTEMA descubrirá los tests válidos y
  cubrirá como mínimo login válido, credenciales inválidas, configuración JWT
  ausente, redacción de logs y rechazo de archivo inválido.
- RF-11: CUANDO se ejecute el build, EL SISTEMA compilará en modo TypeScript
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

- RF-1 a RF-11 tienen pruebas automáticas identificables y verdes.
- `npm run build` y `npm test -- --runInBand` finalizan correctamente.
- Una revisión confirma que no se imprimen datos sensibles en rutas de auth y
  security setup.
- Los comprobantes dejan de estar disponibles por la ruta estática.
- La ausencia de un archivo local devuelve un 404 controlado.
- Se documentan cambios que requieran coordinación con el frontend.

## Dudas abiertas

- [NECESITA ACLARACIÓN] ¿Qué duración de access token y estrategia de renovación
  usará la siguiente spec de autenticación?
- [NECESITA ACLARACIÓN] ¿Qué roles concretos pueden consultar comprobantes y el
  frontend los muestra actualmente mediante URLs de `/uploads`?
- [NECESITA ACLARACIÓN] ¿Cuáles son los orígenes de frontend de desarrollo,
  pruebas y producción?

