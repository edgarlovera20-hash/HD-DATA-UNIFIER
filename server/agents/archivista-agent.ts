import type { ParsedWorkbook } from "../types.js";

export interface ArchivistaAgentReport {
  agentName: "Agente Archivista y Unificador de Datos";
  detectedFiles: number;
  folioCoverage: Array<{
    fileName: string;
    rows: number;
    rowsWithFolioSiac: number;
    unknownColumns: string[];
  }>;
  recommendations: string[];
}

export function runArchivistaAgent(workbooks: ParsedWorkbook[]): ArchivistaAgentReport {
  const folioCoverage = workbooks.map((workbook) => {
    const unknownColumns = Array.from(
      new Set(
        workbook.sheets.flatMap((sheet) =>
          sheet.columns
            .filter((column) => column.confidence === "derived")
            .map((column) => column.original)
        )
      )
    );

    return {
      fileName: workbook.file.originalName,
      rows: workbook.rows.length,
      rowsWithFolioSiac: workbook.rows.filter((row) => row.normalized.FOLIO_SIAC).length,
      unknownColumns
    };
  });

  return {
    agentName: "Agente Archivista y Unificador de Datos",
    detectedFiles: workbooks.length,
    folioCoverage,
    recommendations: buildRecommendations(folioCoverage)
  };
}

function buildRecommendations(report: ArchivistaAgentReport["folioCoverage"]): string[] {
  const recommendations: string[] = [];

  for (const file of report) {
    if (file.rowsWithFolioSiac === 0) {
      recommendations.push(`${file.fileName}: no se detecto FOLIO_SIAC; revisar encabezados antes de unificar.`);
    }
    if (file.unknownColumns.length > 0) {
      recommendations.push(`${file.fileName}: revisar equivalencias para ${file.unknownColumns.slice(0, 5).join(", ")}.`);
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("Columnas principales listas para unificacion.");
  }

  return recommendations;
}

