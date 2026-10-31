# WardPulse AI — Prediction Workflow Recovery & Role Separation Report

**Document:** `docs/prediction_workflow_recovery.md`  
**Date:** October 31, 2026  
**Status:** Audit & Recovery Specification  

---

## 1. Executive Summary & Root Cause Analysis

A workflow regression occurred where the official evaluation query template, **`prediction_grid_template.csv`** (4,320 rows with columns `ward_id, month, category_group`), was inadvertently loaded as the active training dataset. Because `prediction_grid_template.csv` contains only query tuples with no target variable, the dataset schema validator correctly reported:
> *"No valid civic complaint-demand target column found... 'ward_id' is an administrative identifier and cannot be used as a target."*

This occurred due to a **dataset role conflation**: treating a test evaluation query grid as a training set.

---

## 2. Answers to Pre-Code Inspection Questions

### Question 1: Which files contain real complaint data?
1. **`backend/data/raw/p3-ward-civic-demand/grievances_public_wards.csv`** (~51.7 MB):
   - Contains **556,561 authentic timestamped citizen grievance records** from the Bruhat Bengaluru Mahanagara Palike (BBMP) Sahaaya redressal portal.
   - Spans **65 calendar months** (February 2020 through June 2025) across **156 wards**.
   - Fields: `complaint_id`, `category_group` (electrical, solid waste, roads, animals/health, other, trees), `category_raw`, `sub_category`, `grievance_time`, `ward_id`, `status`.
2. **`data/municipal_ward_complaints_training.csv`**:
   - The verified aggregated training dataset produced by joining the 556,561 grievances with `ward_features.csv` on `ward_id`.
   - Contains **156 rows (wards) × 42 features**.
   - Contains authentic complaint totals:
     - `total_complaints`: Exactly 556,561 across the 156 wards.
     - `active_months`: 65 months.
     - `monthly_complaint_demand`: $\frac{\text{total\_complaints}}{65}$ (e.g. Ward 4 Yelahanka: $4,426 / 65 = 68.092 \approx 68.1$).
     - Category breakdowns: `electrical_complaints`, `solid_waste_complaints`, `roads_complaints`, `animals_health_complaints`, `trees_complaints`, `other_complaints`.
3. **Files with NO complaint targets:**
   - `ward_features.csv`: 198 wards of Census 2011 demographics & infrastructure. No complaint counts.
   - `prediction_grid_template.csv`: 4,320 rows of test coordinate tuples (`ward_id, month, category_group`). No target column.
   - `wards.geojson`: 198 WGS84 boundary polygons.

---

### Question 2: Where did the previous predictions come from?
The previous numbers displayed on the dashboard were **genuine machine learning outputs from the trained model and historical records**, not hardcoded UI stubs:

1. **Yelahanka Forecast: 79.3 complaints**
   - Ward 4 is **Yelahanka Satellite Town** (population 41,986, road length 86 km, 3,626 streetlights, 26 parks, 4 schools).
   - The saved model pipeline (`backend/saved_models/ward_pulse_model.joblib`) was evaluated on Ward 4's 25 static features:
     $$\text{pipeline.predict}(X_{\text{ward\_4}}) = \mathbf{79.33566...} \approx \mathbf{79.3}$$
2. **Baseline: 68.1 complaints**
   - In `data/municipal_ward_complaints_training.csv`, Ward 4 has $4,426$ total historical complaints logged across $65$ active months:
     $$\text{Historical Monthly Demand} = \frac{4,426}{65} = 68.092 \approx \mathbf{68.1}$$
   - Predicted Net Increase: $79.3 - 68.1 = \mathbf{+11.2}$ complaints (+16% surge).
3. **Evaluation Metrics: MAE 16.84, RMSE 23.66, $R^2$ 0.767**
   - The Ridge Regression model was trained on an 80% partition (124 wards) and evaluated on a **held-out spatial test partition of 32 unseen wards** ($N=32$, `test_size=0.2`, `random_state=42`).
   - The genuine test partition metrics stored in `ward_pulse_model.joblib` are:
     - $\text{MAE} = \mathbf{16.84}$ (vs. 33.33 naive dummy mean baseline)
     - $\text{RMSE} = \mathbf{23.66}$ (vs. 49.28 naive dummy mean baseline)
     - $R^2 = \mathbf{0.767}$ (explaining 76.7% of spatial variance across unseen wards)
   - Reliability "77%" was the presentation formatting of $\text{round}(R^2 \times 100) = 77\%$.

---

### Question 3: Why does the current screen report no target?
1. `prediction_grid_template.csv` was copied into or selected as `CURRENT_DATASET_PATH` (`backend/data/current_dataset.csv`).
2. The schema inspector (`inspect_dataframe_extended`) scanned the columns: `['ward_id', 'month', 'category_group']`.
3. None of these columns are numeric complaint demand measures. `ward_id` is an administrative integer, and `month` / `category_group` are strings.
4. The system correctly flagged `has_valid_complaint_target: false`.
5. **The bug was that `prediction_grid_template.csv` was treated as a training input rather than as a test prediction query grid.**

---

### Question 4: Exact files that need changes

| # | File Path | Role in Architecture | Required Change |
|---|---|---|---|
| 1 | `backend/app/services/dataset_registry.py` | Dataset Registry & Roles | 1. Ensure `hackathon_joined` (`municipal_ward_complaints_training.csv`, 156 wards) is the primary default training set.<br>2. Add `prediction_grid_template.csv` as **Test Prediction Grid**, separate from training.<br>3. Implement `predict_prediction_grid()` joining grid rows with `ward_features.csv` on `ward_id` to generate predictions for all 4,320 rows. |
| 2 | `backend/app/services/ml_service.py` | Model Training & Inference | 1. Fix default dataset resolution to load `data/municipal_ward_complaints_training.csv`.<br>2. Add batch inference method for test grid using the saved model pipeline. |
| 3 | `backend/app/schemas/ml.py` | API Contracts | Add `PredictionGridItem`, `PredictionGridResponse` schemas for the 4,320 test predictions. |
| 4 | `backend/app/api/endpoints/ml.py` | API Routing | Add `POST /ml/predict-grid` and `GET /ml/prediction-grid` endpoints. |
| 5 | `frontend/src/api/ml.ts` | Frontend API Client | Add TypeScript interfaces and API call for `predictGridApi()`. |
| 6 | `frontend/src/context/WardPulseContext.tsx` | State Management | Ensure initial load uses the verified training dataset (`municipal_ward_complaints_training.csv`), so Yelahanka (79.3 vs 68.1, MAE 16.84, RMSE 23.66, R² 0.767) is immediately restored. Expose prediction grid state. |
| 7 | `frontend/src/views/PredictionsView.tsx` | Predictions UI | Restore the Yelahanka prediction card and add a view/tab for the 40-ward cold-start prediction grid (4,320 predictions). |
| 8 | `frontend/src/views/DatasetModelView.tsx` | Dataset Studio | Explicitly label Stage 1 as Training Dataset Ingestion (`municipal_ward_complaints_training.csv`) and separate it from the test prediction grid. |

---

## 3. The Separated 9-Step Architectural Pipeline

```
  [ward_features.csv] (198 wards)       [grievances_public_wards.csv] (556,561 records)
            │                                                 │
            │                  Step 1 & 2                     │
            └───────────────┬─────────────────────────────────┘
                            │
                            ▼
      Step 3: Authentic Join on ward_id (156 wards with historical demand)
              Target = monthly_complaint_demand (68.1 for Ward 4)
                            │
                            ▼
      Step 4: Train & Validate Model (Ridge Regression)
              Held-Out Test Metrics: MAE=16.84, RMSE=23.66, R²=0.767
              Saved Pipeline: backend/saved_models/ward_pulse_model.joblib
                            │
                            ├────────────────────────────────────────────────┐
                            ▼                                                ▼
      Step 5: Single Ward Inference                   Step 6: Load Prediction Grid (4,320 rows)
              Ward 4 (Yelahanka Satellite Town)               prediction_grid_template.csv
              X_w4 -> pipeline.predict()                      (40 test wards x 18 months x 6 categories)
              Forecast: 79.3                                                 │
              Baseline: 68.1                                                 ▼
              Increase: +11.2 (+16%)                  Step 7: Join Grid with ward_features on ward_id
                                                                     │
                                                                     ▼
                                                      Step 8: Generate Batch Model Predictions
                                                              (predicted_count for 4,320 rows)
                                                                     │
                                                                     ▼
                                                      Step 9: Aggregate by Ward, Month & Category
                                                              Display on Dashboard & Map
```

---

## 4. Summary

No data or predictions need to be fabricated. The previous values (79.3, 68.1, MAE 16.84, RMSE 23.66, R² 0.767) are 100% reproducible directly from the saved model and historical BBMP grievance records. By establishing strict role separation between the **training dataset** and the **test prediction grid**, the application workflow will be fully restored.
