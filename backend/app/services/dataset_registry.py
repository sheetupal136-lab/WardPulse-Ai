import os
import json
import shutil
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np

from app.schemas.ml import (
    DatasetColumnInfo,
    DatasetInspectionResponse,
    DatasetRegistryItem,
    DatasetRegistryResponse,
    WardCoordinateItem
)

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ROOT_DIR = os.path.dirname(BASE_DIR)
DATA_DIR = os.path.join(BASE_DIR, "data")
CURRENT_DATASET_PATH = os.path.join(DATA_DIR, "current_dataset.csv")

# Potential raw data locations
POSSIBLE_RAW_DIRS = [
    os.path.join(BASE_DIR, "data", "raw", "p3-ward-civic-demand"),
    os.path.join(ROOT_DIR, "wardpulse-ai", "backend", "data", "raw", "p3-ward-civic-demand"),
    os.path.join(ROOT_DIR, "hack-day-lucknow-datasets", "p3-ward-civic-demand"),
    os.path.join(ROOT_DIR, "backend", "data", "raw", "p3-ward-civic-demand")
]

DEFAULT_JOINED_CSV = os.path.join(ROOT_DIR, "data", "municipal_ward_complaints_training.csv")
if not os.path.exists(DEFAULT_JOINED_CSV):
    DEFAULT_JOINED_CSV = os.path.join(DATA_DIR, "municipal_ward_complaints_training.csv")

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
        if os.path.exists(path) and os.path.exists(os.path.join(path, "ward_features.csv")):
            return path
    # Default to standard path
    return os.path.join(BASE_DIR, "data", "raw", "p3-ward-civic-demand")


def is_valid_complaint_target_name(col_name: str) -> bool:
    """Checks whether a column name can be used as a regression target (excludes administrative IDs and coordinates)."""
    lower = col_name.lower().strip()
    if lower in FORBIDDEN_TARGETS or lower.endswith("_id") or lower.startswith("id_"):
        return False
    return True


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
            "No legitimate civic complaint-demand metric found in this dataset "
            "(e.g., 'monthly_complaint_demand', 'total_complaints'). "
            "Ward Analysis Mode is active. 'ward_id' is an administrative identifier and cannot be used as a target. "
            "Prediction mode remains disabled until joined with complaint history."
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
        """Returns catalog of all authentic pre-provided hackathon datasets."""
        raw_dir = get_raw_data_dir()
        
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
            missing_data_explanation=None
        )

        # 2. Ward features only (Ward Analysis Mode)
        wf_path = os.path.join(raw_dir, "ward_features.csv")
        wf_rows = 198
        wf_cols = 30
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
            row_count=wf_rows,
            column_count=wf_cols,
            has_complaint_target=False,
            mode="ward_analysis",
            available_features=wf_features,
            missing_data_explanation=(
                "Historical complaint records (e.g. 'monthly_complaint_demand', 'total_complaints') "
                "are absent from this demographic file. Ward Analysis Mode is active. Prediction mode "
                "remains disabled until joined with grievance records."
            )
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
            missing_data_explanation=None
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
            missing_data_explanation=None
        )

        return DatasetRegistryResponse(
            datasets=[joined_item, wf_item, gr_item, geo_item],
            default_dataset_id="hackathon_joined"
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
                raise FileNotFoundError(f"ward_features.csv not found at {wf_path}")
            
            shutil.copy(wf_path, CURRENT_DATASET_PATH)
            df = pd.read_csv(CURRENT_DATASET_PATH)
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
                    "To enable complaint prediction and model training, click 'Join Complaint History'."
                ),
                can_join=True
            )

        elif dataset_id == "hackathon_grievances":
            # Load raw grievances log
            gr_path = os.path.join(raw_dir, "grievances_public_wards.csv")
            if not os.path.exists(gr_path):
                raise FileNotFoundError(f"grievances_public_wards.csv not found at {gr_path}")
            
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
        raw_dir = get_raw_data_dir()
        wf_path = os.path.join(raw_dir, "ward_features.csv")
        gr_path = os.path.join(raw_dir, "grievances_public_wards.csv")

        # Check if pre-aggregated training dataset already exists
        if os.path.exists(DEFAULT_JOINED_CSV):
            shutil.copy(DEFAULT_JOINED_CSV, CURRENT_DATASET_PATH)
            df = pd.read_csv(CURRENT_DATASET_PATH)
            return inspect_dataframe_extended(
                df=df,
                filename="municipal_ward_complaints_training.csv",
                source="BBMP Sahaaya + Census 2011 (Verified Join on ward_id)",
                dataset_id="hackathon_joined",
                mode="complaint_prediction",
                can_join=False
            )

        # Otherwise perform dynamic join
        if not os.path.exists(wf_path) or not os.path.exists(gr_path):
            raise FileNotFoundError("Raw dataset files required for join are missing.")

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
        joined.to_csv(CURRENT_DATASET_PATH, index=False)
        joined.to_csv(DEFAULT_JOINED_CSV, index=False)

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
            raise FileNotFoundError(f"wards.geojson not found at {geojson_path}")
        
        with open(geojson_path, "r", encoding="utf-8") as f:
            return json.load(f)
