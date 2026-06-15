# HD-DATA-UNIFIER

Modulo central del ecosistema Heavenly Dreams para leer archivos Excel moderno (`.xlsx`) y CSV, normalizar columnas y generar una base maestra consolidada por `FOLIO_SIAC`.

## Funcionalidad

- Carga multiple de archivos `.xlsx` y `.csv`.
- Lectura de todas las hojas de cada archivo.
- Deteccion de columnas equivalentes, por ejemplo `FOLIO`, `FOLIO SIAC`, `SIAC` -> `FOLIO_SIAC`.
- Normalizacion de fechas a `DD/MM/AAAA`, incluyendo seriales de Excel.
- Unificacion por `FOLIO_SIAC`.
- Completa campos vacios sin sobrescribir informacion existente.
- Marca conflictos en `CONFLICTO_DATOS` y genera `REVISION_MANUAL`.
- Exporta `BASE_UNIFICADA_HEAVENLY_DREAMS` en Excel y CSV.
- Mantiene historial local de cargas y trabajos.

## Hojas del Excel final

1. `BASE_UNIFICADA`
2. `REGISTROS_NUEVOS`
3. `REGISTROS_ACTUALIZADOS`
4. `DUPLICADOS`
5. `CONFLICTOS`
6. `MOROSIDAD`
7. `REVISION_MANUAL`
8. `LOG_DE_CAMBIOS`
9. `RESUMEN`

## API

- `POST /api/data-unifier/upload`
- `POST /api/data-unifier/preview`
- `POST /api/data-unifier/merge`
- `GET /api/data-unifier/history`
- `GET /api/data-unifier/download/:id?format=xlsx|csv`
- `GET /api/data-unifier/report/:id`

## Desarrollo

```bash
npm install
npm run dev
```

La API corre en `http://localhost:3010` y Vite en `http://localhost:5177`.

## Produccion local

```bash
npm run build
npm start
```

## Agente

Incluye el `Agente Archivista y Unificador de Datos`, encargado de revisar cobertura de `FOLIO_SIAC`, detectar columnas desconocidas y recomendar equivalencias antes de unificar.
