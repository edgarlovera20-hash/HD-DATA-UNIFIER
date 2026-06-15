import { randomUUID } from "crypto";
import { isBlank, MASTER_FIELDS, valuesConflict } from "./columnRules.js";
import { todayDDMMYYYY } from "./dateUtils.js";
import type { MergeConflict, MergeLog, MergeResult, ParsedRow, ParsedWorkbook } from "../types.js";

interface WorkingRecord {
  values: Record<string, string>;
  sources: Record<string, string>;
  updatedFields: Set<string>;
}

export interface MergeOptions {
  baseFileId?: string;
  generatedAt?: Date;
}

export function mergeWorkbooks(workbooks: ParsedWorkbook[], options: MergeOptions = {}): MergeResult {
  if (workbooks.length === 0) {
    throw new Error("No hay archivos para unificar.");
  }

  const baseWorkbook = resolveBaseWorkbook(workbooks, options.baseFileId);
  const generatedAt = options.generatedAt ?? new Date();
  const generatedAtText = todayDDMMYYYY(generatedAt);
  const jobId = randomUUID();

  const orderedWorkbooks = [
    baseWorkbook,
    ...workbooks.filter((workbook) => workbook.file.id !== baseWorkbook.file.id)
  ];

  const master = new Map<string, WorkingRecord>();
  const logs: MergeLog[] = [];
  const conflicts: MergeConflict[] = [];
  const duplicateRows: Array<Record<string, string>> = [];
  const newRows: Array<Record<string, string>> = [];
  const updatedFolios = new Set<string>();
  const seenInputRows = new Set<string>();

  for (const workbook of orderedWorkbooks) {
    for (const row of workbook.rows) {
      const folio = normalizeFolio(row.normalized.FOLIO_SIAC);
      if (!folio) {
        continue;
      }

      const inputKey = `${row.fileId}:${folio}`;
      if (seenInputRows.has(inputKey)) {
        duplicateRows.push(rowToAuditRow(row, "DUPLICADO_EN_ARCHIVO"));
      }
      seenInputRows.add(inputKey);

      if (!master.has(folio)) {
        const record = createRecord(row, generatedAtText);
        master.set(folio, record);
        if (row.fileId !== baseWorkbook.file.id) {
          newRows.push(record.values);
        }
        continue;
      }

      const record = master.get(folio)!;
      applyRowToRecord(record, row, conflicts, logs, generatedAtText);

      if (record.updatedFields.size > 0 && row.fileId !== baseWorkbook.file.id) {
        updatedFolios.add(folio);
      }
    }
  }

  const baseRows = Array.from(master.values()).map((record) => normalizeMasterRow(record.values));
  const updatedRows = baseRows.filter((row) => updatedFolios.has(row.FOLIO_SIAC ?? ""));
  const reviewRows = conflicts.map((conflict) => ({
    FOLIO_SIAC: conflict.folioSiac,
    CAMPO: conflict.field,
    VALOR_BASE: conflict.existingValue,
    VALOR_ENTRANTE: conflict.incomingValue,
    ARCHIVO_ENTRANTE: conflict.fileName,
    HOJA: conflict.sheetName,
    FILA: String(conflict.rowNumber),
    ACCION_REQUERIDA: "REVISION_MANUAL"
  }));
  const morosidadRows = baseRows.filter((row) => {
    const moroso = (row.MOROSO ?? "").toUpperCase();
    return moroso === "SI" || moroso === "SÍ" || !isBlank(row.MONTO_MOROSIDAD);
  });

  return {
    jobId,
    baseFileId: baseWorkbook.file.id,
    baseFileName: baseWorkbook.file.originalName,
    generatedAt: generatedAt.toISOString(),
    baseRows,
    newRows: newRows.map(normalizeMasterRow),
    updatedRows,
    duplicateRows,
    conflicts,
    reviewRows,
    logs,
    morosidadRows,
    summary: {
      archivos_procesados: workbooks.length,
      registros_finales: baseRows.length,
      registros_nuevos: newRows.length,
      registros_actualizados: updatedRows.length,
      duplicados: duplicateRows.length,
      conflictos: conflicts.length,
      base_principal: baseWorkbook.file.originalName,
      agente: "Agente Archivista y Unificador de Datos"
    }
  };
}

function resolveBaseWorkbook(workbooks: ParsedWorkbook[], requestedBaseFileId?: string): ParsedWorkbook {
  if (requestedBaseFileId) {
    const requested = workbooks.find((workbook) => workbook.file.id === requestedBaseFileId);
    if (!requested) {
      throw new Error("El archivo base seleccionado no existe en la carga.");
    }
    return requested;
  }

  return [...workbooks].sort((left, right) => scoreWorkbook(right) - scoreWorkbook(left))[0];
}

function scoreWorkbook(workbook: ParsedWorkbook): number {
  const folioRows = workbook.rows.filter((row) => !isBlank(row.normalized.FOLIO_SIAC)).length;
  const columnCount = new Set(workbook.sheets.flatMap((sheet) => sheet.columns.map((column) => column.canonical))).size;
  return folioRows * 10 + columnCount;
}

function createRecord(row: ParsedRow, generatedAtText: string): WorkingRecord {
  const values: Record<string, string> = {};
  const sources: Record<string, string> = {};

  for (const [field, value] of Object.entries(row.normalized)) {
    values[field] = value;
    sources[field] = row.fileName;
  }

  values.FOLIO_SIAC = normalizeFolio(row.normalized.FOLIO_SIAC);
  values.ARCHIVO_ORIGEN = row.fileName;
  values.ULTIMA_ACTUALIZACION = generatedAtText;
  values.CONFLICTO_DATOS = "";

  return {
    values,
    sources,
    updatedFields: new Set()
  };
}

function applyRowToRecord(
  record: WorkingRecord,
  row: ParsedRow,
  conflicts: MergeConflict[],
  logs: MergeLog[],
  generatedAtText: string
) {
  for (const [field, incomingValue] of Object.entries(row.normalized)) {
    if (field === "FOLIO_SIAC" || isBlank(incomingValue)) {
      continue;
    }

    const existingValue = record.values[field] ?? "";
    if (isBlank(existingValue)) {
      record.values[field] = incomingValue;
      record.sources[field] = row.fileName;
      record.values.ULTIMA_ACTUALIZACION = generatedAtText;
      record.updatedFields.add(field);
      logs.push({
        folioSiac: record.values.FOLIO_SIAC,
        campoModificado: field,
        valorAnterior: "",
        valorNuevo: incomingValue,
        archivoOrigen: row.fileName,
        fechaDeCarga: generatedAtText
      });
      continue;
    }

    if (valuesConflict(existingValue, incomingValue)) {
      record.values.CONFLICTO_DATOS = "SI";
      conflicts.push({
        folioSiac: record.values.FOLIO_SIAC,
        field,
        existingValue,
        incomingValue,
        existingSource: record.sources[field] ?? record.values.ARCHIVO_ORIGEN,
        incomingSource: row.fileName,
        fileName: row.fileName,
        sheetName: row.sheetName,
        rowNumber: row.rowNumber
      });
    }
  }
}

function normalizeMasterRow(row: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const field of MASTER_FIELDS) {
    normalized[field] = row[field] ?? "";
  }

  const extraFields = Object.keys(row)
    .filter((field) => !MASTER_FIELDS.includes(field))
    .sort();

  for (const field of extraFields) {
    normalized[field] = row[field] ?? "";
  }

  return normalized;
}

function rowToAuditRow(row: ParsedRow, reason: string): Record<string, string> {
  return {
    MOTIVO: reason,
    FOLIO_SIAC: normalizeFolio(row.normalized.FOLIO_SIAC),
    ARCHIVO_ORIGEN: row.fileName,
    HOJA: row.sheetName,
    FILA: String(row.rowNumber)
  };
}

function normalizeFolio(value: string | undefined): string {
  return (value ?? "").trim().toUpperCase();
}

