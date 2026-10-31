# WardPulse AI 🏙️📊
### Civic Complaint Intelligence & Municipal Resource Planning Platform

WardPulse AI is an enterprise-grade municipal intelligence platform designed to forecast citizen complaint demand and optimize inspection resource allocation across urban administrative wards. It features an end-to-end, statistically sound machine learning pipeline combined with an interactive modern dashboard.

---

## 🏛️ End-to-End Machine Learning Workflow

```
1. Upload & Ingestion  ──►  2. Schema Inspection  ──►  3. Target Validation
   (CSV / Excel upload)       (Missing values, types)     (Strictly checks civic demand)
                                                                │
┌───────────────────────────────────────────────────────────────┘
▼
4. Model Training      ──►  5. Spatial Validation  ──►  6. Pipeline Persistence
   (Ridge / RF / GBR)          (Held-out unseen wards)      (`ward_pulse_model.joblib`)
                                                                │
┌───────────────────────────────────────────────────────────────┘
▼
7. Ward Inference      ──►  8. GIS Map Highlight   ──►  9. Resource Planning
   (Real predict API)          (Selected ward vector)       (Empirical quartile roster)
```

1. **Upload Dataset:** Ingests municipal complaint spreadsheets (.csv, .xlsx, .xls) with row preview and data quality inspection.
2. **Inspect & Configure:** Scans for legitimate civic complaint demand columns (`monthly_complaint_demand`, `total_complaints`, `recorded_complaints`). Strictly forbids using administrative identifiers such as `ward_id` as targets.
3. **Train ML Pipeline:** Trains scikit-learn models (`Ridge`, `RandomForestRegressor`, `GradientBoostingRegressor`) using automated preprocessing (`SimpleImputer`, `StandardScaler`).
4. **Evaluate Generalization:** Computes genuine test set metrics ($R^2$, MAE, RMSE) against dummy mean baseline on held-out unseen wards. Zero fabricated reliability scores.
5. **Persist Pipeline:** Serializes the trained pipeline, feature importances, and residual distributions to disk using `joblib`.
6. **Interactive Ward Prediction:** Loads the saved model to run real-time inference with parametric 95% confidence intervals ($\pm 1.96 \cdot \sigma_{\text{residuals}}$) and top driving feature impact explanations.
7. **Map Integration:** Displays actual polygons on MapLibre GL vector tiles and centers/highlights the selected ward upon prediction.
8. **Resource Planner:** Ranks all wards by predicted complaint demand with empirical quartile thresholds (`Critical`, `Elevated`, `Moderate`, `Low`) and specific inspection directives.

---

## 📂 Project Structure

```
WardPulse Ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/
│   │   │   │   ├── health.py        # GET /api/health
│   │   │   │   └── ml.py            # Endpoints: upload, train, predict, ranking
│   │   │   └── router.py            # Root API router
│   │   ├── core/
│   │   │   └── config.py            # App settings and CORS
│   │   ├── schemas/
│   │   │   ├── health.py            # Health check response schemas
│   │   │   └── ml.py                # Comprehensive Pydantic ML schemas
│   │   ├── services/
│   │   │   └── ml_service.py        # Scikit-learn ML pipeline & inference engine
│   │   └── main.py                  # FastAPI factory & middleware
│   ├── saved_models/
│   │   └── ward_pulse_model.joblib  # Persisted model artifact & metadata
│   ├── tests/
│   │   └── test_ml.py               # Unit tests for training, validation & inference
│   └── requirements.txt             # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts            # Central fetch client
│   │   │   └── ml.ts                # Typed frontend client for backend ML API
│   │   ├── components/
│   │   │   ├── 3d/
│   │   │   │   └── MiniatureCity.tsx # Procedural 3D Three.js isometric city
│   │   │   ├── common/              # KpiCard, Badge, EmptyState
│   │   │   ├── layout/              # Header, Sidebar, Layout
│   │   │   └── map/                 # WardGeoMap (MapLibre GL), MapLegend
│   │   ├── context/
│   │   │   └── WardPulseContext.tsx # Central application state & API binding
│   │   ├── views/
│   │   │   ├── OverviewView.tsx     # 4 KPI cards, welcome hero, priorities
│   │   │   ├── WardMapView.tsx      # Interactive GIS map with ward highlighting
│   │   │   ├── PredictionsView.tsx  # Interactive ward prediction & feature impact
│   │   │   ├── DatasetModelView.tsx # 3-stage guided ML workflow
│   │   │   └── ResourcePlannerView.tsx # Empirical priority ranking table
│   │   └── types/
│   │       └── index.ts             # Shared TypeScript types
│   ├── package.json
│   └── vite.config.ts               # Proxy configuration (/api -> backend)
│
├── data/
│   ├── municipal_ward_complaints_training.csv # Verified municipal benchmark dataset
│   └── municipal_ward_cold_start_test.csv     # Unseen cold-start wards
└── README.md
```

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, MapLibre GL JS, Three.js / React Three Fiber, Framer Motion, Lucide Icons.
- **Backend:** FastAPI, Python 3.12+, Uvicorn, Scikit-learn, Pandas, NumPy, SciPy, Joblib, Pydantic v2.

---

## 🔌 API Specification (`/api/ml`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ml/upload-dataset` | Ingests CSV/Excel file, inspects missing values, validates targets |
| `POST` | `/api/ml/load-benchmark` | Loads verified municipal training dataset |
| `GET` | `/api/ml/dataset-info` | Returns current dataset schema, row preview, and target candidates |
| `POST` | `/api/ml/train` | Trains Ridge, Random Forest, or Gradient Boosting model on unseen wards |
| `GET` | `/api/ml/training-status` | Returns whether model is trained and validation metrics |
| `POST` | `/api/ml/predict` | Executes real inference for a ward, returns confidence interval |
| `GET` | `/api/ml/resource-ranking` | Ranks all wards by predicted demand with quartile thresholds |

---

## 🧪 Testing & Verification

Run the backend unit test suite:
```powershell
cd backend
.\.venv\Scripts\python.exe -m unittest tests/test_ml.py
```
Verified tests:
- `test_target_validation_rules`: Strictly rejects `ward_id` and non-complaint features.
- `test_training_rejection_on_ward_id`: Verifies that attempting to train on `ward_id` throws a validation exception.
- `test_train_and_evaluate_model`: Trains Ridge pipeline, checks $R^2 > 0.4$, $\text{MAE} < 25$, and verifies artifact creation.
- `test_predict_ward`: Runs inference and tests confidence interval ordering.
- `test_resource_ranking`: Verifies descending demand order and priority assignment.

---

## 🚀 Running the Application

### 1. Start the Backend API
```powershell
cd backend
.\.venv\Scripts\python.exe run.py
```
Runs at: `http://127.0.0.1:8000` (Interactive API docs at `http://127.0.0.1:8000/api/docs`).

### 2. Start the Frontend
```powershell
cd frontend
npm run dev
```
Runs at:https://wardpulse-ai.vercel.app
