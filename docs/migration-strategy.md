# Estrategia de migración sin romper el frontend

## Principios

1. Primero se capturan pruebas del contrato que el frontend usa hoy.
2. Los endurecimientos internos compatibles se despliegan antes que los cambios
   de contrato.
3. Para cambios coordinados, el backend soporta temporalmente ambos contratos
   solo cuando hacerlo no conserva una vulnerabilidad crítica.
4. Las rutas inseguras críticas se cierran con prioridad; si requieren cambio de
   frontend, se prepara y despliega en la misma ventana.

## Fases

### Fase A — Baseline
- Instalar de forma reproducible con `npm ci`.
- Corregir descubrimiento de tests y capturar el comportamiento vigente.
- Inventariar llamadas del frontend y crear pruebas de contrato.

### Fase B — Cambios compatibles
- Validación obligatoria de configuración.
- Eliminación/redacción de logs sensibles.
- Headers, límites de body y manejo uniforme de errores/404.
- Validación segura de archivos sin cambiar respuestas válidas.

### Fase C — Cambios coordinados
- Cliente HTTP del frontend enviando `Authorization: Bearer`.
- Protección de rutas y autorización por roles/propiedad.
- Flujo nuevo de recuperación con desafío y token de un solo uso.
- Acceso privado a comprobantes.

### Decisión de almacenamiento temporal

- Se mantiene `uploads` en el disco local de Railway para evitar costos.
- No se incorporan S3, Cloudinary ni servicios equivalentes.
- Perfiles y destinos pueden exponerse como archivos públicos validados.
- Comprobantes se guardan en una zona privada y se entregan por un endpoint con
  autenticación y autorización.
- Si un archivo desaparece tras un redeploy, la API responde `404` controlado y
  conserva intactos los datos de MongoDB.
- No se promete respaldo ni persistencia de archivos en esta etapa.

### Fase D — Retirada
- Invalidar tokens antiguos.
- Eliminar endpoints y formatos transitorios.
- Dejar de versionar nuevas cargas y retirar documentos sensibles del acceso
  público. La limpieza del historial se evalúa según si fueron datos reales y
  quién tuvo acceso al repositorio.
- Validar telemetría, errores y rollback tras el despliegue.

## Rollback

Cada spec debe indicar qué puede revertirse sin reabrir una vulnerabilidad. Un
rollback nunca puede restaurar claves expuestas, endpoints públicos de cambio de
contraseña o acceso anónimo a comprobantes.

