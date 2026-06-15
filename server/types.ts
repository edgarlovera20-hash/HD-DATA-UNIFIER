export type CellValue = string | number | boolean | Date | null | undefined;

export interface UploadedFileRecord {
  id: string;
  originalName: string;
  storedName: string;
  path: string;
  extension: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface DetectedColumn {
  original: string;
  canonical: string;
  confidence: "exact" | "synonym" | "derived";
}

export interface ParsedRow {
  fileId: string;
  fileName: string;
  sheetName: string;
  rowNumber: number;
  normalized: Record<string, string>;
  sourceColumns: Record<string, string>;
}

export interface ParsedWorkbook {
  file: UploadedFileRecord;
  rows: ParsedRow[];
  sheets: Array<{
    name: string;
    rowCount: number;
    columns: DetectedColumn[];
  }>;
  previewRows: ParsedRow[];
}

export interface MergeConflict {
  folioSiac: string;
  field: string;
  existingValue: string;
  incomingValue: string;
  existingSource: string;
  incomingSource: string;
  fileName: string;
  sheetName: string;
  rowNumber: number;
}

export interface MergeLog {
  folioSiac: string;
  campoModificado: string;
  valorAnterior: string;
  valorNuevo: string;
  archivoOrigen: string;
  fechaDeCarga: string;
}

export interface MergeResult {
  jobId: string;
  baseFileId: string;
  baseFileName: string;
  generatedAt: string;
  baseRows: Array<Record<string, string>>;
  newRows: Array<Record<string, string>>;
  updatedRows: Array<Record<string, string>>;
  duplicateRows: Array<Record<string, string>>;
  conflicts: MergeConflict[];
  reviewRows: Array<Record<string, string>>;
  logs: MergeLog[];
  summary: Record<string, string | number>;
  morosidadRows: Array<Record<string, string>>;
}

export interface MergeJobRecord {
  id: string;
  createdAt: string;
  fileIds: string[];
  baseFileId: string;
  status: "completed" | "failed";
  summary: Record<string, string | number>;
  resultXlsxPath?: string;
  resultCsvPath?: string;
  error?: string;
}

