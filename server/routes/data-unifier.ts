import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import express from "express";
import multer from "multer";
import { z } from "zod";
import { exportMergeResult } from "../data-unifier/excelExporter.js";
import { parseWorkbook } from "../data-unifier/fileReader.js";
import { JobStore } from "../data-unifier/jobStore.js";
import { mergeWorkbooks } from "../data-unifier/mergeEngine.js";
import { runArchivistaAgent } from "../agents/archivista-agent.js";
import type { UploadedFileRecord } from "../types.js";

const mergeRequestSchema = z.object({
  fileIds: z.array(z.string()).min(1),
  baseFileId: z.string().optional()
});

const previewRequestSchema = z.object({
  fileIds: z.array(z.string()).min(1)
});

export function createDataUnifierRouter(store: JobStore) {
  const router = express.Router();
  const maxUploadMb = Number(process.env.MAX_UPLOAD_MB ?? 25);

  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, callback) => callback(null, store.uploadsDir),
      filename: (_req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        callback(null, `${randomUUID()}${extension}`);
      }
    }),
    limits: {
      fileSize: maxUploadMb * 1024 * 1024,
      files: 12
    },
    fileFilter: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      if (![".xlsx", ".csv"].includes(extension)) {
        callback(new Error("Tipo de archivo no permitido. Solo XLSX o CSV."));
        return;
      }
      callback(null, true);
    }
  });

  router.post("/upload", upload.array("files"), async (req, res, next) => {
    try {
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      const records: UploadedFileRecord[] = files.map((file) => ({
        id: randomUUID(),
        originalName: file.originalname,
        storedName: file.filename,
        path: file.path,
        extension: path.extname(file.originalname).toLowerCase(),
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date().toISOString()
      }));

      store.saveUploadedFiles(records);
      const workbooks = await Promise.all(records.map(parseWorkbook));
      res.json({
        files: records,
        preview: buildPreview(workbooks),
        agentReport: runArchivistaAgent(workbooks)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/preview", async (req, res, next) => {
    try {
      const request = previewRequestSchema.parse(req.body);
      const workbooks = await Promise.all(store.getFiles(request.fileIds).map(parseWorkbook));
      res.json({
        preview: buildPreview(workbooks),
        agentReport: runArchivistaAgent(workbooks)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/merge", async (req, res, next) => {
    try {
      const request = mergeRequestSchema.parse(req.body);
      const files = store.getFiles(request.fileIds);
      const workbooks = await Promise.all(files.map(parseWorkbook));
      const result = mergeWorkbooks(workbooks, { baseFileId: request.baseFileId });
      const exports = await exportMergeResult(result, store.resultsDir);

      store.saveJob({
        id: result.jobId,
        createdAt: result.generatedAt,
        fileIds: request.fileIds,
        baseFileId: result.baseFileId,
        status: "completed",
        summary: result.summary,
        resultXlsxPath: exports.xlsxPath,
        resultCsvPath: exports.csvPath
      });

      res.json({
        jobId: result.jobId,
        summary: result.summary,
        downloads: {
          xlsx: `/api/data-unifier/download/${result.jobId}?format=xlsx`,
          csv: `/api/data-unifier/download/${result.jobId}?format=csv`
        },
        report: `/api/data-unifier/report/${result.jobId}`,
        conflicts: result.conflicts.slice(0, 25),
        logs: result.logs.slice(0, 25)
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/history", (_req, res) => {
    res.json({
      files: store.listFiles().slice(0, 50),
      jobs: store.listJobs().slice(0, 50)
    });
  });

  router.get("/download/:id", (req, res, next) => {
    try {
      const job = store.getJob(req.params.id);
      if (!job) {
        res.status(404).json({ error: "Trabajo no encontrado." });
        return;
      }

      const format = req.query.format === "csv" ? "csv" : "xlsx";
      const filePath = format === "csv" ? job.resultCsvPath : job.resultXlsxPath;
      if (!filePath || !fs.existsSync(filePath)) {
        res.status(404).json({ error: "Archivo generado no encontrado." });
        return;
      }

      res.download(filePath);
    } catch (error) {
      next(error);
    }
  });

  router.get("/report/:id", (req, res) => {
    const job = store.getJob(req.params.id);
    if (!job) {
      res.status(404).json({ error: "Trabajo no encontrado." });
      return;
    }

    res.json(job);
  });

  return router;
}

function buildPreview(workbooks: Awaited<ReturnType<typeof parseWorkbook>>[]) {
  return workbooks.map((workbook) => ({
    fileId: workbook.file.id,
    fileName: workbook.file.originalName,
    sheets: workbook.sheets,
    sampleRows: workbook.previewRows.map((row) => row.normalized)
  }));
}
