import type { DetectedColumn } from "../types.js";

const COLUMN_SYNONYMS: Record<string, string[]> = {
  FOLIO_SIAC: ["FOLIO", "FOLIO SIAC", "FOLIO_SIAC", "FOLIO SIAC", "SIAC", "Folio Siac"],
  NOMBRE: ["NOMBRE", "NOMBRE CLIENTE", "CLIENTE", "NOMBRE_COMPLETO", "TITULAR"],
  TELEFONO: ["TELEFONO", "TELÉFONO", "CELULAR", "CONTACTO", "NUMERO", "NUMERO TELEFONO"],
  DIRECCION: ["DIRECCION", "DIRECCIÓN", "DOMICILIO", "CALLE", "DIRECCION COMPLETA"],
  COLONIA: ["COLONIA", "COL", "ASENTAMIENTO"],
  ALCALDIA: ["ALCALDIA", "ALCALDÍA", "MUNICIPIO", "DELEGACION", "DELEGACIÓN"],
  ZONA: ["ZONA", "REGION", "REGIÓN"],
  AREA: ["AREA", "ÁREA", "DISTRITO"],
  TIENDA: ["TIENDA", "SUCURSAL", "PUNTO DE VENTA"],
  ESTATUS: ["ESTATUS", "STATUS", "ESTADO", "SITUACION", "SITUACIÓN"],
  PISA_E: ["PISA E", "PISA_E", "pisa_e", "PISAE"],
  FECHA_CAPTURA: ["FECHA CAPTURA", "Fecha Captura", "FECHA_DE_CAPTURA", "FECHA_CAPTURA", "FEC CAPTURA"],
  FECHA_POSTEO: ["FECPPOSTEO", "FECHA POSTEO", "Fecha Posteo", "Fec Posteo", "FECHA_POSTEO"],
  MOROSO: ["MOROSO", "MORA", "EN MORA", "ADEUDO", "MOROSIDAD"],
  MONTO_MOROSIDAD: ["MONTO MOROSIDAD", "MONTO_MOROSIDAD", "ADEUDO TOTAL", "SALDO VENCIDO", "SALDO"],
  OBSERVACIONES: ["OBSERVACIONES", "OBS", "COMENTARIOS", "NOTAS"]
};

export const MASTER_FIELDS = [
  "FOLIO_SIAC",
  "NOMBRE",
  "TELEFONO",
  "DIRECCION",
  "COLONIA",
  "ALCALDIA",
  "ZONA",
  "AREA",
  "TIENDA",
  "ESTATUS",
  "PISA_E",
  "FECHA_CAPTURA",
  "FECHA_POSTEO",
  "MOROSO",
  "MONTO_MOROSIDAD",
  "OBSERVACIONES",
  "ARCHIVO_ORIGEN",
  "ULTIMA_ACTUALIZACION",
  "CONFLICTO_DATOS"
];

const synonymIndex = new Map<string, string>();

for (const [canonical, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
  synonymIndex.set(normalizeHeader(canonical), canonical);
  for (const synonym of synonyms) {
    synonymIndex.set(normalizeHeader(synonym), canonical);
  }
}

export function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .toUpperCase();
}

export function detectColumn(originalHeader: string): DetectedColumn {
  const normalized = normalizeHeader(originalHeader);
  const canonical = synonymIndex.get(normalized);

  if (canonical === normalized) {
    return { original: originalHeader, canonical, confidence: "exact" };
  }

  if (canonical) {
    return { original: originalHeader, canonical, confidence: "synonym" };
  }

  return {
    original: originalHeader,
    canonical: normalized || "COLUMNA_SIN_NOMBRE",
    confidence: "derived"
  };
}

export function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value).replace(/\s+/g, " ").trim();
}

export function isDateField(field: string): boolean {
  return field.startsWith("FECHA_") || field.includes("_FECHA") || field === "FECPPOSTEO";
}

export function isBlank(value: string | undefined): boolean {
  return !value || value.trim() === "";
}

export function valuesConflict(existing: string, incoming: string): boolean {
  if (isBlank(existing) || isBlank(incoming)) {
    return false;
  }

  return normalizeComparable(existing) !== normalizeComparable(incoming);
}

function normalizeComparable(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
}
