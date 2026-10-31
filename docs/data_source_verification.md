# WardPulse AI — Data Source Verification Report

**Verification Date:** October 31, 2026  
**Target Directory:** `backend/data/raw/p3-ward-civic-demand/`  
**Dataset Identifier:** P3 · Ward Pulse — Municipal Civic Demand Dataset  
**Status:** All 6 raw files inspected directly from local disk. No synthetic data generated; no models modified or trained.

---

## Executive Summary

A comprehensive physical inspection of all files inside `backend/data/raw/p3-ward-civic-demand/` was performed. The dataset represents real municipal civic grievance logs and urban infrastructure attributes for the **Bruhat Bengaluru Mahanagara Palike (BBMP)** municipal corporation in Bengaluru, India.

The dataset consists of **556,561 timestamped complaint records** across **156 wards** from **February 2020 through June 2025 (65 calendar months)**, coupled with structural demographic and infrastructure attributes for all **198 wards** and exact **GeoJSON boundaries**.

The official task is a **spatially-disjoint cold-start demand forecasting problem**: predicting future monthly complaint counts (`predicted_count`) across **6 complaint category groups** for **40 unseen wards** over **18 months (January 2024 to June 2025)**, where the 40 target wards have **zero historical grievance records** in the training partition.

---

## 1. Inventory of Available Datasets

| # | File Name | File Size | Row Count | Column Count | File Format | Role in ML Pipeline |
|---|---|---|---|---|---|---|
| 1 | `grievances_public_wards.csv` | 51,708,844 bytes (~49.3 MB) | 556,561 | 7 | CSV (UTF-8) | Historical grievance transaction logs (Training data) |
| 2 | `ward_features.csv` | 42,308 bytes (~41.3 KB) | 198 | 30 | CSV (UTF-8) | Ward-level demographics & urban infrastructure |
| 3 | `wards.geojson` | 995,378 bytes (~972 KB) | 198 features | 1 property (`ward_id`) | GeoJSON (WGS84) | Spatial polygon & multi-polygon boundaries |
| 4 | `prediction_grid_template.csv` | 94,566 bytes (~92.4 KB) | 4,320 | 3 | CSV (UTF-8) | Official test evaluation grid (40 wards × 18 months × 6 categories) |
| 5 | `sample_submission.csv` | 198 bytes | 5 (+1 header) | 4 | CSV (UTF-8) | Official format specification for predictions |
| 6 | `README.md` | 1,028 bytes | 12 lines | N/A | Markdown | Participant documentation and challenge metadata |

---

## 2. Detailed Column Schema and Data Quality

### 2.1. `grievances_public_wards.csv` (Historical Grievance Log)
- **Total Records:** 556,561 rows
- **Memory Footprint:** ~49.3 MB
- **Temporal Span:** `2020-02-08 01:01:00` to `2025-06-19 12:59:00` (65 months)
- **Unique Wards Present:** 156 wards

| Column Name | Data Type | Null Count | Description & Unique Sample Values |
|---|---|---|---|
| `complaint_id` | `int64` | 0 (0.0%) | Unique grievance tracking identifier (e.g., 20004324) |
| `category_group` | `object` (string) | 0 (0.0%) | Aggregated civic department category (6 values):<br>• `electrical`: 225,303 (40.48%)<br>• `solid_waste`: 137,975 (24.79%)<br>• `roads`: 92,458 (16.61%)<br>• `animals_health`: 40,355 (7.25%)<br>• `other`: 34,689 (6.23%)<br>• `trees`: 25,781 (4.63%) |
| `category_raw` | `object` (string) | 0 (0.0%) | Raw category recorded in the municipal redressal system |
| `sub_category` | `object` (string) | 0 (0.0%) | Detailed issue descriptor (e.g., streetlights not working, garbage overflow, pothole) |
| `grievance_time` | `object` (string) | 0 (0.0%) | Timestamp formatted as `YYYY-MM-DD HH:MM:SS` |
| `ward_id` | `int64` | 0 (0.0%) | Municipal ward identifier (1 to 198) |
| `status` | `object` (string) | 56 (0.01%) | Grievance resolution status:<br>• `Closed`: 509,397<br>• `Registered`: 15,009<br>• `Rejected`: 12,037<br>• `Non Relevant`: 11,263<br>• `Resolved`: 5,516<br>• `ReOpen`: 1,933<br>• `In Progress`: 952<br>• `Long Term Solution`: 398 |

### 2.2. `ward_features.csv` (Demographics and Infrastructure Attributes)
- **Total Records:** 198 rows (1 row per ward for wards 1 through 198)
- **Columns:** 30

| # | Column Name | Data Type | Missing Values | Description |
|---|---|---|---|---|
| 1 | `ward_id` | `int64` | 0 | Primary key (1 to 198) |
| 2 | `ward_name` | `object` | 0 | Official ward name (e.g., Kempegowda Ward, Chowdeswari Ward, Atturu) |
| 3 | `bbmp_zone_name` | `object` | 0 | Administrative zone (8 zones: Bommanahalli, Dasarahalli, East, Mahadevapura, Rajarajeshwarinagar, South, West, Yelahanka) |
| 4 | `assembly_constituency_name`| `object` | 0 | Karnataka Legislative Assembly constituency (28 unique) |
| 5 | `mp_constituency` | `object` | 0 | Lok Sabha Parliamentary constituency (Bangalore North, Bangalore Central, Bangalore South, Bangalore Rural) |
| 6 | `population_2011` | `int64` | 0 | Total resident population (Census of India 2011) |
| 7 | `area_sq_km` | `float64` | 0 | Geographic area of the ward in square kilometers |
| 8 | `households_census_2011` | `int64` | 0 | Total number of households (Census 2011) |
| 9 | `road_length_kms` | `int64` | 0 | Total road network length within ward in kilometers |
| 10 | `lakes` | `int64` | 0 | Count of water bodies / lakes |
| 11 | `lake_area_sq_m` | `int64` | 0 | Total lake surface area in square meters |
| 12 | `parks` | `int64` | 0 | Count of public municipal parks |
| 13 | `park_area_sq_m` | `float64` | 0 | Total park surface area in square meters |
| 14 | `playgrounds` | `int64` | 0 | Count of public sports playgrounds |
| 15 | `playground_area_sq_m` | `int64` | 0 | Total playground surface area in square meters |
| 16 | `govt_schools` | `int64` | 0 | Count of government / municipal schools |
| 17 | `police_stations` | `int64` | 0 | Count of police stations |
| 18 | `fire_stations` | `int64` | 0 | Count of fire stations |
| 19 | `bus_stops` | `int64` | 0 | BMTC public bus stop count |
| 20 | `bmtc_ttmc` | `int64` | 0 | Traffic & Transit Management Centres |
| 21 | `streetlights` | `int64` | 0 | Total inventory of municipal streetlights |
| 22 | `police_stn` | `object` | 112 (56.6%) | Local police station name / code (sparse descriptor) |
| 23 | `bbmp_division` | `object` | 0 | Municipal administrative division |
| 24 | `bbmp_sub_division` | `object` | 0 | Municipal sub-division |
| 25 | `population_density_2011_persons_sq_km` | `object` | 0 | Numeric density stored as formatted string |
| 26 | `decadal_popn_growth_rate_2011_2001` | `object` | 0 | Population growth percentage between 2001 and 2011 |
| 27 | `decadal_households_growth_rate_2011_2001` | `object` | 0 | Household growth percentage between 2001 and 2011 |
| 28 | `bus_routes` | `int64` | 0 | Number of passing BMTC transit bus routes |
| 29 | `centroid_lon` | `float64` | 0 | Longitude coordinate of ward geographic centroid (~77.47 to 77.74) |
| 30 | `centroid_lat` | `float64` | 0 | Latitude coordinate of ward geographic centroid (~12.86 to 13.14) |

### 2.3. `prediction_grid_template.csv` (Official Test Evaluation Grid)
- **Total Records:** 4,320 rows
- **Columns (3):** `ward_id`, `month`, `category_group`
- **Unique Wards:** Exactly 40 wards (Wards: 5, 6, 12, 15, 27, 33, 60, 66, 72, 74, 77, 79, 82, 85, 88, 89, 100, 111, 115, 117, 118, 122, 126, 128, 129, 130, 132, 138, 139, 141, 146, 149, 152, 164, 169, 174, 176, 182, 184, 193)
- **Forecast Horizon:** 18 monthly intervals (`2024-01` to `2025-06`)
- **Complaint Categories (6):** `electrical`, `solid_waste`, `roads`, `trees`, `animals_health`, `other`
- **Formula:** $40 \text{ wards} \times 18 \text{ months} \times 6 \text{ categories} = 4,320 \text{ rows}$

### 2.4. `sample_submission.csv` (Expected Submission Schema)
- **Columns (4):** `ward_id`, `month`, `category_group`, `predicted_count`
- **Target Value:** `predicted_count` (float or non-negative integer representing predicted complaint demand for that ward, month, and category).

---

## 3. Historical Complaint Records Breakdown

The dataset contains authentic historical complaint transactions from February 2020 through June 2025.

### Annual Growth and Volume
| Year | Total Complaints | Electrical | Solid Waste | Roads | Animals & Health | Other | Trees |
|---|---|---|---|---|---|---|---|
| **2020** (Feb-Dec) | 57,965 | 25,065 | 17,650 | 12,464 | 5,237 | 4,240 | 3,309 |
| **2021** (Jan-Dec) | 74,666 | 36,504 | 16,540 | 12,518 | 3,912 | 3,243 | 1,949 |
| **2022** (Jan-Dec) | 87,400 | 41,925 | 16,334 | 18,077 | 4,092 | 4,110 | 2,862 |
| **2023** (Jan-Dec) | 86,831 | 38,248 | 20,357 | 15,028 | 4,653 | 4,312 | 4,233 |
| **2024** (Jan-Dec) | 148,702 | 53,588 | 40,137 | 22,068 | 14,576 | 9,612 | 8,721 |
| **2025** (Jan-Jun) | 100,997 | 29,973 | 26,957 | 12,303 | 7,885 | 9,172 | 4,707 |
| **Total** | **556,561** | **225,303** | **137,975** | **92,458** | **40,355** | **34,689** | **25,781** |

### Key Observations:
1. Grievance volume grew substantially from ~58k in 2020 to ~149k in 2024, demonstrating municipal adoption and reporting system expansion.
2. Electrical (streetlighting/power) and Solid Waste constitute **65.27%** of all citizen complaints.
3. Over **91.5%** of historical complaints have reached a resolved/closed state (`Closed`: 509,397).

---

## 4. Complaint Target Variables

### Critical Finding:
1. **In `ward_features.csv`, NO complaint target column exists.**  
   `ward_features.csv` contains exclusively demographic, geographical, and municipal infrastructure attributes (population, road length, streetlight count, school count, etc.).
2. **In `grievances_public_wards.csv`, individual rows represent individual complaint events.**  
   Each transaction has a binary occurrence (1 grievance logged at a timestamp).
3. **The True ML Prediction Target is `predicted_count`:**
   - As defined by `sample_submission.csv` and `prediction_grid_template.csv`, the true target is the **aggregated monthly complaint count** for a given `(ward_id, month, category_group)` tuple, or total monthly ward complaints when forecasting at the ward level.
   - Ground truth targets for training are generated by grouping `grievances_public_wards.csv`:
     $$\text{Target}(w, m, c) = \text{COUNT}(\text{complaint\_id}) \quad \text{for ward } w, \text{ month } m, \text{ category } c$$

---

## 5. Ward Identifiers, Partitioning, and Joins

### 5.1. Primary Entity Key
The universal join identifier across all relational and spatial files is **`ward_id`** (integer, range 1 to 198).

### 5.2. Ward Partition Structure
The dataset defines a strict spatial transfer learning setup across the 198 wards:

```
Total Municipal Wards (198)
 ├── Training Wards (156 wards): Have 556,561 historical grievances in grievances_public_wards.csv
 ├── Test / Target Wards (40 wards): Present in prediction_grid_template.csv (ZERO historical grievances)
 └── Unrepresented Wards (2 wards: Ward 3 [Atturu] & Ward 65 [Kadu Malleshwara]): In ward_features and geojson, but in neither complaint logs nor test grid
```

- **Intersection between Train Wards and Test Wards:** **`0` wards (Empty Set)**.
- **Implication:** The challenge requires models to generalize across spatial boundaries to predict civic demand in unseen wards purely from demographic, topological, and infrastructure features (cold-start forecasting).

### 5.3. Relational Join Architecture
- **Training Set Construction:**
  $$\text{Aggregated Grievances}(w, m, c) \overset{\text{ward\_id}}{\bowtie} \text{ward\_features}(w)$$
- **Test Set Construction:**
  $$\text{prediction\_grid\_template}(w, m, c) \overset{\text{ward\_id}}{\bowtie} \text{ward\_features}(w)$$
- **Geographic Visualization:**
  $$\text{wards.geojson} \overset{\text{properties.ward\_id == ward\_features.ward\_id}}{\bowtie} \text{Predictions / Features}$$

---

## 6. Geographic Data Verification

### 6.1. Boundary Polygons (`wards.geojson`)
- **Format:** GeoJSON FeatureCollection
- **Total Features:** 198
- **Coordinate Reference System (CRS):** WGS84 (EPSG:4326)
- **Geometry Types:** `Polygon` and `MultiPolygon`
- **Properties Schema:** Each feature contains exactly one property: `{"ward_id": <int>}`
- **Bounding Box:**
  - Longitude: $77.47^{\circ}\text{E} \text{ to } 77.74^{\circ}\text{E}$
  - Latitude: $12.86^{\circ}\text{N} \text{ to } 13.14^{\circ}\text{N}$

### 6.2. Centroids (`ward_features.csv`)
- Contains precomputed `centroid_lat` and `centroid_lon` for all 198 wards.
- These coordinates align with Bengaluru municipal geography and match the centroids of the GeoJSON boundaries.

---

## 7. Data Documentation and Provenance

- **Origin:** Real municipal grievance data from the **Bruhat Bengaluru Mahanagara Palike (BBMP)** citizen grievance redressal system ("Sahaaya"), combined with official Census of India 2011 ward demographics and municipal asset inventories.
- **Challenge Reference:** P3 · Ward Pulse (Hack Day municipal analytics challenge).
- **Official Documentation (`README.md`):** Confirms that:
  - 156 wards have public complaints spanning Feb 2020 – Jun 2025.
  - 40 target wards have zero complaint records in the public file and must be predicted for 18 future months (2024-01 through 2025-06) across 6 categories.
  - Evaluation metric expects non-negative monthly demand predictions (`predicted_count`).

---

## 8. Summary Conclusion

All 6 dataset files are valid, complete, and stored locally in `backend/data/raw/p3-ward-civic-demand/`.  
The target variable is **monthly complaint count** aggregated from `grievances_public_wards.csv`.  
No synthetic data was used, and no model has been trained yet.
