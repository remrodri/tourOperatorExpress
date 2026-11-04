# Contrato HTTP actual — inventario inicial

> Estado: borrador obtenido del código. Debe contrastarse con las llamadas del
> frontend antes de cambiar comportamiento.

Base actual: `/api/v1`. Las respuestas usan normalmente la forma
`{ statusCode, message, data }`.

| Método | Ruta | Estado actual | Clasificación objetivo |
|---|---|---|---|
| POST | `/auth/login` | Pública | Pública con rate limit |
| GET | `/users` | Pública | Privada, administración |
| POST | `/users` | JWT | Privada, administración |
| PUT | `/users/:userId` | Pública | Privada, propietario o administración |
| PATCH | `/users/delete-user` | JWT | Privada, administración |
| PATCH | `/users/enable-user` | JWT | Privada, administración |
| PATCH | `/users/disable-user` | JWT | Privada, administración |
| PATCH | `/security-setup` | JWT | Privada, identidad del token |
| POST | `/security-setup-questions` | Pública | Transitoria; revisar flujo inicial |
| PATCH | `/security-setup-answers` | Pública | Privada o token de configuración |
| POST | `/security-setup-question` | Pública | Pública, respuesta no enumerable |
| GET | `/security-setup/random-question/:userId` | Pública | Sustituir por desafío opaco |
| POST | `/security-setup-answer` | Pública | Pública con rate limit y desafío |
| PATCH | `/security-setup-password` | Pública | Token de recuperación de un uso |
| GET | `/roles` | Pública | Privada o catálogo público justificado |
| GET/POST/PUT/DELETE | `/tour-types...` | Pública | Lectura pública; escritura administrativa |
| GET/POST/PUT/DELETE | `/cancellation-policy...` | Pública | Lectura pública; escritura administrativa |
| GET/POST/PUT | `/tourist-destination...` | Pública | Lectura pública; escritura administrativa |
| GET/POST/PUT/DELETE | `/tour-package...` | Pública | Lectura pública; escritura administrativa |
| GET/POST/PUT | `/date-range...` | Pública | Lectura pública; escritura administrativa |
| GET/POST/PUT | `/bookings...` | Pública | Privada según rol/propiedad |
| GET/POST | `/payments` | Pública | Privada según rol/propiedad |
| GET/PUT | `/tourists...` | Pública | Privada según rol/propiedad |
| GET | `/uploads/*` | Pública | Perfiles/destinos públicos; comprobantes por acceso privado |

## Aspectos todavía por confirmar con el frontend

- Rutas realmente utilizadas y campos de request/response consumidos.
- Lugar y duración del almacenamiento del JWT.
- Tratamiento actual de 401, 403, 404 y errores de validación.
- Roles y operaciones visibles para cada pantalla.
- URLs de imágenes y comprobantes persistidas por el cliente.
- Flujo de primer inicio y recuperación de contraseña.

## Decisión temporal sobre archivos

El proyecto continuará usando el disco local de Railway sin garantía de
persistencia. La estructura objetivo es:

```text
uploads/
├── public/
│   ├── profiles/
│   └── destinations/
└── private/
    └── payment-proofs/
```

La estructura puede introducirse de forma compatible o mediante una migración
de rutas. Las imágenes de perfil y destinos pueden ser públicas; los
comprobantes no deben servirse por `express.static` y deben requerir permisos.

Este archivo se actualizará con ejemplos reales y pruebas de contrato antes de
implementar cambios coordinados.

