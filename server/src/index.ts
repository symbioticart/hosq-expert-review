import express from "express";
import cors from "cors";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { api } from "./routes.js";

const PORT = Number(process.env.PORT) || 8080;
const ROOT = process.cwd();
const DATA_DIR = resolve(ROOT, "data");
const CLIENT_DIST = resolve(ROOT, "client/dist");

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(cors({ origin: true, credentials: true }));

app.use((req, _res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/data")) {
    console.log(`${new Date().toISOString()}  ${req.method} ${req.path}`);
  }
  next();
});

app.use("/api", api);

app.use("/data", express.static(DATA_DIR, {
  maxAge: "1h",
  setHeaders: (res, path) => {
    if (path.endsWith(".pdf")) res.setHeader("Content-Type", "application/pdf");
  },
}));

if (existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST, { maxAge: "1h", index: false }));
  const indexHtml = resolve(CLIENT_DIST, "index.html");
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/data")) return next();
    res.sendFile(indexHtml);
  });
} else {
  app.get("/", (_req, res) => {
    res.json({
      ok: true,
      note: "client/dist not built — run `npm run build` in expert-review root",
      api: "/api/health",
    });
  });
}

app.listen(PORT, () => {
  console.log(`hosq-expert-review  http://localhost:${PORT}`);
  console.log(`  data dir:    ${DATA_DIR}`);
  console.log(`  client dist: ${CLIENT_DIST} ${existsSync(CLIENT_DIST) ? "(found)" : "(not built)"}`);
});
