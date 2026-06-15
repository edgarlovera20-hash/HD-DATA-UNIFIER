import fs from "fs";
import path from "path";
import type { MergeJobRecord, UploadedFileRecord } from "../types.js";

interface StoreShape {
  uploadedFiles: UploadedFileRecord[];
  mergeJobs: MergeJobRecord[];
}

const emptyStore: StoreShape = {
  uploadedFiles: [],
  mergeJobs: []
};

export class JobStore {
  readonly rootDir: string;
  readonly uploadsDir: string;
  readonly resultsDir: string;
  private readonly storePath: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.uploadsDir = path.join(rootDir, "uploads");
    this.resultsDir = path.join(rootDir, "results");
    this.storePath = path.join(rootDir, "history.json");
    fs.mkdirSync(this.uploadsDir, { recursive: true });
    fs.mkdirSync(this.resultsDir, { recursive: true });
    if (!fs.existsSync(this.storePath)) {
      this.write(emptyStore);
    }
  }

  listFiles(): UploadedFileRecord[] {
    return this.read().uploadedFiles;
  }

  getFiles(fileIds: string[]): UploadedFileRecord[] {
    const files = this.listFiles();
    return fileIds.map((fileId) => {
      const file = files.find((candidate) => candidate.id === fileId);
      if (!file) {
        throw new Error(`Archivo no encontrado: ${fileId}`);
      }
      return file;
    });
  }

  saveUploadedFiles(files: UploadedFileRecord[]) {
    const store = this.read();
    store.uploadedFiles.unshift(...files);
    this.write(store);
  }

  saveJob(job: MergeJobRecord) {
    const store = this.read();
    store.mergeJobs.unshift(job);
    this.write(store);
  }

  getJob(jobId: string): MergeJobRecord | undefined {
    return this.read().mergeJobs.find((job) => job.id === jobId);
  }

  listJobs(): MergeJobRecord[] {
    return this.read().mergeJobs;
  }

  private read(): StoreShape {
    try {
      return JSON.parse(fs.readFileSync(this.storePath, "utf8")) as StoreShape;
    } catch {
      return emptyStore;
    }
  }

  private write(store: StoreShape) {
    fs.mkdirSync(this.rootDir, { recursive: true });
    fs.writeFileSync(this.storePath, JSON.stringify(store, null, 2), "utf8");
  }
}

