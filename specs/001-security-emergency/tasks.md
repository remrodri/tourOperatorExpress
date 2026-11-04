# Tareas — Spec 001

No ejecutar hasta que la spec esté `Ready`.

- [x] T1. Corregir el descubrimiento de pruebas, confirmar `npm ci`, build y
  suite baseline sin modificar comportamiento. (RF-15, RF-16)
  **Hecho cuando:** Jest descubre todos los tests previstos y se documentan los
  fallos preexistentes.

- [ ] T2. Añadir pruebas de contrato para login y el envelope actual.
  (RF-14, RF-15)
  **Hecho cuando:** login válido e inválido tienen assertions de estado y forma
  de respuesta, sin comprobar secretos reales.

- [ ] T3. Crear configuración central validada y tests de arranque inseguro.
  (RF-1, RF-2)
  **Hecho cuando:** secreto ausente, vacío, corto o de ejemplo impide arrancar y
  una configuración válida permite compilar y ejecutar tests.

- [ ] T4. Implementar access token de 30 minutos y refresh token rotatorio,
  revocable y almacenado en cookie segura. (RF-3..6)
  **Hecho cuando:** login, renovación, rotación, expiración, logout y detección de
  reutilización tienen pruebas verdes sin persistir tokens en texto plano.

- [ ] T5. Eliminar logs sensibles y añadir redacción/correlación en errores.
  (RF-9, RF-10)
  **Hecho cuando:** pruebas confirman que contraseña, hash, token y respuestas no
  aparecen en logs ni respuestas.

- [ ] T6. Configurar allowlist CORS y protección CSRF para sesiones basadas en
  cookie. (RF-7, RF-8)
  **Hecho cuando:** desarrollo acepta localhost:5173, producción exige
  `CORS_ORIGINS`, orígenes ajenos se rechazan y los flujos cross-site tienen
  pruebas CSRF.

- [ ] T7. Añadir pruebas y validación robusta de imágenes en todos los uploads.
  (RF-12)
  **Hecho cuando:** archivos válidos pasan y contenido engañoso, exceso de tamaño
  o cantidad se rechazan sin dejar archivos residuales.

- [ ] T8. Separar comprobantes del contenido estático público. (RF-11)
  **Hecho cuando:** una URL histórica no entrega el comprobante, existe una ruta
  local privada que permite al administrador y vendedor asignado, rechaza al
  resto, y la compatibilidad con el frontend está registrada.

- [ ] T9. Manejar referencias a archivos locales que desaparecieron tras un
  redeploy. (RF-13)
  **Hecho cuando:** la API devuelve 404 uniforme, conserva MongoDB y tiene una
  prueba que simula el archivo faltante.

- [ ] T10. Validación final RF por RF y actualización de documentación.
  (RF-1..RF-16)
  **Hecho cuando:** cada RF apunta a una prueba verde, build y suite pasan y los
  riesgos diferidos tienen una spec posterior identificada.

