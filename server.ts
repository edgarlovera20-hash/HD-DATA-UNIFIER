import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createDataUnifierRouter } from "./server/routes/data-unifier.js";
import { JobStore } from "./server/data-unifier/jobStore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT ?? 3010);
const isDev = process.env.NODE_ENV !== "production";
const storageRoot = path.resolve(process.cwd(), process.env.DATA_UNIFIER_STORAGE ?? "data");
const store = new JobStore(storageRoot);

app.use(express.json({ limit: "2mb" }));
app.use("/api/data-unifier", createDataUnifierRouter(store));

app.get("/api/ping", (_req, res) => {
  res.json({ ok: true, service: "HD-DATA-UNIFIER", ts: new Date().toISOString() });
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "HD-DATA-UNIFIER",
    storageRoot,
    timestamp: new Date().toISOString()
  });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Error interno del servidor.";
  res.status(400).json({ error: message });
});

async function startServer() {
  if (!isDev) {
    const clientDist = path.join(__dirname, "client");
    app.use(express.static(clientDist));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { port: 24710 } },
      appType: "spa",
      base: "/",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`HD-DATA-UNIFIER running on http://localhost:${PORT}`);
  });
}

startServer();

export default app;

