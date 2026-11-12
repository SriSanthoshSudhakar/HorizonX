# HorizonX Machine Learning Pipeline Performance Report

## Executive Summary
This report documents the training and evaluation of the machine learning engines trained on **13,910 historical Figaro chemical sensor array telemetry vectors** across 128 sensory channels (`feature_1` through `feature_128`).

Two primary paradigms were developed and executed:
1. **Supervised Random Forest**: Multi-class classification (6 hazardous gas species) & continuous concentration regression (PPM).
2. **Unsupervised Isolation Forest**: Telemetry anomaly isolation, detecting corrupted baseline drift, electrical spikes, and volatile gas release events.

---

## 1. Supervised Learning: Random Forest

### 1.1 Multi-Class Gas Species Classification
The classifier identifies which of the 6 target gases is present based on multi-sensor conductivity signatures:
- **Test Set Accuracy**: `99.53%`
- **5-Fold Stratified Cross-Validation Accuracy**: `99.34% (+/- 0.29%)`
- **Macro-Averaged F1-Score**: `99.52%`
- **Weighted-Averaged F1-Score**: `99.53%`

#### Per-Class Performance
| Chemical Species | Precision | Recall | F1-Score | Test Support |
| :--- | :--- | :--- | :--- | :--- |
| **Ethanol** | 100.00% | 99.22% | 99.61% | 513.0 |
| **Ethylene** | 99.32% | 100.00% | 99.66% | 585.0 |
| **Ammonia** | 100.00% | 98.78% | 99.39% | 328.0 |
| **Acetaldehyde** | 99.48% | 99.48% | 99.48% | 387.0 |
| **Acetone** | 99.34% | 99.67% | 99.50% | 602.0 |
| **Toluene** | 99.19% | 99.73% | 99.46% | 367.0 |

### 1.2 Top 10 Most Discriminative Figaro Sensor Channels
The Gini importance (mean impurity reduction) pinpoints which physical sensor channels drive species discrimination:
| Rank | Channel Feature | Relative Importance |
| :--- | :--- | :--- |
| #1 | `feature_9` | 2.95% |
| #2 | `feature_13` | 2.48% |
| #3 | `feature_69` | 2.46% |
| #4 | `feature_11` | 2.39% |
| #5 | `feature_77` | 2.33% |
| #6 | `feature_16` | 2.27% |
| #7 | `feature_68` | 2.26% |
| #8 | `feature_12` | 1.94% |
| #9 | `feature_124` | 1.93% |
| #10 | `feature_65` | 1.84% |

### 1.3 Gas Concentration Regression (PPM Estimation)
The continuous regressor estimates exposure concentration levels across a dynamic operating range (1.0 to 1000.0 PPM):
- **Coefficient of Determination ($R^2$)**: `0.9648`
- **Mean Absolute Error (MAE)**: `8.39 PPM`
- **Root Mean Squared Error (RMSE)**: `32.24 PPM`

---

## 2. Unsupervised Learning: Isolation Forest

### 2.1 Anomaly Detection Baseline
Isolation Forest partitions the 128-dimensional telemetry space using 150 random recursive isolation trees:
- **Total Vectors Assessed**: `13,910`
- **Contamination Target**: `5.0%`
- **Detected Anomalous Vectors**: `696 (5.00%)`
- **Normal Telemetry Vectors**: `13,214 (95.00%)`
- **Decision Score Range**: `[-0.2026, 0.1966]`

### 2.2 Anomaly Distribution by Chemical Species
| Chemical Species | Total Observations | Isolated Anomalies | Anomaly Rate (%) |
| :--- | :--- | :--- | :--- |
| Ethanol | 2,565 | 136 | **5.30%** |
| Ethylene | 2,926 | 188 | **6.43%** |
| Ammonia | 1,641 | 22 | **1.34%** |
| Acetaldehyde | 1,936 | 17 | **0.88%** |
| Acetone | 3,009 | 333 | **11.07%** |
| Toluene | 1,833 | 0 | **0.00%** |

### 2.3 Anomaly Distribution by Concentration Tier
| Concentration Tier | Total Observations | Isolated Anomalies | Anomaly Rate (%) |
| :--- | :--- | :--- | :--- |
| Low (<60.0 PPM) | 4,685 | 0 | **0.00%** |
| Medium (60.0-175.0 PPM) | 4,625 | 41 | **0.89%** |
| High (>175.0 PPM) | 4,600 | 655 | **14.24%** |

---

## 3. Persisted Artifacts & Deployment Models

All artifacts are persisted under `c:\Horizon\backend\machine learning\`:

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
