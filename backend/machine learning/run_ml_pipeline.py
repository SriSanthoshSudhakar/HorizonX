"""
HorizonX - Unified Machine Learning Pipeline Orchestrator
---------------------------------------------------------
Executes:
1. Random Forest (Multi-Class Classification & Concentration Regression)
2. Isolation Forest (Unsupervised Telemetry Anomaly & Outlier Detection)
3. Generates comprehensive markdown and JSON analytical reports.
"""

import os
import sys
import json
import time

# Ensure imports from local directory work
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from random_forest import load_and_validate_data, run_random_forest_classification, run_random_forest_regression
from isolation_forest import run_isolation_forest

OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")
MODELS_DIR = os.path.join(BASE_DIR, "models")

def generate_markdown_summary(rf_metrics, iso_metrics):
    """Generates an executive ML report answering the analysis questions."""
    clf = rf_metrics["classification"]
    reg = rf_metrics["regression"]

    top_feats_md = "\n".join([f"| #{i+1} | `{feat}` | {weight*100:.2f}% |" for i, (feat, weight) in enumerate(clf["top_features"][:10])])

    gas_breakdown_md = "\n".join([
        f"| {gas} | {data['total_samples']:,} | {data['anomalies']:,} | **{data['anomaly_rate_pct']:.2f}%** |"
        for gas, data in iso_metrics["gas_species_breakdown"].items()
    ])

    conc_breakdown_md = "\n".join([
        f"| {tier} | {data['total_samples']:,} | {data['anomalies']:,} | **{data['anomaly_rate_pct']:.2f}%** |"
        for tier, data in iso_metrics["concentration_tier_breakdown"].items()
    ])

    summary_content = f"""# HorizonX Machine Learning Pipeline Performance Report

## Executive Summary
This report documents the training and evaluation of the machine learning engines trained on **13,910 historical Figaro chemical sensor array telemetry vectors** across 128 sensory channels (`feature_1` through `feature_128`).

Two primary paradigms were developed and executed:
1. **Supervised Random Forest**: Multi-class classification (6 hazardous gas species) & continuous concentration regression (PPM).
2. **Unsupervised Isolation Forest**: Telemetry anomaly isolation, detecting corrupted baseline drift, electrical spikes, and volatile gas release events.

---

## 1. Supervised Learning: Random Forest

### 1.1 Multi-Class Gas Species Classification
The classifier identifies which of the 6 target gases is present based on multi-sensor conductivity signatures:
- **Test Set Accuracy**: `{clf['accuracy']*100:.2f}%`
- **5-Fold Stratified Cross-Validation Accuracy**: `{clf['cv_5fold_mean_accuracy']*100:.2f}% (+/- {clf['cv_5fold_std_accuracy']*2*100:.2f}%)`
- **Macro-Averaged F1-Score**: `{clf['macro_f1']*100:.2f}%`
- **Weighted-Averaged F1-Score**: `{clf['weighted_f1']*100:.2f}%`

#### Per-Class Performance
| Chemical Species | Precision | Recall | F1-Score | Test Support |
| :--- | :--- | :--- | :--- | :--- |
| **Ethanol** | {clf['per_class_report']['Ethanol']['precision']*100:.2f}% | {clf['per_class_report']['Ethanol']['recall']*100:.2f}% | {clf['per_class_report']['Ethanol']['f1-score']*100:.2f}% | {clf['per_class_report']['Ethanol']['support']} |
| **Ethylene** | {clf['per_class_report']['Ethylene']['precision']*100:.2f}% | {clf['per_class_report']['Ethylene']['recall']*100:.2f}% | {clf['per_class_report']['Ethylene']['f1-score']*100:.2f}% | {clf['per_class_report']['Ethylene']['support']} |
| **Ammonia** | {clf['per_class_report']['Ammonia']['precision']*100:.2f}% | {clf['per_class_report']['Ammonia']['recall']*100:.2f}% | {clf['per_class_report']['Ammonia']['f1-score']*100:.2f}% | {clf['per_class_report']['Ammonia']['support']} |
| **Acetaldehyde** | {clf['per_class_report']['Acetaldehyde']['precision']*100:.2f}% | {clf['per_class_report']['Acetaldehyde']['recall']*100:.2f}% | {clf['per_class_report']['Acetaldehyde']['f1-score']*100:.2f}% | {clf['per_class_report']['Acetaldehyde']['support']} |
| **Acetone** | {clf['per_class_report']['Acetone']['precision']*100:.2f}% | {clf['per_class_report']['Acetone']['recall']*100:.2f}% | {clf['per_class_report']['Acetone']['f1-score']*100:.2f}% | {clf['per_class_report']['Acetone']['support']} |
| **Toluene** | {clf['per_class_report']['Toluene']['precision']*100:.2f}% | {clf['per_class_report']['Toluene']['recall']*100:.2f}% | {clf['per_class_report']['Toluene']['f1-score']*100:.2f}% | {clf['per_class_report']['Toluene']['support']} |

### 1.2 Top 10 Most Discriminative Figaro Sensor Channels
The Gini importance (mean impurity reduction) pinpoints which physical sensor channels drive species discrimination:
| Rank | Channel Feature | Relative Importance |
| :--- | :--- | :--- |
{top_feats_md}

### 1.3 Gas Concentration Regression (PPM Estimation)
The continuous regressor estimates exposure concentration levels across a dynamic operating range ({reg['min_ppm']:.1f} to {reg['max_ppm']:.1f} PPM):
- **Coefficient of Determination ($R^2$)**: `{reg['r2_score']:.4f}`
- **Mean Absolute Error (MAE)**: `{reg['mean_absolute_error_ppm']:.2f} PPM`
- **Root Mean Squared Error (RMSE)**: `{reg['root_mean_squared_error_ppm']:.2f} PPM`

---

## 2. Unsupervised Learning: Isolation Forest

### 2.1 Anomaly Detection Baseline
Isolation Forest partitions the 128-dimensional telemetry space using 150 random recursive isolation trees:
- **Total Vectors Assessed**: `{iso_metrics['total_samples']:,}`
- **Contamination Target**: `{iso_metrics['contamination_parameter']*100:.1f}%`
- **Detected Anomalous Vectors**: `{iso_metrics['anomaly_samples']:,} ({iso_metrics['anomaly_percentage']:.2f}%)`
- **Normal Telemetry Vectors**: `{iso_metrics['normal_samples']:,} ({100 - iso_metrics['anomaly_percentage']:.2f}%)`
- **Decision Score Range**: `[{iso_metrics['decision_score_min']:.4f}, {iso_metrics['decision_score_max']:.4f}]`

### 2.2 Anomaly Distribution by Chemical Species
| Chemical Species | Total Observations | Isolated Anomalies | Anomaly Rate (%) |
| :--- | :--- | :--- | :--- |
{gas_breakdown_md}

### 2.3 Anomaly Distribution by Concentration Tier
| Concentration Tier | Total Observations | Isolated Anomalies | Anomaly Rate (%) |
| :--- | :--- | :--- | :--- |
{conc_breakdown_md}

---

## 3. Persisted Artifacts & Deployment Models

All artifacts are persisted under `c:\\Horizon\\backend\\machine learning\\`:

### Models (`models/`):
- `random_forest_classifier.joblib`: Serialized 150-tree multi-class classifier
- `random_forest_regressor.joblib`: Serialized 100-tree PPM regressor
- `isolation_forest.joblib`: Serialized 150-tree unsupervised anomaly detector
- `sensor_scaler.joblib`: Standardized feature transformer

### Outputs (`outputs/`):
- `confusion_matrix.png`: High-resolution classification confusion matrix
- `feature_importances.png`: Top 25 Figaro sensor channels bar chart
- `concentration_regression_plot.png`: Ground truth vs predicted PPM scatter plot
- `anomaly_score_distribution.png`: Decision boundary & anomaly score distribution
- `pca_anomaly_projection.png`: 2D PCA geometric projection of isolated outliers
- `anomaly_rate_by_gas.png`: Bar chart of anomaly frequency by gas class
- `feature_importances.csv`: Complete rankings of all 128 sensor features
- `isolation_forest_anomalies.csv`: Filtered anomalous sensor vectors
- `random_forest_metrics.json`: Full classification and regression metrics
- `isolation_forest_metrics.json`: Comprehensive anomaly profiling metrics
- `classification_report.txt` & `isolation_forest_report.txt`: Plain-text logs
"""
    summary_path = os.path.join(OUTPUTS_DIR, "ml_pipeline_summary.md")
    with open(summary_path, "w", encoding="utf-8") as f:
        f.write(summary_content)
    print(f"\n[Pipeline] Summary markdown generated at: {summary_path}")

def main():
    start_time = time.time()
    print("="*70)
    print("HORIZONX MACHINE LEARNING PIPELINE EXECUTION")
    print("="*70)

    # 1. Load Data
    df = load_and_validate_data()

    # 2. Random Forest
    clf_metrics, scaler = run_random_forest_classification(df)
    reg_metrics = run_random_forest_regression(df, scaler)
    rf_metrics = {
        "classification": clf_metrics,
        "regression": reg_metrics
    }
    rf_json_path = os.path.join(OUTPUTS_DIR, "random_forest_metrics.json")
    with open(rf_json_path, "w") as f:
        json.dump(rf_metrics, f, indent=2)

    # 3. Isolation Forest
    iso_metrics = run_isolation_forest(df, contamination=0.05)

    # 4. Generate Markdown Summary
    generate_markdown_summary(rf_metrics, iso_metrics)

    elapsed = time.time() - start_time
    print("\n" + "="*70)
    print(f"PIPELINE COMPLETE - Total Runtime: {elapsed:.2f} seconds")
    print("="*70)

if __name__ == "__main__":
    main()
