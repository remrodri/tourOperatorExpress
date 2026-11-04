# MEMORY — tourOperatorExpress

Bitácora breve del trabajo SDD. No guardar secretos, tokens, credenciales, datos
personales ni contenido de `.env`.

## Estado actual

- Rama: `main`.
- Spec activa: `001-security-emergency` (`Ready`).
- Última tarea terminada: T1.
- Próxima tarea: T2, pruebas de contrato de login y envelope HTTP.
- Frontend: se corregirá después del backend; React + Vite.

## Decisiones aprobadas

- Access token: 30 minutos.
- Refresh token: rotatorio, cookie `HttpOnly`, hash persistido.
- Sesión renovable: máximo absoluto de 7 días desde login.
- CORS desarrollo: `http://localhost:5173`.
- CORS producción: variable `CORS_ORIGINS` obligatoria.
- Cookies cross-site: `SameSite=None`, `Secure`, validación de origen y CSRF.
- Comprobantes: visibles solo para administrador o vendedor asignado.
- Archivos: almacenamiento local temporal en Railway; sin S3/Cloudinary.
- Archivo local perdido: responder 404 sin eliminar el registro de MongoDB.

## Commits publicados

- `18d8b5f`: base SDD y retiro de `.env` del estado actual del repositorio.
- `211100a`: Spec 001 clarificada y marcada `Ready`.

## Verificaciones

- 2026-11-04, baseline previo: build correcto; Jest bloqueado por nanoid ESM;
  solo 1 de 3 suites era descubrible.
- 2026-11-04, T1: build correcto; 3 suites y 6 pruebas aprobadas.

## Riesgos y pendientes

- `.env` puede seguir existiendo en el historial Git; rotar credenciales.
- Login todavía imprime body, documento de usuario, hash y JWT; corresponde T5.
- La aplicación productiva CommonJS todavía importa `nanoid` v5 ESM; revisar en
  una tarea específica sin ampliar T1.
- `.vscode/settings.json` y `package-lock.json` tienen cambios locales ajenos a
  los commits SDD y deben preservarse.
