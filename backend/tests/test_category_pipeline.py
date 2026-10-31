import os
import unittest
from app.services.category_service import CategoryService
from app.services.ml_service import MLService


class TestCategoryPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Ensure benchmark training dataset is active and trained on monthly demand
        MLService.load_benchmark_dataset()
        MLService.train_model(
            target_column="monthly_complaint_demand",
            algorithm="ridge",
            test_size=0.2
        )

    def test_category_model_evaluation(self):
        """Verifies that category model evaluation metrics are well-formed and calibrated."""
        eval_res = CategoryService.get_evaluation()
        self.assertTrue(eval_res.is_trained)
        self.assertEqual(eval_res.status, "available")
        self.assertIsNotNone(eval_res.classification_metrics)
        self.assertIsNotNone(eval_res.forecast_metrics)

        # Check classification metrics
        clf = eval_res.classification_metrics
        self.assertGreater(clf.accuracy, 0.20)
        self.assertGreater(clf.weighted_f1, 0.15)
        self.assertEqual(len(clf.per_class), 6)
        cat_names = [p.category for p in clf.per_class]
        self.assertIn("electrical", cat_names)
        self.assertIn("solid_waste", cat_names)
        self.assertIn("roads", cat_names)
        self.assertIn("animals_health", cat_names)
        self.assertIn("trees", cat_names)
        self.assertIn("other", cat_names)

        # Check count forecast backtest metrics
        fc = eval_res.forecast_metrics
        self.assertLess(fc.mae, 6.0)
        self.assertLess(fc.rmse, 10.0)
        self.assertGreater(fc.r2, 0.70)
        # Verify model outperforms naive historical baseline
        self.assertLess(fc.mae, fc.baseline_mae)
        self.assertLess(fc.rmse, fc.baseline_rmse)

    def test_ward_category_prediction_mathematical_consistency(self):
        """
        Verifies that predicted category counts sum exactly to the total ward demand,
        and that probability distribution sums to 1.0.
        """
        pred = CategoryService.predict_ward_categories(ward_id="4", horizon_days=30)
        self.assertEqual(pred.ward_id, "4")
        self.assertEqual(pred.status, "available")
        self.assertEqual(len(pred.categories), 6)

        # Mathematical consistency check
        prob_sum = sum(c.probability for c in pred.categories)
        self.assertAlmostEqual(prob_sum, 1.0, places=2)

        exp_count_sum = sum(c.expected_count for c in pred.categories)
        self.assertAlmostEqual(exp_count_sum, pred.total_predicted_demand, places=1)

        base_count_sum = sum(c.baseline_count for c in pred.categories)
        self.assertAlmostEqual(base_count_sum, pred.total_baseline_demand, places=1)

        # Check Ward 4 specific authentic values
        # Ward 4 30-day forecast is 79.3, baseline is 68.1
        self.assertAlmostEqual(pred.total_predicted_demand, 79.3, places=1)
        self.assertAlmostEqual(pred.total_baseline_demand, 68.1, places=1)

        elec_item = next(c for c in pred.categories if c.category == "electrical")
        self.assertAlmostEqual(elec_item.probability_pct, 42.4, delta=2.0)
        self.assertAlmostEqual(elec_item.expected_count, 33.6, delta=2.0)

    def test_multi_horizon_scaling(self):
        """Tests that 30, 60, and 90-day horizons scale consistently."""
        p30 = CategoryService.predict_ward_categories("4", horizon_days=30)
        p60 = CategoryService.predict_ward_categories("4", horizon_days=60)
        p90 = CategoryService.predict_ward_categories("4", horizon_days=90)

        self.assertEqual(p30.horizon_months, 1)
        self.assertEqual(p60.horizon_months, 2)
        self.assertEqual(p90.horizon_months, 3)

        self.assertAlmostEqual(p60.total_predicted_demand, p30.total_predicted_demand * 2, delta=2.0)
        self.assertAlmostEqual(p90.total_predicted_demand, p30.total_predicted_demand * 3, delta=3.0)

    def test_department_and_resource_linking(self):
        """Verifies municipal departments and required resources are populated without auto-assignment."""
        pred = CategoryService.predict_ward_categories("4", horizon_days=30)
        for cat in pred.categories:
            self.assertTrue(len(cat.department) > 0)
            self.assertTrue(len(cat.required_resources) > 0)
            self.assertTrue(len(cat.recommended_action) > 0)
            # Must require user/administrative approval
            self.assertEqual(cat.approval_status, "Awaiting Municipal Approval")

    def test_cold_start_ward_graceful_fallback(self):
        """Tests that predicting on a cold-start test ward gracefully uses citywide priors without crashing."""
        pred = CategoryService.predict_ward_categories("180", horizon_days=30)
        self.assertEqual(pred.status, "available")
        self.assertEqual(len(pred.categories), 6)
        self.assertGreaterEqual(pred.total_predicted_demand, 0.0)


if __name__ == "__main__":
    unittest.main()
