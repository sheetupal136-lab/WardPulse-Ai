import os
import unittest
import pandas as pd
from app.services.ml_service import (
    MLService,
    is_valid_complaint_target_name,
    SAVED_MODEL_PATH,
    CURRENT_DATASET_PATH
)

class TestMLPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Load benchmark dataset and train model for test suite
        MLService.load_benchmark_dataset()
        MLService.train_model(
            target_column="monthly_complaint_demand",
            algorithm="ridge",
            test_size=0.2
        )

    def test_target_validation_rules(self):
        """Verifies that ward_id and non-complaint features are strictly rejected as targets."""
        self.assertFalse(is_valid_complaint_target_name("ward_id"))
        self.assertFalse(is_valid_complaint_target_name("id"))
        self.assertFalse(is_valid_complaint_target_name("centroid_lat"))
        self.assertFalse(is_valid_complaint_target_name("population_2011"))
        self.assertFalse(is_valid_complaint_target_name("road_length_kms"))
        
        # Valid civic complaint demand names
        self.assertTrue(is_valid_complaint_target_name("monthly_complaint_demand"))
        self.assertTrue(is_valid_complaint_target_name("total_complaints"))
        self.assertTrue(is_valid_complaint_target_name("electrical_complaints"))

    def test_training_rejection_on_ward_id(self):
        """Attempts to train on ward_id must raise ValueError."""
        with self.assertRaises(ValueError) as ctx:
            MLService.train_model(target_column="ward_id")
        self.assertIn("administrative identifier", str(ctx.exception).lower())

    def test_train_and_evaluate_model(self):
        """Tests training real Ridge model on genuine complaint demand."""
        res = MLService.train_model(
            target_column="monthly_complaint_demand",
            algorithm="ridge",
            test_size=0.2
        )
        self.assertTrue(res.success)
        self.assertIsNotNone(res.metrics)
        self.assertGreater(res.metrics.r2, 0.4)
        self.assertLess(res.metrics.mae, 25.0)
        self.assertTrue(os.path.exists(SAVED_MODEL_PATH))

    def test_predict_ward(self):
        """Tests inference for an existing ward."""
        pred = MLService.predict_ward(ward_id="1", horizon_months=1)
        self.assertEqual(pred.ward_id, "1")
        self.assertGreaterEqual(pred.predicted_demand, 0.0)
        self.assertGreaterEqual(pred.confidence_interval[1], pred.confidence_interval[0])
        self.assertTrue(len(pred.top_driving_features) > 0)

    def test_resource_ranking(self):
        """Tests that resource ranking correctly orders wards by predicted demand."""
        ranking = MLService.get_resource_ranking()
        self.assertGreater(ranking.total_wards, 100)
        self.assertGreater(ranking.critical_count, 0)
        
        # Check sorting order
        demands = [it.predicted_demand for it in ranking.items]
        self.assertEqual(demands, sorted(demands, reverse=True))

if __name__ == "__main__":
    unittest.main()
