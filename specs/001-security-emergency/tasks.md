# Tareas — Spec 001

No ejecutar hasta que la spec esté `Ready`.

- [ ] T1. Corregir el descubrimiento de pruebas, confirmar `npm ci`, build y
  suite baseline sin modificar comportamiento. (RF-10, RF-11)
  **Hecho cuando:** Jest descubre todos los tests previstos y se documentan los
  fallos preexistentes.

- [ ] T2. Añadir pruebas de contrato para login y el envelope actual.
  (RF-9, RF-10)
  **Hecho cuando:** login válido e inválido tienen assertions de estado y forma
  de respuesta, sin comprobar secretos reales.

- [ ] T3. Crear configuración central validada y tests de arranque inseguro.
  (RF-1, RF-2)
  **Hecho cuando:** secreto ausente, vacío, corto o de ejemplo impide arrancar y
  una configuración válida permite compilar y ejecutar tests.

- [ ] T4. Endurecer emisión de JWT conservando temporalmente compatibilidad de
  claims necesaria para el frontend. (RF-3)
  **Hecho cuando:** expiración y claims están probados y la decisión de transición
  está documentada.

- [ ] T5. Eliminar logs sensibles y añadir redacción/correlación en errores.
  (RF-4, RF-5)
  **Hecho cuando:** pruebas confirman que contraseña, hash, token y respuestas no
  aparecen en logs ni respuestas.

- [ ] T6. Añadir pruebas y validación robusta de imágenes en todos los uploads.
  (RF-7)
  **Hecho cuando:** archivos válidos pasan y contenido engañoso, exceso de tamaño
  o cantidad se rechazan sin dejar archivos residuales.

- [ ] T7. Separar comprobantes del contenido estático público. (RF-6)
  **Hecho cuando:** una URL histórica no entrega el comprobante, existe una ruta
  local privada con permisos y la compatibilidad está registrada.

- [ ] T8. Manejar referencias a archivos locales que desaparecieron tras un
  redeploy. (RF-8)
  **Hecho cuando:** la API devuelve 404 uniforme, conserva MongoDB y tiene una
  prueba que simula el archivo faltante.

- [ ] T9. Validación final RF por RF y actualización de documentación.
  (RF-1..RF-11)
  **Hecho cuando:** cada RF apunta a una prueba verde, build y suite pasan y los
  riesgos diferidos tienen una spec posterior identificada.

