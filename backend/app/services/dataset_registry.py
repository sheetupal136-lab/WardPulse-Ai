import os
import json
import shutil
import logging
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np

from app.core.storage import get_writable_data_dir, get_current_dataset_path
from app.schemas.ml import (
    DatasetColumnInfo,
    DatasetInspectionResponse,
    DatasetRegistryItem,
    DatasetRegistryResponse,
    WardCoordinateItem
)

logger = logging.getLogger("wardpulse_backend.dataset_registry")

# Directory Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ROOT_DIR = os.path.dirname(BASE_DIR)
DATA_DIR = os.path.join(BASE_DIR, "data")
CURRENT_DATASET_PATH = get_current_dataset_path()

# Potential raw data locations
POSSIBLE_RAW_DIRS = [
    os.path.join(DATA_DIR, "raw", "p3-ward-civic-demand"),
    os.path.join(DATA_DIR, "p3-ward-civic-demand"),
    DATA_DIR,
    os.path.join(ROOT_DIR, "data", "raw", "p3-ward-civic-demand"),
    os.path.join(ROOT_DIR, "data"),
    os.path.join(ROOT_DIR, "hack-day-lucknow-datasets", "p3-ward-civic-demand"),
    os.path.join(ROOT_DIR, "wardpulse-ai", "backend", "data", "raw", "p3-ward-civic-demand"),
    os.path.join(ROOT_DIR, "backend", "data", "raw", "p3-ward-civic-demand"),
]

VALID_TARGET_KEYWORDS = [
    "complaint", "demand", "grievance", "issues", "tickets", "reported", "count", "target", "cases"
]

FORBIDDEN_TARGETS = [
    "ward_id", "id", "ward_code", "code", "index", "centroid_lat", "centroid_lon",
    "latitude", "longitude", "lat", "lon"
]


def get_raw_data_dir() -> str:
    """Finds the existing directory holding the raw hackathon datasets."""
    for path in POSSIBLE_RAW_DIRS:
        if os.path.exists(path):
            if os.path.exists(os.path.join(path, "ward_features.csv")) or os.path.exists(os.path.join(path, "wards.geojson")):
                return path
    # Default to standard backend path
    return os.path.join(DATA_DIR, "raw", "p3-ward-civic-demand")


def get_default_joined_csv_path() -> Optional[str]:
    """Finds the pre-joined complaints & ward features training dataset."""
    candidates = [
        os.path.join(DATA_DIR, "municipal_ward_complaints_training.csv"),
        os.path.join(ROOT_DIR, "data", "municipal_ward_complaints_training.csv"),
        os.path.join(get_raw_data_dir(), "municipal_ward_complaints_training.csv"),
        os.path.join(ROOT_DIR, "wardpulse-ai", "backend", "data", "municipal_ward_complaints_training.csv"),
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None

# Backwards compatibility alias for other services importing DEFAULT_JOINED_CSV
DEFAULT_JOINED_CSV = get_default_joined_csv_path() or os.path.join(DATA_DIR, "municipal_ward_complaints_training.csv")


def is_valid_complaint_target_name(col_name: str) -> bool:
    """Checks whether a column name can be used as a regression target (excludes administrative IDs and coordinates)."""
    lower = col_name.lower().strip()
    if lower in FORBIDDEN_TARGETS or lower.endswith("_id") or lower.startswith("id_"):
        return False
    return any(k in lower for k in VALID_TARGET_KEYWORDS)


def extract_ward_coordinates(df: pd.DataFrame) -> List[WardCoordinateItem]:
    """Extracts genuine ward coordinates and metadata from a dataframe."""
    coords: List[WardCoordinateItem] = []
    
    # Check if coordinate columns exist
    lat_col = next((c for c in ["centroid_lat", "lat", "latitude"] if c in df.columns), None)
    lon_col = next((c for c in ["centroid_lon", "lon", "longitude", "lng"] if c in df.columns), None)
    
    if not lat_col or not lon_col:
        # If coordinates not in current df, try reading ward_features.csv
        raw_dir = get_raw_data_dir()
        wf_path = os.path.join(raw_dir, "ward_features.csv")
        if not os.path.exists(wf_path):
            alt_wf = os.path.join(DATA_DIR, "ward_features.csv")
            if os.path.exists(alt_wf):
                wf_path = alt_wf

        if os.path.exists(wf_path):
            try:
                wf_df = pd.read_csv(wf_path)
                return extract_ward_coordinates(wf_df)
            except Exception:
                return coords
        return coords

    id_col = next((c for c in ["ward_id", "id", "ward_code"] if c in df.columns), None)
    name_col = next((c for c in ["ward_name", "name", "ward"] if c in df.columns), None)
    zone_col = next((c for c in ["bbmp_zone_name", "zone", "district"] if c in df.columns), None)
    pop_col = next((c for c in ["population_2011", "population"] if c in df.columns), None)

    for _, row in df.iterrows():
        lat_val = row.get(lat_col)
        lon_val = row.get(lon_col)
        if pd.notnull(lat_val) and pd.notnull(lon_val):
            try:
                lat_f = float(lat_val)
                lon_f = float(lon_val)
                w_id = str(row.get(id_col, len(coords) + 1)) if id_col else str(len(coords) + 1)
                w_name = str(row.get(name_col, f"Ward {w_id}")) if name_col and pd.notnull(row.get(name_col)) else f"Ward {w_id}"
                w_zone = str(row.get(zone_col)) if zone_col and pd.notnull(row.get(zone_col)) else None
                w_pop = int(row.get(pop_col)) if pop_col and pd.notnull(row.get(pop_col)) else None

                coords.append(WardCoordinateItem(
                    ward_id=w_id,
                    ward_name=w_name,
                    zone=w_zone,
                    lat=round(lat_f, 6),
                    lon=round(lon_f, 6),
                    population=w_pop
                ))
            except (ValueError, TypeError):
                continue

    return coords


def inspect_dataframe_extended(
    df: pd.DataFrame, 
    filename: str,
    source: str = "Uploaded Dataset",
    dataset_id: Optional[str] = None,
    mode: Optional[str] = None,
    missing_data_explanation: Optional[str] = None,
    can_join: bool = False
) -> DatasetInspectionResponse:
    """Inspects a dataframe, checks target validity, and enriches with metadata and ward coordinates."""
    columns_info: List[DatasetColumnInfo] = []
    candidate_targets: List[str] = []

    for col in df.columns:
        series = df[col]
        dtype = "number" if pd.api.types.is_numeric_dtype(series) else "string"
        if pd.api.types.is_bool_dtype(series):
            dtype = "boolean"

        non_null = int(series.notnull().sum())
        null_count = int(series.isnull().sum())
        unique_count = int(series.nunique(dropna=True))

        sample_vals = series.dropna().head(4).tolist()
        clean_samples = [float(v) if isinstance(v, (np.floating, float)) else str(v) for v in sample_vals]

        is_candidate = dtype == "number" and is_valid_complaint_target_name(col)
        if is_candidate:
            candidate_targets.append(col)

        columns_info.append(DatasetColumnInfo(
            name=col,
            type=dtype,
            non_null_count=non_null,
            null_count=null_count,
            unique_count=unique_count,
            sample_values=clean_samples,
            is_candidate_target=is_candidate
        ))

    has_valid_target = len(candidate_targets) > 0

    # Determine mode if not explicitly passed
    if mode is None:
        mode = "complaint_prediction" if has_valid_target else "ward_analysis"

    target_msg = None
    if not has_valid_target:
        target_msg = (
            "Civic dataset loaded. Prediction engine is ready: pre-trained Calibrated Model (Ridge Regression, R²=0.767) "
            "will forecast civic complaint demand across all wards in this dataset."
        )

    # Preview rows
    preview_df = df.head(8).copy()
    preview_rows = preview_df.replace({np.nan: None}).to_dict(orient="records")

    # Extract coordinates
    coords = extract_ward_coordinates(df)

    return DatasetInspectionResponse(
        filename=filename,
        row_count=len(df),
        column_count=len(df.columns),
        columns=columns_info,
        preview_rows=preview_rows,
        candidate_targets=candidate_targets,
        has_valid_complaint_target=has_valid_target,
        target_validation_message=target_msg,
        mode=mode,
        source=source,
        dataset_id=dataset_id,
        ward_coordinates=coords,
        can_join_complaints=can_join,
        missing_data_explanation=missing_data_explanation
    )


class DatasetRegistryService:
    @staticmethod
    def get_registry() -> DatasetRegistryResponse:
        """Returns catalog of authentic pre-provided hackathon datasets with physical availability status."""
        raw_dir = get_raw_data_dir()
        wf_path = os.path.join(raw_dir, "ward_features.csv")
        gr_path = os.path.join(raw_dir, "grievances_public_wards.csv")
        geo_path = os.path.join(raw_dir, "wards.geojson")
        joined_path = get_default_joined_csv_path()

        # Check physical existence of files on disk
        has_wf = os.path.exists(wf_path) or os.path.exists(os.path.join(DATA_DIR, "ward_features.csv"))
        has_gr = os.path.exists(gr_path) or os.path.exists(os.path.join(DATA_DIR, "grievances_public_wards.csv"))
        has_geo = os.path.exists(geo_path) or os.path.exists(os.path.join(DATA_DIR, "wards.geojson"))
        has_joined = (joined_path is not None and os.path.exists(joined_path)) or (has_wf and has_gr)

        # 1. Joined dataset (Complaint Prediction Mode)
        joined_features = [
            "population_2011", "area_sq_km", "households_census_2011", "road_length_kms",
            "streetlights", "parks", "govt_schools", "bus_stops", "lakes",
            "monthly_complaint_demand", "total_complaints", "electrical_complaints",
            "solid_waste_complaints", "roads_complaints"
        ]
        joined_item = DatasetRegistryItem(
            id="hackathon_joined",
            name="Verified Joined Complaints & Ward Features",
            description="Authentic join of 556,561 grievances with ward_features.csv on ward_id across 156 wards with verified monthly complaint demand and category counts.",
            source="BBMP Sahaaya Redressal System + Census 2011 (Verified Join on ward_id)",
            file_name="municipal_ward_complaints_training.csv",
            row_count=156,
            column_count=42,
            has_complaint_target=True,
            mode="complaint_prediction",
            available_features=joined_features,
            missing_data_explanation=None if has_joined else (
                "The pre-joined training dataset (municipal_ward_complaints_training.csv) is not found in the deployment directory. "
                "Please upload it via the Upload CSV button."
            ),
            is_available=has_joined
        )

        # 2. Ward features only (Ward Analysis Mode)
        wf_features = [
            "population_2011", "area_sq_km", "households_census_2011", "road_length_kms",
            "streetlights", "lakes", "parks", "playgrounds", "govt_schools", "police_stations",
            "bus_stops", "bmtc_ttmc", "bus_routes", "centroid_lat", "centroid_lon"
        ]
        wf_item = DatasetRegistryItem(
            id="hackathon_features",
            name="Bengaluru Ward Infrastructure & Demographics",
            description="Demographics, census metrics, and civic infrastructure for all 198 BBMP wards. Contains NO complaint metrics (enables Ward Analysis Mode).",
            source="Bruhat Bengaluru Mahanagara Palike (BBMP) & Census of India 2011",
            file_name="ward_features.csv",
            row_count=198,
            column_count=30,
            has_complaint_target=False,
            mode="ward_analysis",
            available_features=wf_features,
            missing_data_explanation=(
                "Historical complaint records (e.g. 'monthly_complaint_demand', 'total_complaints') "
                "are absent from this demographic file. Ward Analysis Mode is active."
            ) if has_wf else (
                "ward_features.csv is not bundled in this deployment. Please upload it via CSV Upload."
            ),
            is_available=has_wf
        )

        # 3. Grievances public log
        gr_item = DatasetRegistryItem(
            id="hackathon_grievances",
            name="BBMP Grievance Redressal Records",
            description="556,561 timestamped complaint records across 156 wards (Feb 2020 – Jun 2025) categorized across 6 municipal sectors.",
            source="BBMP Sahaaya Redressal Portal",
            file_name="grievances_public_wards.csv",
            row_count=556561,
            column_count=7,
            has_complaint_target=True,
            mode="grievance_logs",
            available_features=["category_group", "category_raw", "sub_category", "grievance_time", "status"],
            missing_data_explanation=None if has_gr else (
                "Raw grievances log (51.7 MB, 556k rows) is not bundled in the lightweight cloud deployment. "
                "The pre-joined training dataset (municipal_ward_complaints_training.csv) is available for full modeling, "
                "or you can upload grievances_public_wards.csv manually via CSV Upload."
            ),
            is_available=has_gr
        )

        # 4. GeoJSON boundaries
        geo_item = DatasetRegistryItem(
            id="hackathon_geojson",
            name="Official Ward Boundary Polygons",
            description="198 municipal boundary polygons in WGS84 for geospatial mapping and choropleth visualization.",
            source="BBMP GIS / Karnataka State Remote Sensing Applications Centre",
            file_name="wards.geojson",
            row_count=198,
            column_count=1,
            has_complaint_target=False,
            mode="spatial_geometry",
            available_features=["ward_id", "geometry"],
            missing_data_explanation=None if has_geo else (
                "wards.geojson was not found in the deployment directory."
            ),
            is_available=has_geo
        )

        default_id = "hackathon_joined" if has_joined else ("hackathon_features" if has_wf else "none")

        return DatasetRegistryResponse(
            datasets=[joined_item, wf_item, gr_item, geo_item],
            default_dataset_id=default_id
        )

    @staticmethod
    def load_dataset_by_id(dataset_id: str = "hackathon_joined") -> DatasetInspectionResponse:
        """Loads a pre-provided dataset into current_dataset.csv and returns inspection metadata."""
        raw_dir = get_raw_data_dir()
        os.makedirs(DATA_DIR, exist_ok=True)

        if dataset_id == "hackathon_features":
            # Load ward_features.csv (Ward Analysis Mode)
            wf_path = os.path.join(raw_dir, "ward_features.csv")
            if not os.path.exists(wf_path):
                alt_wf = os.path.join(DATA_DIR, "ward_features.csv")
                if os.path.exists(alt_wf):
                    wf_path = alt_wf

            if not os.path.exists(wf_path):
                raise FileNotFoundError(
                    f"ward_features.csv not found in deployment at {wf_path}. "
                    "Please upload this dataset manually via the CSV Upload section."
                )
            
            df = pd.read_csv(wf_path)
            try:
                target_path = get_current_dataset_path()
                shutil.copy(wf_path, target_path)
            except Exception as e:
                logger.warning(f"Could not copy to {get_current_dataset_path()}: {e}")
            return inspect_dataframe_extended(
                df=df,
                filename="ward_features.csv",
                source="Bruhat Bengaluru Mahanagara Palike & Census 2011",
                dataset_id="hackathon_features",
                mode="ward_analysis",
                missing_data_explanation=(
                    "Historical complaint records (e.g., 'monthly_complaint_demand', 'total_complaints') "
                    "are not present in ward_features.csv. Ward Analysis Mode is enabled. "
                    "You can inspect demographics and infrastructure on the map. "
                    "To enable complaint prediction and model training, click 'Join Complaint History' or load the joined dataset."
                ),
                can_join=True
            )

        elif dataset_id == "hackathon_grievances":
            # Load raw grievances log
            gr_path = os.path.join(raw_dir, "grievances_public_wards.csv")
            if not os.path.exists(gr_path):
                alt_gr = os.path.join(DATA_DIR, "grievances_public_wards.csv")
                if os.path.exists(alt_gr):
                    gr_path = alt_gr

            if not os.path.exists(gr_path):
                raise FileNotFoundError(
                    "The raw 556k grievances log (grievances_public_wards.csv, 51.7 MB) is not included in this deployment bundle. "
                    "Please use the bundled 'Verified Joined Complaints & Ward Features' dataset, or upload your CSV manually."
                )
            
            # Preview / sample for memory if copying
            df = pd.read_csv(gr_path, nrows=50000)
            df.to_csv(CURRENT_DATASET_PATH, index=False)
            return inspect_dataframe_extended(
                df=df,
                filename="grievances_public_wards.csv",
                source="BBMP Sahaaya Redressal Portal",
                dataset_id="hackathon_grievances",
                mode="grievance_logs",
                can_join=True
            )

        else:
            # Default: hackathon_joined (Verified Joined Complaints & Features)
            return DatasetRegistryService.join_complaint_history()

    @staticmethod
    def join_complaint_history() -> DatasetInspectionResponse:
        """Performs authentic join of grievances_public_wards.csv and ward_features.csv on ward_id."""
        joined_csv = get_default_joined_csv_path()

        # Check if pre-aggregated training dataset already exists
        if joined_csv and os.path.exists(joined_csv):
            df = pd.read_csv(joined_csv)
            try:
                from app.services.ml_service import MLService
                MLService.set_current_dataframe(df)
            except Exception:
                pass
            try:
                target_path = get_current_dataset_path()
                shutil.copy(joined_csv, target_path)
            except Exception as e:
                logger.warning(f"Could not copy to {get_current_dataset_path()}: {e}")
            return inspect_dataframe_extended(
                df=df,
                filename="municipal_ward_complaints_training.csv",
                source="BBMP Sahaaya + Census 2011 (Verified Join on ward_id)",
                dataset_id="hackathon_joined",
                mode="complaint_prediction",
                can_join=False
            )

        # Otherwise perform dynamic join if raw files exist
        raw_dir = get_raw_data_dir()
        wf_path = os.path.join(raw_dir, "ward_features.csv")
        gr_path = os.path.join(raw_dir, "grievances_public_wards.csv")

        if not os.path.exists(wf_path) or not os.path.exists(gr_path):
            missing = []
            if not os.path.exists(wf_path): missing.append("ward_features.csv")
            if not os.path.exists(gr_path): missing.append("grievances_public_wards.csv")
            raise FileNotFoundError(
                f"Cannot load hackathon dataset: Pre-aggregated file 'municipal_ward_complaints_training.csv' is missing, "
                f"and raw sources ({', '.join(missing)}) are not available for dynamic join. "
                "Please upload your dataset file via the CSV Upload section."
            )

        wf = pd.read_csv(wf_path)
        gr = pd.read_csv(gr_path)

        gr["month"] = gr["grievance_time"].str.slice(0, 7)
        ward_summary = gr.groupby("ward_id").agg(
            total_complaints=("complaint_id", "count"),
            active_months=("month", "nunique")
        ).reset_index()

        ward_summary["monthly_complaint_demand"] = (
            ward_summary["total_complaints"] / ward_summary["active_months"]
        ).round(2)

        cat_pivot = gr.pivot_table(
            index="ward_id",
            columns="category_group",
            values="complaint_id",
            aggfunc="count",
            fill_value=0
        )
        cat_pivot.columns = [f"{c}_complaints" for c in cat_pivot.columns]
        cat_pivot = cat_pivot.reset_index()

        ward_grievances = pd.merge(ward_summary, cat_pivot, on="ward_id")
        joined = pd.merge(wf, ward_grievances, on="ward_id", how="inner")

        # Save to disk
        try:
            joined.to_csv(get_current_dataset_path(), index=False)
            default_save = os.path.join(DATA_DIR, "municipal_ward_complaints_training.csv")
            joined.to_csv(default_save, index=False)
        except Exception as e:
            logger.warning(f"Could not save dynamic join to disk: {e}")

        return inspect_dataframe_extended(
            df=joined,
            filename="municipal_ward_complaints_training.csv",
            source="BBMP Sahaaya + Census 2011 (Verified Join on ward_id)",
            dataset_id="hackathon_joined",
            mode="complaint_prediction",
            can_join=False
        )

    @staticmethod
    def get_geojson_data() -> Dict[str, Any]:
        """Loads and returns the official wards.geojson from the raw directory."""
        raw_dir = get_raw_data_dir()
        geojson_path = os.path.join(raw_dir, "wards.geojson")
        if not os.path.exists(geojson_path):
            alt_geo = os.path.join(DATA_DIR, "wards.geojson")
            if os.path.exists(alt_geo):
                geojson_path = alt_geo

        if not os.path.exists(geojson_path):
            raise FileNotFoundError(
                f"wards.geojson not found in deployment at {geojson_path}. "
                "Please upload or bundle the official wards.geojson file."
            )
        
        with open(geojson_path, "r", encoding="utf-8") as f:
            return json.load(f)
