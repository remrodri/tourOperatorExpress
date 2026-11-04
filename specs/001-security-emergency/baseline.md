# Baseline previo a T1

Fecha: 2026-11-04

## Resultado

- `npm run build`: correcto.
- `npm test -- --runInBand`: falla antes de ejecutar pruebas.
- Suites descubiertas: 1 de 3 archivos existentes.
- Tests ejecutados: 0.

## Fallos observados

1. Jest/CommonJS intenta cargar `nanoid` v5, que publica ESM, y aborta con
   `Cannot use import statement outside a module` al importar la aplicación.
2. `tests/auth/routes/authRouter.test.ts1` y
   `tests/auth/service/authService.test.ts1` no coinciden con `*.test.ts`.
3. La suite duplicada de rutas contiene un fixture incompleto y logs de prueba.

## Alcance de T1

- Hacer que las tres suites previstas sean descubiertas.
- Aislar en tests la dependencia ESM que impide importar la aplicación, sin
  cambiar todavía el comportamiento productivo.
- Corregir únicamente fixtures/configuración necesarios para obtener un baseline
  ejecutable.

