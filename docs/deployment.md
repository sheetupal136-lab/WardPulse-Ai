# WardPulse AI — Production Deployment Guide (Vercel & Render)

This guide documents the full deployment configuration for **WardPulse AI**:
- **Frontend:** Hosted on [Vercel](https://vercel.com/) (React 19 + Vite + Tailwind v4)
- **Backend:** Hosted on [Render](https://render.com/) (Python FastAPI + Uvicorn)

---

## 1. Backend Deployment on Render

### Step 1: Create a New Web Service on Render
1. Log in to [dashboard.render.com](https://dashboard.render.com/).
2. Click **New +** &rarr; **Web Service**.
3. Connect your GitHub repository: `https://github.com/sheetupal136-lab/WardPulse-Ai`.

### Step 2: Configure Service Settings
- **Name:** `wardpulse-ai-backend` (or your preferred name)
- **Region:** Any (e.g. Frankfurt, Oregon, Singapore)
- **Branch:** `master`
- **Root Directory:** `backend` *(Critical: Tell Render to run from `backend`)*
- **Runtime:** `Python 3`
- **Build Command:**
  ```bash
  pip install -r requirements.txt
  ```
- **Start Command:**
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```

### Step 3: Environment Variables on Render
Add the following under **Environment Variables**:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.12.0` | Recommended Python runtime |
| `CORS_ORIGINS` | `https://your-app.vercel.app,http://localhost:5173` | Comma-separated list of allowed frontend domains |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Production frontend domain |
| `PORT` | `8000` | Port bound by Uvicorn (Render sets `$PORT` automatically) |

### Step 4: Verify Backend Endpoints
Once deployed, verify your service by opening in browser:
- Health check: `https://<YOUR-RENDER-BACKEND>.onrender.com/api/health`
- Dataset Registry: `https://<YOUR-RENDER-BACKEND>.onrender.com/api/ml/dataset-registry`
- Interactive Swagger Docs: `https://<YOUR-RENDER-BACKEND>.onrender.com/api/docs`

---

## 2. Frontend Deployment on Vercel

### Step 1: Import Project into Vercel
1. Log in to [vercel.com](https://vercel.com/).
2. Click **Add New...** &rarr; **Project**.
3. Select the repository `sheetupal136-lab/WardPulse-Ai`.

### Step 2: Configure Project Settings
- **Framework Preset:** `Vite`
- **Root Directory:** `frontend` *(Click "Edit" and set to `frontend`)*
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### Step 3: Configure Environment Variables (CRITICAL)
Under **Environment Variables**, add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://<YOUR-RENDER-BACKEND>.onrender.com/api` | **Must include `/api` without trailing slash.** This directs frontend API calls to Render instead of failing with `FUNCTION_INVOCATION_FAILED` on Vercel. |

### Step 4: Deploy & Verify
Click **Deploy**.
1. Open the deployed Vercel URL (e.g., `https://wardpulse-ai.vercel.app`).
2. The Top Navbar will ping the backend: status should show **Connected (200 OK)**.
3. Click **Load Hackathon Dataset**: it will load all 156 wards and 42 features without 500 error.
4. Click **Load Ward Features (Analysis Mode)**: loads demographic infrastructure metrics.
5. In the **Map View**: GeoJSON boundaries for all 198 wards will render smoothly.

---

## 3. Why `FUNCTION_INVOCATION_FAILED (500)` Happened & How It's Solved

### The Problem
When `VITE_API_BASE_URL` was not configured in Vercel settings, the frontend defaulted to relative `/api`. Vercel intercepted calls like `/api/ml/load-hackathon` as Vercel Serverless Functions. Since no serverless functions were defined, Vercel returned `500: FUNCTION_INVOCATION_FAILED`.

### The Fix
1. **Explicit API Routing:** In `frontend/src/api/client.ts`, all calls explicitly use `getApiBaseUrl()`, clean up any trailing slashes, and route directly to Render in production.
2. **Descriptive Diagnostics:** If relative `/api` is ever reached in production, `client.ts` intercepts `FUNCTION_INVOCATION_FAILED` and tells the developer exactly how to configure `VITE_API_BASE_URL`.
3. **CORS Permitted:** Render's `backend/app/core/config.py` now parses `CORS_ORIGINS` and matches `https://*.vercel.app` dynamically via `CORS_ORIGIN_REGEX`.
4. **Bundled Datasets:** Authentic hackathon datasets are whitelisted in `.gitignore` and included in `backend/data/` so Render has all files immediately accessible.
