# Auditoría inicial de seguridad

## Críticos

1. Cambio público de contraseña mediante `userId` y `newPassword`, sin prueba de
   identidad vinculada a la operación.
2. La mayoría de las rutas de lectura y escritura no aplica autenticación ni
   autorización.
3. `JWT_SECRET` tiene un valor alternativo conocido y los tokens duran 720 h.
4. `.env`, fotos y comprobantes de pago están versionados. En un proyecto
   personal se acepta almacenamiento local, pero no publicar documentos reales
   ni seguir incorporando cargas al historial.
5. `uploads` completo se sirve públicamente, incluidos comprobantes.

## Altos

- Login y recuperación registran cuerpos, tokens, usuarios o respuestas.
- Respuestas de seguridad almacenadas/comparadas en texto plano y sin protección
  contra fuerza bruta.
- Cargas de algunos módulos no validan el contenido real del archivo.
- CORS permite cualquier origen.
- No hay rate limiting en login ni recuperación.
- La identidad y propiedad se toman en varios casos desde IDs controlados por el
  cliente.

## Integridad y operación

- Varias actualizaciones de Mongoose no activan validadores.
- No todos los campos asumidos como únicos tienen índice único.
- El almacenamiento local es efímero en Railway. Esto se acepta por alcance y
  costo, pero el sistema debe manejar archivos faltantes y no asumir
  persistencia.
- Faltan apagado ordenado, health/readiness y manejo JSON uniforme de 404.
- La cobertura de pruebas es insuficiente y dos archivos terminan en `.ts1`.

## Respuesta inmediata fuera del código

- Rotar JWT y todas las credenciales presentes en `.env`.
- Determinar quién tuvo acceso al repositorio y considerar expuestos los
  secretos y comprobantes versionados.
- Si los archivos contienen datos reales y el repositorio fue compartido,
  preparar su eliminación del historial conservando solo el respaldo necesario.
- Desactivar seeds con contraseñas predecibles en cualquier entorno real.

