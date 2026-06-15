import React from "react";
import ReactDOM from "react-dom/client";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  History,
  Loader2,
  Play,
  UploadCloud
} from "lucide-react";
import "./index.css";

interface UploadedFileRecord {
  id: string;
  originalName: string;
  size: number;
  uploadedAt: string;
}

interface PreviewItem {
  fileId: string;
  fileName: string;
  sheets: Array<{
    name: string;
    rowCount: number;
    columns: Array<{
      original: string;
      canonical: string;
      confidence: string;
    }>;
  }>;
  sampleRows: Array<Record<string, string>>;
}

interface MergeResponse {
  jobId: string;
  summary: Record<string, string | number>;
  downloads: {
    xlsx: string;
    csv: string;
  };
  conflicts: Array<Record<string, unknown>>;
  logs: Array<Record<string, unknown>>;
}

interface HistoryResponse {
  files: UploadedFileRecord[];
  jobs: Array<{
    id: string;
    createdAt: string;
    status: string;
    summary: Record<string, string | number>;
  }>;
}

function App() {
  const [files, setFiles] = React.useState<UploadedFileRecord[]>([]);
  const [preview, setPreview] = React.useState<PreviewItem[]>([]);
  const [history, setHistory] = React.useState<HistoryResponse>({ files: [], jobs: [] });
  const [baseFileId, setBaseFileId] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [isMerging, setIsMerging] = React.useState(false);
  const [mergeResult, setMergeResult] = React.useState<MergeResponse | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    void refreshHistory();
  }, []);

  async function refreshHistory() {
    const response = await fetch("/api/data-unifier/history");
    if (response.ok) {
      setHistory(await response.json());
    }
  }

  async function uploadSelectedFiles(selectedFiles: FileList | null) {
    if (!selectedFiles?.length) {
      return;
    }

    setError("");
    setIsUploading(true);
    setMergeResult(null);

    try {
      const formData = new FormData();
      Array.from(selectedFiles).forEach((file) => formData.append("files", file));
      const response = await fetch("/api/data-unifier/upload", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo subir la carga.");
      }

      setFiles(payload.files);
      setPreview(payload.preview);
      setBaseFileId(payload.files[0]?.id ?? "");
      await refreshHistory();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo procesar la carga.");
    } finally {
      setIsUploading(false);
    }
  }

  async function mergeFiles() {
    if (files.length === 0) {
      setError("Carga al menos un archivo.");
      return;
    }

    setError("");
    setIsMerging(true);

    try {
      const response = await fetch("/api/data-unifier/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileIds: files.map((file) => file.id),
          baseFileId: baseFileId || undefined
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo unificar.");
      }

      setMergeResult(payload);
      await refreshHistory();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo unificar.");
    } finally {
      setIsMerging(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Archive size={20} />
          </div>
          <div>
            <strong>HD DATA</strong>
            <span>UNIFIER</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Data Unifier">
          <button className="nav-item active" type="button">
            <UploadCloud size={17} />
            Nueva unificación
          </button>
          <button className="nav-item" type="button">
            <History size={17} />
            Historial
          </button>
          <button className="nav-item" type="button">
            <Database size={17} />
            Bases maestras
          </button>
          <button className="nav-item" type="button">
            <AlertTriangle size={17} />
            Conflictos
          </button>
        </nav>

        <div className="agent-panel">
          <span>Agente activo</span>
          <strong>Archivista y Unificador</strong>
          <p>{files.length} archivos en la carga actual</p>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Datos / Unificador de Archivos</p>
            <h1>Base maestra SIAC</h1>
          </div>
          <button className="icon-button" type="button" onClick={() => void refreshHistory()} title="Actualizar historial">
            <History size={18} />
          </button>
        </header>

        {error ? <div className="error-banner">{error}</div> : null}

        <section className="control-grid">
          <div className="upload-panel">
            <label className="upload-target">
              <UploadCloud size={30} />
              <span>Subir XLSX o CSV</span>
              <input
                type="file"
                accept=".xlsx,.csv"
                multiple
                onChange={(event) => void uploadSelectedFiles(event.target.files)}
              />
            </label>
            <div className="upload-actions">
              <select value={baseFileId} onChange={(event) => setBaseFileId(event.target.value)}>
                <option value="">Base automática</option>
                {files.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.originalName}
                  </option>
                ))}
              </select>
              <button className="primary-button" type="button" onClick={() => void mergeFiles()} disabled={isUploading || isMerging || files.length === 0}>
                {isMerging ? <Loader2 size={17} className="spin" /> : <Play size={17} />}
                Unificar archivos
              </button>
            </div>
          </div>

          <div className="metric-strip">
            <Metric icon={<FileSpreadsheet size={20} />} label="Archivos" value={String(files.length)} />
            <Metric icon={<Database size={20} />} label="Columnas" value={String(countDetectedColumns(preview))} />
            <Metric icon={<AlertTriangle size={20} />} label="Conflictos" value={String(mergeResult?.summary.conflictos ?? 0)} />
          </div>
        </section>

        <section className="main-grid">
          <div className="panel wide">
            <div className="panel-header">
              <h2>Archivos cargados</h2>
              {isUploading ? <span className="status-pill"><Loader2 size={14} className="spin" /> Analizando</span> : null}
            </div>
            <div className="file-list">
              {files.length === 0 ? (
                <EmptyState label="Sin archivos en la carga actual" />
              ) : (
                files.map((file) => (
                  <div className="file-row" key={file.id}>
                    <FileSpreadsheet size={18} />
                    <span>{file.originalName}</span>
                    <small>{formatBytes(file.size)}</small>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Resultado</h2>
              {mergeResult ? <CheckCircle2 size={18} className="ok" /> : null}
            </div>
            {mergeResult ? (
              <div className="result-stack">
                <SummaryGrid summary={mergeResult.summary} />
                <div className="download-row">
                  <a className="secondary-button" href={mergeResult.downloads.xlsx}>
                    <Download size={16} />
                    Excel
                  </a>
                  <a className="secondary-button" href={mergeResult.downloads.csv}>
                    <Download size={16} />
                    CSV
                  </a>
                </div>
              </div>
            ) : (
              <EmptyState label="Sin unificación ejecutada" />
            )}
          </div>

          <div className="panel wide">
            <div className="panel-header">
              <h2>Columnas detectadas</h2>
            </div>
            <div className="preview-table">
              {preview.length === 0 ? (
                <EmptyState label="Sin vista previa" />
              ) : (
                preview.flatMap((item) =>
                  item.sheets.flatMap((sheet) =>
                    sheet.columns.slice(0, 12).map((column) => (
                      <div className="preview-row" key={`${item.fileId}-${sheet.name}-${column.original}`}>
                        <span>{item.fileName}</span>
                        <strong>{column.original}</strong>
                        <code>{column.canonical}</code>
                      </div>
                    ))
                  )
                )
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Historial</h2>
            </div>
            <div className="history-list">
              {history.jobs.length === 0 ? (
                <EmptyState label="Sin ejecuciones" />
              ) : (
                history.jobs.slice(0, 6).map((job) => (
                  <div className="history-row" key={job.id}>
                    <strong>{String(job.summary.registros_finales ?? 0)} registros</strong>
                    <span>{new Date(job.createdAt).toLocaleString("es-MX")}</span>
                    <a href={`/api/data-unifier/download/${job.id}?format=xlsx`}>Excel</a>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="metric">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="empty-state">{label}</div>;
}

function SummaryGrid({ summary }: { summary: Record<string, string | number> }) {
  const items = [
    ["Finales", summary.registros_finales],
    ["Nuevos", summary.registros_nuevos],
    ["Actualizados", summary.registros_actualizados],
    ["Duplicados", summary.duplicados]
  ];

  return (
    <div className="summary-grid">
      {items.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{String(value ?? 0)}</strong>
        </div>
      ))}
    </div>
  );
}

function countDetectedColumns(preview: PreviewItem[]): number {
  return new Set(preview.flatMap((item) => item.sheets.flatMap((sheet) => sheet.columns.map((column) => column.canonical)))).size;
}

function formatBytes(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
