import test from "node:test";
import assert from "node:assert/strict";
import { mergeWorkbooks } from "../server/data-unifier/mergeEngine.js";
import type { ParsedWorkbook } from "../server/types.js";

test("mergeWorkbooks completa campos vacios y marca conflictos sin sobrescribir", () => {
  const workbooks: ParsedWorkbook[] = [
    workbook("base", "BASE.xlsx", [
      { FOLIO_SIAC: "A1", NOMBRE: "Edgar", TELEFONO: "", FECHA_POSTEO: "01/06/2026" }
    ]),
    workbook("pagos", "PAGOS.xlsx", [
      { FOLIO_SIAC: "A1", TELEFONO: "5555", FECHA_POSTEO: "02/06/2026" },
      { FOLIO_SIAC: "B2", NOMBRE: "Nuevo", TELEFONO: "7777" }
    ])
  ];

  const result = mergeWorkbooks(workbooks, {
    baseFileId: "base",
    generatedAt: new Date("2026-06-14T12:00:00Z")
  });

  const a1 = result.baseRows.find((row) => row.FOLIO_SIAC === "A1");
  assert.equal(a1?.TELEFONO, "5555");
  assert.equal(a1?.FECHA_POSTEO, "01/06/2026");
  assert.equal(a1?.CONFLICTO_DATOS, "SI");
  assert.equal(result.conflicts.length, 1);
  assert.equal(result.newRows.length, 1);
  assert.equal(result.updatedRows.length, 1);
  assert.equal(result.logs[0].campoModificado, "TELEFONO");
});

function workbook(id: string, originalName: string, rows: Array<Record<string, string>>): ParsedWorkbook {
  return {
    file: {
      id,
      originalName,
      storedName: originalName,
      path: originalName,
      extension: ".xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: 1,
      uploadedAt: "2026-06-14T00:00:00.000Z"
    },
    sheets: [
      {
        name: "Hoja1",
        rowCount: rows.length,
        columns: Object.keys(rows[0] ?? {}).map((column) => ({
          original: column,
          canonical: column,
          confidence: "exact" as const
        }))
      }
    ],
    previewRows: [],
    rows: rows.map((row, index) => ({
      fileId: id,
      fileName: originalName,
      sheetName: "Hoja1",
      rowNumber: index + 2,
      normalized: row,
      sourceColumns: Object.fromEntries(Object.keys(row).map((column) => [column, column]))
    }))
  };
}

