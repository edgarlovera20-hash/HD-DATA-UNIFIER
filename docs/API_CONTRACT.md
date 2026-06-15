# API Contract

## POST `/api/data-unifier/upload`

Multipart form-data:

- `files`: XLSX o CSV. Maximo configurable con `MAX_UPLOAD_MB`.

Respuesta:

```json
{
  "files": [],
  "preview": [],
  "agentReport": {}
}
```

## POST `/api/data-unifier/preview`

```json
{
  "fileIds": ["uploaded-file-id"]
}
```

## POST `/api/data-unifier/merge`

```json
{
  "fileIds": ["uploaded-file-id"],
  "baseFileId": "uploaded-file-id"
}
```

Respuesta:

```json
{
  "jobId": "merge-job-id",
  "summary": {},
  "downloads": {
    "xlsx": "/api/data-unifier/download/job-id?format=xlsx",
    "csv": "/api/data-unifier/download/job-id?format=csv"
  },
  "report": "/api/data-unifier/report/job-id"
}
```

## GET `/api/data-unifier/history`

Devuelve archivos subidos y trabajos recientes.

## GET `/api/data-unifier/download/:id`

Query:

- `format=xlsx`
- `format=csv`

## GET `/api/data-unifier/report/:id`

Devuelve el resumen persistido del trabajo.
