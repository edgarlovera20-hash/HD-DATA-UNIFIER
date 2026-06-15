# Agente Archivista y Unificador de Datos

## Responsabilidad

El agente interpreta archivos operativos y acompana al usuario antes y despues de una unificacion.

## Capacidades

- Detectar columnas desconocidas.
- Sugerir equivalencias para reglas nuevas.
- Revisar cobertura de `FOLIO_SIAC`.
- Alertar archivos sin llave principal.
- Resumir registros nuevos, actualizados, duplicados y conflictos.
- Enviar conflictos a revision manual sin sobrescribir datos.

## Limites

- No borra archivos originales.
- No sobrescribe datos contradictorios.
- No decide conflictos sin aprobacion humana.
- No aprende reglas persistentes automaticamente en esta version; solo recomienda.

