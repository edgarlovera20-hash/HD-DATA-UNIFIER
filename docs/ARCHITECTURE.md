# Architecture

`HD-DATA-UNIFIER` esta separado en cuatro capas.

## UI

React + Vite en `src/main.tsx`. La pantalla opera la carga, seleccion de base, vista previa, merge, descarga e historial.

## API

Express en `server.ts`, con rutas del modulo en `server/routes/data-unifier.ts`.

## Motor

- `columnRules.ts`: sinonimos, normalizacion de encabezados y comparacion.
- `dateUtils.ts`: conversion de fechas y seriales de Excel.
- `fileReader.ts`: lectura de hojas con `xlsx`.
- `mergeEngine.ts`: unificacion por `FOLIO_SIAC`.
- `excelExporter.ts`: salida Excel/CSV.

## Persistencia

La version inicial usa almacenamiento local JSON en `data/history.json` y archivos en `data/uploads` + `data/results`. El esquema Prisma documenta las tablas de produccion previstas.

