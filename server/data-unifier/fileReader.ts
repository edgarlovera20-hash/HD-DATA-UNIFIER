import ExcelJS from "exceljs";
import { detectColumn, isDateField, normalizeCell } from "./columnRules.js";
import { formatDateToDDMMYYYY } from "./dateUtils.js";
import type { DetectedColumn, ParsedRow, ParsedWorkbook, UploadedFileRecord } from "../types.js";

export async function parseWorkbook(file: UploadedFileRecord): Promise<ParsedWorkbook> {
  const workbook = new ExcelJS.Workbook();

  if (file.extension === ".csv") {
    await workbook.csv.readFile(file.path);
  } else {
    await workbook.xlsx.readFile(file.path);
  }

  const rows: ParsedRow[] = [];
  const sheets: ParsedWorkbook["sheets"] = [];

  workbook.eachSheet((sheet) => {
    const rawRows = worksheetToObjects(sheet);
    const columnMap = buildColumnMap(rawRows);

    for (const [rowIndex, rawRow] of rawRows.entries()) {
      const normalized: Record<string, string> = {};
      const sourceColumns: Record<string, string> = {};

      for (const [originalColumn, value] of Object.entries(rawRow)) {
        const detected = columnMap.get(originalColumn) ?? detectColumn(originalColumn);
        const clean = normalizeCell(value);
        normalized[detected.canonical] = isDateField(detected.canonical)
          ? formatDateToDDMMYYYY(clean)
          : clean;
        sourceColumns[detected.canonical] = originalColumn;
      }

      rows.push({
        fileId: file.id,
        fileName: file.originalName,
        sheetName: sheet.name,
        rowNumber: rowIndex + 2,
        normalized,
        sourceColumns
      });
    }

    sheets.push({
      name: sheet.name,
      rowCount: rawRows.length,
      columns: Array.from(columnMap.values())
    });
  });

  return {
    file,
    rows,
    sheets,
    previewRows: rows.slice(0, 10)
  };
}

function worksheetToObjects(sheet: ExcelJS.Worksheet): Array<Record<string, unknown>> {
  const headerRow = sheet.getRow(1);
  const headers: string[] = [];

  headerRow.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    headers[columnNumber] = normalizeCell(readCellValue(cell));
  });

  const rows: Array<Record<string, unknown>> = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const output: Record<string, unknown> = {};
    for (const [columnNumberText, header] of Object.entries(headers)) {
      if (!header) {
        continue;
      }
      output[header] = readCellValue(row.getCell(Number(columnNumberText)));
    }
    rows.push(output);
  });

  return rows;
}

function readCellValue(cell: ExcelJS.Cell): unknown {
  const value = cell.value;

  if (value && typeof value === "object" && "text" in value) {
    return value.text;
  }

  if (value && typeof value === "object" && "result" in value) {
    return value.result;
  }

  if (value && typeof value === "object" && "richText" in value) {
    return value.richText.map((part: { text: string }) => part.text).join("");
  }

  return value;
}

function buildColumnMap(rows: Array<Record<string, unknown>>): Map<string, DetectedColumn> {
  const headers = new Set<string>();
  for (const row of rows.slice(0, 50)) {
    for (const header of Object.keys(row)) {
      headers.add(header);
    }
  }

  const columnMap = new Map<string, DetectedColumn>();
  for (const header of headers) {
    columnMap.set(header, detectColumn(header));
  }

  return columnMap;
}

