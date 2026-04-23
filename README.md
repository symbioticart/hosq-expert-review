# HOSQ Expert Review

Web app for expert evaluation of 5 HOSQ projects across 10 metric vectors.

- **Frontend:** React + Vite + TypeScript + Tailwind
- **Backend:** Node + Express + better-sqlite3
- **Deploy:** Render.com (single web service, persistent disk for SQLite)

## Local dev

```bash
npm install
npm run dev
# client → http://localhost:5173, server → http://localhost:8080
```

## Production build

```bash
npm run build
NODE_ENV=production DB_PATH=./dev.db PORT=8080 npm run start
# open http://localhost:8080
```

## Data pipeline (run once before deploy)

```bash
cd scripts
pip install -r requirements.txt
python copy_pdfs.py
python seed_metrics.py
python build_meta.py
python extract_ai_evals.py
python build_manifest.py
```

## Deploy

Push to GitHub → connected Render service autodeploys via `render.yaml`.
