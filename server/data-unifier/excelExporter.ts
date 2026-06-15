import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import type { MergeResult } from "../types.js";

export interface ExportPaths {
  xlsxPath: string;
  csvPath: string;
}

export async function exportMergeResult(result: MergeResult, outputDir: string): Promise<ExportPaths> {
  fs.mkdirSync(outputDir, { recursive: true });

  const xlsxPath = path.join(outputDir, `BASE_UNIFICADA_HEAVENLY_DREAMS_${result.jobId}.xlsx`);
  const csvPath = path.join(outputDir, `BASE_UNIFICADA_HEAVENLY_DREAMS_${result.jobId}.csv`);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "HD-DATA-UNIFIER";
  workbook.created = new Date(result.generatedAt);

  addSheet(workbook, "BASE_UNIFICADA", result.baseRows);
  addSheet(workbook, "REGISTROS_NUEVOS", result.newRows);
  addSheet(workbook, "REGISTROS_ACTUALIZADOS", result.updatedRows);
  addSheet(workbook, "DUPLICADOS", result.duplicateRows);
  addSheet(workbook, "CONFLICTOS", result.conflicts.map((conflict) => ({
    FOLIO_SIAC: conflict.folioSiac,
    CAMPO: conflict.field,
    VALOR_EXISTENTE: conflict.existingValue,
    VALOR_ENTRANTE: conflict.incomingValue,
    FUENTE_EXISTENTE: conflict.existingSource,
    FUENTE_ENTRANTE: conflict.incomingSource,
    HOJA: conflict.sheetName,
    FILA: conflict.rowNumber
  })));
  addSheet(workbook, "MOROSIDAD", result.morosidadRows);
  addSheet(workbook, "REVISION_MANUAL", result.reviewRows);
  addSheet(workbook, "LOG_DE_CAMBIOS", result.logs.map((log) => ({
    FOLIO_SIAC: log.folioSiac,
    CAMPO_MODIFICADO: log.campoModificado,
    VALOR_ANTERIOR: log.valorAnterior,
    VALOR_NUEVO: log.valorNuevo,
    ARCHIVO_ORIGEN: log.archivoOrigen,
    FECHA_DE_CARGA: log.fechaDeCarga
  })));
  addSheet(workbook, "RESUMEN", Object.entries(result.summary).map(([metric, value]) => ({
    METRICA: metric,
    VALOR: value
  })));

  await workbook.xlsx.writeFile(xlsxPath);
  fs.writeFileSync(csvPath, rowsToCsv(result.baseRows), "utf8");

  return { xlsxPath, csvPath };
}

function addSheet(workbook: ExcelJS.Workbook, name: string, rows: Array<Record<string, unknown>>) {
  const safeRows = rows.length > 0 ? rows : [{ ESTADO: "SIN_REGISTROS" }];
  const columns = Array.from(new Set(safeRows.flatMap((row) => Object.keys(row))));
  const sheet = workbook.addWorksheet(name);

  sheet.columns = columns.map((column) => ({
    header: column,
    key: column,
    width: Math.min(Math.max(column.length + 4, 14), 36)
  }));
  sheet.addRows(safeRows);
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { vertical: "middle" };
}

function rowsToCsv(rows: Array<Record<string, string>>): string {
  if (rows.length === 0) {
    return "";
  }

  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const lines = [columns.map(escapeCsv).join(",")];
  for (const row of rows) {
    lines.push(columns.map((column) => escapeCsv(row[column] ?? "")).join(","));
  }

  return `${lines.join("\n")}\n`;
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }

  return value;
}

