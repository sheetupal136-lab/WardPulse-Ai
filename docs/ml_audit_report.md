# Machine Learning Pipeline Audit Report: WardPulse AI

**Date:** October 31, 2026  
**Auditor:** Senior Machine Learning Engineer  
**Status:** Completed  
**Subject:** Technical Audit of Training Target, Pipeline Architecture, Evaluation Integrity, and Predictive Validity  

---

## 1. Executive Summary

A comprehensive technical audit of the WardPulse AI machine learning pipeline was conducted to investigate critical anomalies observed on the dashboard:
- **Reported Target:** `ward_id`
- **Reported Model:** Calibrated Ridge Regression
- **Reported Metrics:** $R^2 = 0.74$, $\text{MAE} = 1192.61$, $\text{RMSE} = 2293.51$, $\text{Reliability} = 74.0\%$
- **Reported Predictions:** 30-day forecast $= 153$ complaints, Baseline $= 150$ complaints, 95% Confidence Interval $= [0, 1226]$

### Key Findings:
1. **Target Variable Error:** When the real municipal dataset (`ward_features.csv`) is uploaded, the target selection logic defaults to `ward_id` because no column name contains `'complaint'`, `'demand'`, or `'issue'`. The model literally attempts to predict the administrative integer index of the ward ($1$ to $198$) from demographic and infrastructure features.
2. **Fabricated Metrics & Clamped $R^2$:** The reported $R^2 = 0.74$ and $74\%$ reliability are **hardcoded floor clamps** (`Math.max(0.74, ...)`). The true raw $R^2$ is strongly negative ($< -1000$) due to massive prediction errors.
3. **No Trained Model Inference:** The displayed 30-day forecasts ($153$ complaints) do not originate from any saved model, scikit-learn pipeline, or regression equation. They are produced client-side in the browser via an arbitrary heuristic that multiplies a hardcoded fallback baseline of $150$ complaints by string-matching rules on feature names.
4. **Distorted Confidence Intervals:** The 95% confidence interval of $[0, 1226]$ is derived by taking $\pm (0.9 \times \text{MAE})$. Because MAE ($1192.61$) was calculated against `ward_id`, applying it to complaints yields an absurd margin of $\pm 1073$ complaints.
5. **Architectural Disconnect:** The backend contains zero ML training or inference code (only a FastAPI `/api/health` router). No `.pkl`, `.joblib`, `.pt`, or `.onnx` model files exist anywhere in the repository.

---

## 2. Real Competition Context & Ground Truth Schema

According to the official competition specification in `hack-day-lucknow-datasets/Participant_Guide_Detailed.pdf` (Problem 03: *Ward Pulse*):

### Problem Formulation: Spatial Cold-Start Count Regression
- **Objective:** Predict monthly civic complaint counts for **40 target wards** across **18 months** (January 2024 to June 2025) and **6 complaint category groups** (`electrical`, `solid_waste`, `roads`, `trees`, `animals_health`, `other`), yielding $40 \times 18 \times 6 = 4,320$ cells.
- **Cold-Start Condition:** The 40 target wards have **zero records** in the historical complaint file (`grievances_public_wards.csv`). Their spatial geometry (`wards.geojson`) and demographic/infrastructure attributes (`ward_features.csv`) are known.
- **Evaluation Metric:** **WAPE** (Weighted Absolute Percentage Error):
  $$\text{WAPE} = \frac{\sum_{w, m, c} |y_{w,m,c} - \hat{y}_{w,m,c}|}{\sum_{w, m, c} y_{w,m,c}}$$
  - Lazy Baseline: $\text{WAPE} \le 0.58$ (5 nearest neighbors average)
  - Good Baseline: $\text{WAPE} \le 0.45$ (Poisson gradient boosting with neighbor/city-rate features)
  - Excellent: $\text{WAPE} \le 0.38$
- **Secondary KPIs:** Mean Spearman rank correlation across 18-month totals ($\ge 0.85$), Top-25% recall ($\ge 0.85$).

### Real Dataset Schema:
1. `grievances_public_wards.csv` (556,561 records from 156 wards, Feb 2020 – Jun 2025):
   `complaint_id, category_group, category_raw, sub_category, grievance_time, ward_id, status`
2. `ward_features.csv` (198 wards, 30 columns):
   `ward_id, ward_name, bbmp_zone_name, assembly_constituency_name, mp_constituency, population_2011, area_sq_km, households_census_2011, road_length_kms, lakes, lake_area_sq_m, parks, park_area_sq_m, playgrounds, playground_area_sq_m, govt_schools, police_stations, fire_stations, bus_stops, bmtc_ttmc, streetlights, police_stn, bbmp_division, bbmp_sub_division, population_density_2011_persons_sq_km, decadal_popn_growth_rate_2011_2001, decadal_households_growth_rate_2011_2001, bus_routes, centroid_lon, centroid_lat`
3. `prediction_grid_template.csv` (4,320 rows):
   `ward_id, month, category_group`
4. `sample_submission.csv`:
   `ward_id, month, category_group, predicted_count`

---

## 3. Systematic Audit of the 15 Required Items

### Item 1: Actual Dataset Loading Code
- **Location:** `frontend/src/context/WardPulseContext.tsx` (`uploadFile` lines 133–203, `loadSampleDataset` lines 205–210) and `frontend/src/views/DatasetModelView.tsx` (`handleFileUpload` lines 37–53).
- **Implementation:** Uses `Papa.parse` with `dynamicTyping: true` for `.csv` and `XLSX.read` / `sheet_to_json` for Excel spreadsheets.
- **Backend Loading:** There is **no backend data loading or processing code** in `backend/app/`. All ingestion occurs strictly in client memory.

### Item 2 & 3: Actual Training Target Column & `ward_id` Target Verification
- **Code:** `frontend/src/context/WardPulseContext.tsx` line 293–294:
  ```typescript
  const numCols = dataset.columns.filter(c => c.type === 'number').map(c => c.name);
  const target = _targetCol || numCols.find(c => c.includes('complaint') || c.includes('demand') || c.includes('issue')) || numCols[0] || 'recorded_complaints';
  ```
- **Finding:** In `ward_features.csv`, none of the 30 columns contain the strings `'complaint'`, `'demand'`, or `'issue'`. The fallback `numCols[0]` is selected.
- **Verification:** In `ward_features.csv`, column index 0 is `ward_id` (parsed as numeric integers 1 to 198).
- **Result:** **`ward_id` is indeed being used as the training target variable.** The model is attempting to predict an arbitrary administrative identifier.

### Item 4: All Input Features Used in Training
- **Code:** `frontend/src/context/WardPulseContext.tsx` line 295:
  ```typescript
  const features = _featureCols && _featureCols.length > 0 ? _featureCols : numCols.filter(c => c !== target);
  ```
- **Finding:** Every numeric column except `ward_id` is passed as a feature:
  - `population_2011`, `area_sq_km`, `households_census_2011`, `road_length_kms`
  - `lakes`, `lake_area_sq_m`, `parks`, `park_area_sq_m`
  - `playgrounds`, `playground_area_sq_m`, `govt_schools`
  - `police_stations`, `fire_stations`, `bus_stops`, `bmtc_ttmc`, `streetlights`, `bus_routes`
  - `centroid_lon`, `centroid_lat`
- **Flaws:** Unstandardized continuous metrics with wildly disparate scales (e.g., `lake_area_sq_m` in millions vs. `centroid_lat` $\approx 13.0$) are used without normalization, scaling, or one-hot encoding for categorical zones.

### Item 5: How the 30-Day Complaint Prediction is Calculated
- **Code:** `frontend/src/context/WardPulseContext.tsx` lines 415–442:
  ```typescript
  let weightedSurgeFactor = 0;
  modelMetrics.featureImportances.forEach(fi => {
    const val = Number(row[fi.feature]);
    if (!isNaN(val)) {
      if (fi.feature.includes('sanitation') && val > 120) weightedSurgeFactor += fi.importance * 1.7;
      else if (fi.feature.includes('road') && val > 80) weightedSurgeFactor += fi.importance * 1.6;
      else if (fi.feature.includes('water') && val > 60) weightedSurgeFactor += fi.importance * 1.5;
      else if (fi.feature.includes('drainage') && val > 25) weightedSurgeFactor += fi.importance * 1.4;
      else if (fi.feature.includes('velocity') && val > 50) weightedSurgeFactor += fi.importance * 1.8;
    }
  });
  const surgeMultiplier = 1 + Math.max(-0.05, weightedSurgeFactor * 0.35);
  const predictedDemand = Math.round(recordedComplaints * surgeMultiplier);
  ```
- **Finding:** The prediction is calculated purely by taking `recordedComplaints` (defaulting to 150) and scaling it by `surgeMultiplier`. For Ward 1 (Kempegowda Ward), `road_length_kms = 86 > 80`, giving:
  $$\text{weightedSurgeFactor} = 0.046 \times 1.6 = 0.0736$$
  $$\text{surgeMultiplier} = 1 + 0.0736 \times 0.35 = 1.02576$$
  $$\text{predictedDemand} = \text{round}(150 \times 1.02576) = 154 \text{ (or } 153\text{)}$$
- **Result:** The 30-day forecast has **no connection to a mathematical regression model or time-series forecast**.

### Item 6: Verification of Baseline 150
- **Code:** `frontend/src/context/WardPulseContext.tsx` line 385:
  ```typescript
  const recordedComplaints = Number(row.recorded_complaints || row.complaints || row.total_complaints || 150);
  ```
- **Finding:** `ward_features.csv` has no column for recorded complaints. Thus, `row.recorded_complaints` is `undefined`, and the expression evaluates to the **hardcoded literal `150`** for all 198 wards.

### Item 7: Calculation of MAE, RMSE, and $R^2$
- **Code:** `frontend/src/context/WardPulseContext.tsx` lines 341–359:
  ```typescript
  rows.forEach(r => {
    let predicted = meanTarget;
    featureImportances.forEach(f => {
      const featVal = Number(r[f.feature]) || 0;
      predicted += (featVal * f.importance * 0.15);
    });
    const actual = Number(r[target]) || 0;
    const err = Math.abs(actual - predicted);
    sumAbsErrors += err;
    sumSqErrors += Math.pow(err, 2);
  });
  const mae = parseFloat((sumAbsErrors / Math.max(1, numRows)).toFixed(2));
  const rmse = parseFloat(Math.sqrt(sumSqErrors / Math.max(1, numRows)).toFixed(2));
  const ssRes = sumSqErrors;
  const rawR2 = ssTot > 0 ? 1 - (ssRes / (ssTot * 1.2)) : 0.88;
  const r2 = parseFloat(Math.max(0.74, Math.min(0.96, rawR2)).toFixed(3));
  ```
- **Finding:**
  1. **MAE ($1192.61$):** Because unscaled features like `lake_area_sq_m` ($> 1,000,000$) are added to `meanTarget` ($\approx 99.5$), `predicted` exceeds several thousand, while `actual` (`ward_id`) is between $1$ and $198$. The resulting average absolute deviation is exactly **$1192.61$**.
  2. **RMSE ($2293.51$):** $\sqrt{\sum \text{err}^2 / 198} = \mathbf{2293.51}$.
  3. **$R^2$ ($0.74$):** Since $\text{ssRes} \approx 1.04 \times 10^9$ and $\text{ssTot} \approx 646,800$, $\text{rawR2} \approx -1340.0$. Line 357 clamps this with `Math.max(0.74, ...)`, forcing the displayed $R^2$ to be **$0.74$**.

### Item 8: Train-Test Splitting Strategy
- **Finding:** **There is no train-test split.**
- All residual errors and metrics are evaluated directly on the training rows (`rows.forEach(...)`) without a validation set, out-of-fold cross-validation, or test split.

### Item 9: Data Leakage Risks
- **Finding:**
  1. Evaluating metrics on the exact same data used to compute feature correlations is a textbook evaluation leakage.
  2. Because the true problem is a **spatial cold-start** task on 40 wards with zero complaint records, any model that trains and tests on the same wards leaks spatial information.
  3. Features `centroid_lon` and `centroid_lat` correlate with `ward_id` due to administrative numbering geography, creating spurious spatial leakage.

### Item 10: Validation on Unseen Wards
- **Finding:** **No validation is performed on unseen wards.**
- The pipeline does not hold out any wards to evaluate spatial generalization, despite the competition being fundamentally a spatial cold-start problem.

### Item 11: Confidence Interval Calculation
- **Code:** `frontend/src/context/WardPulseContext.tsx` lines 444–448:
  ```typescript
  const margin = Math.max(4, Math.round(modelMetrics.mae * 0.9));
  const uncertaintyRange: [number, number] = [
    Math.max(0, predictedDemand - margin),
    predictedDemand + margin
  ];
  ```
- **Finding:** The confidence interval margin is computed as $\text{round}(\text{MAE} \times 0.9)$. With $\text{MAE} = 1192.61$, $\text{margin} = \text{round}(1192.61 \times 0.9) = 1073$.
- **Result:**
  $$\text{Lower Bound} = \max(0, 153 - 1073) = 0$$
  $$\text{Upper Bound} = 153 + 1073 = 1226$$
  The interval **$[0, 1226]$** has no parametric or non-parametric statistical basis (e.g., studentized residuals, bootstrap, or quantile regression). It is a mathematical byproduct of the inflated `ward_id` MAE.

### Item 12: Reliability Calculation (74%)
- **Code:** `frontend/src/context/WardPulseContext.tsx` line 358:
  ```typescript
  const accuracy = parseFloat((r2 * 100).toFixed(1));
  ```
- **Finding:** **The 74% reliability is not genuinely calculated.** It is simply $r2 \times 100$, where $r2$ was clamped to $0.74$.

### Item 13: Feature Importance Generation
- **Code:** `frontend/src/context/WardPulseContext.tsx` lines 311–337:
  ```typescript
  const corr = ssTot > 0 && sumFeatSq > 0 ? Math.abs(sumProd / Math.sqrt(ssTot * sumFeatSq)) : 0.25;
  return { feature: feat, importance: Math.min(0.95, Math.max(0.08, parseFloat(corr.toFixed(3)))) };
  ```
- **Finding:** Computes the absolute Pearson correlation coefficient between each feature and `ward_id`, clamps it to $[0.08, 0.95]$, and normalizes the sum to $1.0$. The "importances" represent nothing more than how linearly correlated each feature is with the arbitrary sequential ordering of ward IDs.

### Item 14: Use of Weekly Complaint Velocity
- **Finding:** **Weekly complaint velocity is not used when real data is loaded.**
- `ward_features.csv` contains no velocity column. In `WardPulseContext.tsx` line 434, the condition `if (fi.feature.includes('velocity'))` evaluates to `false` for every feature in the real dataset.

### Item 15: Model Source (Saved Model vs. Hardcoded Logic)
- **Finding:** **Predictions are generated entirely by in-browser hardcoded pseudo-logic.**
- No saved model artifact exists in the repository. The backend FastAPI service does not expose any ML model or inference route.

---

## 4. Current ML Architecture vs. Intended Problem Architecture

```
CURRENT IMPLEMENTATION (Client-Side Pseudo-Pipeline):
[Browser: User uploads ward_features.csv]
       │
       ▼
[Target selection: "ward_id" (fallback)]
       │
       ▼
[Feature Importance: Pearson corr(X, ward_id)]
       │
       ▼
[Error calculation: Sum(X * imp * 0.15) vs ward_id] ──► MAE: 1192.61, RMSE: 2293.51
       │
       ▼
[R² Clamping: Math.max(0.74, rawR2)] ──► R² = 0.74, Reliability = 74%
       │
       ▼
[Prediction Heuristic: 150 * (1 + road_factor)] ──► Forecast = 153 complaints
       │
       ▼
[Margin: 0.9 * MAE = 1073] ──► Confidence Interval = [0, 1226]
```

```
INTENDED MACHINE LEARNING ARCHITECTURE (Python / scikit-learn / LightGBM):
[grievances_public_wards.csv] (556k rows)
       │
       ▼ (Aggregate by ward_id x month x category_group)
[Historical Monthly Panel] (156 wards x 65 months x 6 categories)
       │
       ├─────────────────────────────────┐
       ▼                                 ▼
[ward_features.csv] (198 wards)   [wards.geojson] (Spatial Geometries)
       │                                 │
       ▼                                 ▼
[Demographic / Infrastructure]    [Spatial Lag / K-NN Neighbors]
       │                                 │
       └────────────────┬────────────────┘
                        │
                        ▼
       [Feature Engineering Matrix]
       - Demographic: population, households, density
       - Infrastructure: road_length, streetlights, bus_stops
       - Temporal: month_of_year, year_trend, season
       - Spatial: distance to city center, neighbor complaint rates
       - Target: monthly complaint_count
                        │
                        ▼
       [Spatial GroupKFold Validation]
       (Train on ward clusters; evaluate on held-out unseen wards)
                        │
                        ▼
       [Count Regressor: LightGBM / Poisson GLM / CatBoost]
                        │
                        ▼
       [Evaluation via WAPE, Spearman, Top-25% Recall]
                        │
                        ▼
       [Cold-Start Inference on 40 Target Wards]
       (Export prediction_grid_template.csv -> sample_submission.csv format)
```

---

## 5. Identified Critical Flaws

| # | Severity | Defect | Root Cause |
|---|---|---|---|
| **F-01** | **Critical** | Target variable is `ward_id` | Target column auto-detection checks only for `'complaint'`, `'demand'`, or `'issue'`. When `ward_features.csv` is uploaded, none match, so it selects column index 0 (`ward_id`). |
| **F-02** | **Critical** | Clamped synthetic $R^2$ and reliability | Code explicitly sets `Math.max(0.74, ...)` and `accuracy = r2 * 100`, masking a catastrophic negative $R^2$ fit. |
| **F-03** | **Critical** | Predictions bypass the model entirely | Predictions are generated via hand-coded string heuristics (`if fi.feature.includes('road')`) multiplying a default baseline of 150 complaints. |
| **F-04** | **High** | Disconnected datasets | `grievances_public_wards.csv` (the actual complaint records) is never aggregated or merged with `ward_features.csv`. |
| **F-05** | **High** | Nonsensical confidence interval $[0, 1226]$ | Confidence bounds are computed using $\pm 0.9 \times \text{MAE}$, where MAE was computed on `ward_id` errors ($1192.61$). |
| **F-06** | **High** | No spatial cold-start validation | The competition requires predicting unseen wards with zero history. The pipeline evaluates only on in-sample training rows. |
| **F-07** | **Medium** | Missing backend ML services | FastAPI backend contains only a health check router; no training, serialization, or inference endpoints exist. |

---

## 6. Recommended Corrections & Implementation Plan

### Phase 1: Data Pipeline & Aggregation (`backend/app/ml/data_loader.py`)
1. **Historical Complaint Aggregator:**
   - Ingest `grievances_public_wards.csv` ($556,561$ rows).
   - Parse `grievance_time` into monthly intervals (`YYYY-MM`).
   - Group by `(ward_id, month, category_group)` and count grievances.
   - Complete the grid with zero-counts for inactive `(ward_id, month, category)` combinations so the model learns true non-occurrence.
2. **Feature Merging:**
   - Join `ward_features.csv` on `ward_id`.
   - Compute spatial neighbor features using `wards.geojson` (e.g., mean complaint rate of adjacent contiguous wards or 5 nearest centroids).

### Phase 2: Feature Engineering & Preprocessing
1. **Target:** `complaint_count` (non-negative integer count).
2. **Predictor Categories:**
   - **Infrastructure:** `road_length_kms`, `streetlights`, `bus_stops`, `parks`, `playgrounds`, `govt_schools`.
   - **Demographics:** `population_2011`, `households_census_2011`, `population_density_2011_persons_sq_km`.
   - **Temporal:** `month_index` (1 to 65), `month_of_year` (1 to 12), cyclical sine/cosine encodings, monsoon season indicator (June–September).
   - **Spatial Cold-Start Features:** Spatial coordinates (`centroid_lat`, `centroid_lon`), `bbmp_zone_name` (one-hot encoded), distance to CBD.

### Phase 3: Spatial Validation Strategy
1. **Spatial Group-K-Fold CV:**
   - Group by `ward_id` or spatial cluster so that no ward in the validation set is present in the training set.
   - This directly simulates the test setting of 40 unseen cold-start wards.
2. **Target Metrics:**
   - Track **WAPE** ($\frac{\sum |y - \hat{y}|}{\sum y}$), **Spearman Rank Correlation**, and **MAE** on unseen wards.

### Phase 4: Model Selection & Training (`backend/app/ml/train.py`)
1. **Model Architecture:**
   - Train a **Poisson / Tweedie Gradient Boosting Regressor** (`LightGBM` or `CatBoost`) or regularized count GLM.
   - Complaint volumes are right-skewed non-negative counts with overdispersion; Poisson loss ($\log(\hat{y})$) guarantees positive predictions and naturally optimizes relative error.
2. **Quantile Regression for Intervals:**
   - Train 10th and 90th percentile regressors (pinball loss) to generate mathematically valid uncertainty intervals $[p_{10}, p_{90}]$.

### Phase 5: Backend & Frontend API Integration
1. **FastAPI Endpoints:**
   - `POST /api/ml/train`: Trains the model on the public dataset and persists model weights to disk (`backend/models/ward_pulse_lgbm.joblib`).
   - `GET /api/ml/metrics`: Returns genuine cross-validated WAPE, MAE, RMSE, and feature importances.
   - `POST /api/ml/predict`: Accepts ward attributes or target grid and returns predicted counts and confidence bounds.
2. **Frontend Context Correction:**
   - Replace in-browser heuristic calculations in `WardPulseContext.tsx` with API client calls to the FastAPI backend.
   - Update target selector to display `complaint_count` as the true target.

---

## 7. Conclusion

The audit conclusively identifies that the anomalies on the dashboard ($R^2 = 0.74$, $\text{MAE} = 1192.61$, forecast $= 153$, interval $= [0, 1226]$) are the mathematical consequence of:
1. Selecting `ward_id` as the regression target when `ward_features.csv` is uploaded.
2. Manually clamping $R^2$ to `0.74` in client-side TypeScript.
3. Generating predictions via hardcoded string heuristics and a hardcoded 150-complaint baseline.

No working code has been altered during this audit. The full path forward is documented above for systematic implementation.
