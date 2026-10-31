import os
import unittest
import pandas as pd
from app.services.dataset_registry import (
    DatasetRegistryService,
    is_valid_complaint_target_name,
    get_raw_data_dir
)
from app.services.ml_service import MLService


class TestDatasetRegistry(unittest.TestCase):
    def test_registry_contains_hackathon_datasets(self):
        """Verifies that dataset registry catalogs all legitimate bundled datasets."""
        reg = DatasetRegistryService.get_registry()
        dataset_ids = [d.id for d in reg.datasets]
        self.assertIn("hackathon_joined", dataset_ids)
        self.assertIn("hackathon_features", dataset_ids)
        self.assertIn("hackathon_grievances", dataset_ids)
        self.assertIn("hackathon_geojson", dataset_ids)

        # Check features dataset attributes
        features_item = next(d for d in reg.datasets if d.id == "hackathon_features")
        self.assertEqual(features_item.row_count, 198)
        self.assertFalse(features_item.has_complaint_target)
        self.assertEqual(features_item.mode, "ward_analysis")
        self.assertIsNotNone(features_item.missing_data_explanation)

        # Check joined dataset attributes
        joined_item = next(d for d in reg.datasets if d.id == "hackathon_joined")
        self.assertEqual(joined_item.row_count, 156)
        self.assertTrue(joined_item.has_complaint_target)
        self.assertEqual(joined_item.mode, "complaint_prediction")

    def test_load_ward_features_enables_ward_analysis_mode(self):
        """Loading ward_features alone must enable Ward Analysis Mode and keep prediction disabled."""
        res = DatasetRegistryService.load_dataset_by_id("hackathon_features")
        self.assertEqual(res.row_count, 198)
        self.assertEqual(res.mode, "ward_analysis")
        self.assertFalse(res.has_valid_complaint_target)
        self.assertTrue(res.can_join_complaints)
        self.assertIn("ward_id", [c.name for c in res.columns])
        self.assertFalse(is_valid_complaint_target_name("ward_id"))
        
        # Ward coordinates must be loaded for all 198 wards
        self.assertIsNotNone(res.ward_coordinates)
        self.assertEqual(len(res.ward_coordinates), 198)
        self.assertAlmostEqual(res.ward_coordinates[0].lat, 13.108650, places=3)

        # Model training must be rejected on ward_features alone
        with self.assertRaises(ValueError) as ctx:
            MLService.train_model(target_column="ward_id")
        self.assertIn("administrative identifier", str(ctx.exception).lower())

    def test_join_complaints_enables_prediction_mode(self):
        """Joining complaint history must yield verified target and enable training."""
        res = DatasetRegistryService.join_complaint_history()
        self.assertEqual(res.row_count, 156)
        self.assertEqual(res.mode, "complaint_prediction")
        self.assertTrue(res.has_valid_complaint_target)
        self.assertIn("monthly_complaint_demand", res.candidate_targets)
        self.assertIn("total_complaints", res.candidate_targets)

        # Model training succeeds on joined dataset
        train_res = MLService.train_model(
            target_column="monthly_complaint_demand",
            algorithm="ridge",
            test_size=0.2
        )
        self.assertTrue(train_res.success)
        self.assertIsNotNone(train_res.metrics)
        self.assertGreater(train_res.metrics.r2, 0.4)

    def test_geojson_boundary_retrieval(self):
        """Verifies official GeoJSON boundaries are retrievable and well-formed."""
        geojson = DatasetRegistryService.get_geojson_data()
        self.assertEqual(geojson.get("type"), "FeatureCollection")
        self.assertEqual(len(geojson.get("features", [])), 198)
        self.assertEqual(geojson["features"][0]["properties"], {"ward_id": 1})


if __name__ == "__main__":
    unittest.main()
