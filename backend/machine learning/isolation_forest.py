import os
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from sklearn.ensemble import IsolationForest
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

# Paths configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "output", "processed_gas_sensor_data.csv"))
MODELS_DIR = os.path.join(BASE_DIR, "models")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)

GAS_SPECIES_MAP = {
    1: "Ethanol",
    2: "Ethylene",
    3: "Ammonia",
    4: "Acetaldehyde",
    5: "Acetone",
    6: "Toluene"
}

def load_and_validate_data():
    """Loads historical gas sensor data and validates integrity."""
    print(f"[Isolation Forest] Loading historical telemetry from: {DATA_PATH}")
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    print(f"[Isolation Forest] Dataset loaded successfully. Shape: {df.shape}")

    null_count = df.isnull().sum().sum()
    if null_count > 0:
        print(f"[Isolation Forest] Found {null_count} nulls. Imputing with median.")
        df = df.fillna(df.median(numeric_only=True))
    else:
        print("[Isolation Forest] Data integrity check passed: 0 missing/null values.")

    return df

def run_isolation_forest(df, contamination=0.05):
    """
    Fits Isolation Forest on the 128 sensor features, tags outliers,
    computes anomaly scores, and generates analytical reports and charts.
    """
    print("\n" + "="*60)
    print("STEP 1: ISOLATION FOREST ANOMALY DETECTION TRAINING")
    print("="*60)

    feature_cols = [c for c in df.columns if c.startswith("feature_")]
    X = df[feature_cols].values
    total_samples = len(df)

    print(f"Total Telemetry Vectors: {total_samples}")
    print(f"Sensor Feature Dimensions: {X.shape[1]}")
    print(f"Target Contamination Rate: {contamination * 100:.1f}%")

    # Fit Isolation Forest
    iso_forest = IsolationForest(
        n_estimators=150,
        contamination=contamination,
        max_samples="auto",
        random_state=42,
        n_jobs=-1
    )

    print("Fitting Isolation Forest model...")
    iso_forest.fit(X)

    # Predictions (-1: Outlier/Anomaly, 1: Normal Inlier)
    predictions = iso_forest.predict(X)
    # Decision function: lower/negative = anomalous, higher/positive = normal
    decision_scores = iso_forest.decision_function(X)
    
    # Normalized Anomaly Score (0.0 to 1.0, where > 0.5 is anomalous)
    # IsolationForest.score_samples returns opposite of decision_function (lower is more anomalous)
    # Using normalized decision score for intuitive consumption:
    min_score = decision_scores.min()
    max_score = decision_scores.max()
    normalized_scores = 1.0 - ((decision_scores - min_score) / (max_score - min_score))

    df_annotated = df.copy()
    df_annotated["is_anomaly"] = (predictions == -1).astype(int)
    df_annotated["anomaly_status"] = np.where(predictions == -1, "ANOMALY", "NORMAL")
    df_annotated["decision_score"] = decision_scores
    df_annotated["anomaly_score_normalized"] = normalized_scores
    df_annotated["gas_name"] = df_annotated["gas_type"].map(GAS_SPECIES_MAP)

    anomaly_count = int((predictions == -1).sum())
    normal_count = int((predictions == 1).sum())
    anomaly_pct = (anomaly_count / total_samples) * 100

    print("\n--- ANOMALY DETECTION SUMMARY ---")
    print(f"Total Vectors Evaluated: {total_samples}")
    print(f"Normal Telemetry Points: {normal_count} ({(normal_count / total_samples) * 100:.2f}%)")
    print(f"Detected Anomalies:      {anomaly_count} ({anomaly_pct:.2f}%)")
    print(f"Decision Score Range:    [{decision_scores.min():.4f}, {decision_scores.max():.4f}]")

    # Anomaly Breakdown by Gas Species
    gas_breakdown = {}
    print("\nAnomaly Breakdown by Gas Species:")
    for gas_id, gas_name in GAS_SPECIES_MAP.items():
        subset = df_annotated[df_annotated["gas_type"] == gas_id]
        n_gas = len(subset)
        n_anom = int(subset["is_anomaly"].sum())
        pct_anom = (n_anom / n_gas * 100) if n_gas > 0 else 0.0
        gas_breakdown[gas_name] = {
            "gas_id": gas_id,
            "total_samples": n_gas,
            "anomalies": n_anom,
            "anomaly_rate_pct": round(pct_anom, 2)
        }
        print(f"  - {gas_name:<14}: {n_anom:>4}/{n_gas:>4} anomalies ({pct_anom:5.2f}%)")

    # Anomaly Breakdown by Concentration Tier
    conc_quantiles = df_annotated["concentration"].quantile([0.33, 0.66]).values
    df_annotated["concentration_tier"] = pd.cut(
        df_annotated["concentration"],
        bins=[-np.inf, conc_quantiles[0], conc_quantiles[1], np.inf],
        labels=["Low (<{:.1f} PPM)".format(conc_quantiles[0]),
                "Medium ({:.1f}-{:.1f} PPM)".format(conc_quantiles[0], conc_quantiles[1]),
                "High (>{:.1f} PPM)".format(conc_quantiles[1])]
    )
    conc_breakdown = {}
    print("\nAnomaly Breakdown by Concentration Tier:")
    for tier, group in df_annotated.groupby("concentration_tier", observed=False):
        n_tier = len(group)
        n_anom = int(group["is_anomaly"].sum())
        pct_anom = (n_anom / n_tier * 100) if n_tier > 0 else 0.0
        conc_breakdown[str(tier)] = {
            "total_samples": n_tier,
            "anomalies": n_anom,
            "anomaly_rate_pct": round(pct_anom, 2)
        }
        print(f"  - {str(tier):<24}: {n_anom:>4}/{n_tier:>4} anomalies ({pct_anom:5.2f}%)")

    # Save Anomalous Records to CSV
    anomalies_df = df_annotated[df_annotated["is_anomaly"] == 1]
    anomalies_csv_path = os.path.join(OUTPUTS_DIR, "isolation_forest_anomalies.csv")
    anomalies_df.to_csv(anomalies_csv_path, index=False)
    print(f"\n[Isolation Forest] Anomalous records exported to: {anomalies_csv_path}")

    # Save Trained Model
    model_path = os.path.join(MODELS_DIR, "isolation_forest.joblib")
    joblib.dump(iso_forest, model_path)
    print(f"[Isolation Forest] Model serialized to: {model_path}")

    # Generate Visualizations
    print("\nGenerating Isolation Forest analytical visualizations...")

    # Visualization 1: Anomaly Score Distribution Histogram
    plt.figure(figsize=(9, 5))
    normal_scores = df_annotated[df_annotated["is_anomaly"] == 0]["decision_score"]
    anom_scores = df_annotated[df_annotated["is_anomaly"] == 1]["decision_score"]

    plt.hist(normal_scores, bins=60, color='#2563eb', alpha=0.7, label='Normal Telemetry', edgecolor='black', linewidth=0.5)
    plt.hist(anom_scores, bins=30, color='#dc2626', alpha=0.85, label='Detected Anomalies', edgecolor='black', linewidth=0.5)
    plt.axvline(0.0, color='black', linestyle='--', linewidth=1.5, label='Zero Decision Boundary')
    plt.title('Isolation Forest - Telemetry Anomaly Score Distribution', fontweight='bold', fontsize=12, pad=12)
    plt.xlabel('Decision Function Score (Negative indicates Outlier Isolation)', fontweight='bold', fontsize=10)
    plt.ylabel('Observation Frequency', fontweight='bold', fontsize=10)
    plt.legend(frameon=True)
    plt.grid(True, linestyle='--', alpha=0.4)
    plt.tight_layout()
    dist_plot_path = os.path.join(OUTPUTS_DIR, "anomaly_score_distribution.png")
    plt.savefig(dist_plot_path, dpi=300)
    plt.close()
    print(f"Score distribution plot saved to: {dist_plot_path}")

    # Visualization 2: 2D PCA Dimensionality Projection
    print("Computing 2D PCA projection for geometric anomaly visualization...")
    scaler = StandardScaler()
    X_std = scaler.fit_transform(X)
    pca = PCA(n_components=2, random_state=42)
    X_pca = pca.fit_transform(X_std)
    var_exp = pca.explained_variance_ratio_ * 100

    plt.figure(figsize=(9, 6))
    normal_mask = (predictions == 1)
    anomaly_mask = (predictions == -1)

    plt.scatter(
        X_pca[normal_mask, 0], X_pca[normal_mask, 1],
        c='#3b82f6', alpha=0.4, s=14, label='Normal Inliers', edgecolors='none'
    )
    plt.scatter(
        X_pca[anomaly_mask, 0], X_pca[anomaly_mask, 1],
        c='#ef4444', alpha=0.85, s=28, label='Isolated Anomalies / Outliers', edgecolors='#991b1b', linewidth=0.5
    )
    plt.title(f'Isolation Forest - 2D PCA Sensor Space Projection (Var Exp: {var_exp[0]:.1f}%, {var_exp[1]:.1f}%)',
              fontweight='bold', fontsize=11, pad=12)
    plt.xlabel(f'Principal Component 1 ({var_exp[0]:.1f}% Variance)', fontweight='bold', fontsize=10)
    plt.ylabel(f'Principal Component 2 ({var_exp[1]:.1f}% Variance)', fontweight='bold', fontsize=10)
    plt.legend(frameon=True, loc='best')
    plt.grid(True, linestyle='--', alpha=0.4)
    plt.tight_layout()
    pca_plot_path = os.path.join(OUTPUTS_DIR, "pca_anomaly_projection.png")
    plt.savefig(pca_plot_path, dpi=300)
    plt.close()
    print(f"PCA anomaly projection plot saved to: {pca_plot_path}")

    # Visualization 3: Anomaly Rate by Gas Species Bar Chart
    species_names = list(gas_breakdown.keys())
    rates = [gas_breakdown[s]["anomaly_rate_pct"] for s in species_names]
    plt.figure(figsize=(8, 5))
    bars = plt.bar(species_names, rates, color='#f59e0b', edgecolor='#b45309')
    plt.axhline(contamination * 100, color='#dc2626', linestyle='--', linewidth=1.5, label=f'Baseline Contamination ({contamination*100:.1f}%)')
    for bar in bars:
        h = bar.get_height()
        plt.text(bar.get_x() + bar.get_width() / 2., h + 0.15, f'{h:.1f}%',
                 ha='center', va='bottom', fontsize=9, fontweight='bold')
    plt.title('Outlier Frequency Rate Across Chemical Gas Classes', fontweight='bold', fontsize=11, pad=12)
    plt.ylabel('Anomaly Occurrence Rate (%)', fontweight='bold', fontsize=10)
    plt.xlabel('Chemical Gas Species', fontweight='bold', fontsize=10)
    plt.legend(frameon=True)
    plt.grid(axis='y', linestyle='--', alpha=0.4)
    plt.tight_layout()
    bar_plot_path = os.path.join(OUTPUTS_DIR, "anomaly_rate_by_gas.png")
    plt.savefig(bar_plot_path, dpi=300)
    plt.close()
    print(f"Anomaly rate by gas plot saved to: {bar_plot_path}")

    # Top Deviating Features between Normal and Anomalies
    mean_normal = df_annotated[df_annotated["is_anomaly"] == 0][feature_cols].mean()
    mean_anom = df_annotated[df_annotated["is_anomaly"] == 1][feature_cols].mean()
    abs_diff = (mean_anom - mean_normal).abs()
    top_deviating = abs_diff.sort_values(ascending=False).head(10).to_dict()

    # Compile JSON Metrics
    metrics_dict = {
        "model_type": "IsolationForest",
        "contamination_parameter": float(contamination),
        "total_samples": int(total_samples),
        "normal_samples": int(normal_count),
        "anomaly_samples": int(anomaly_count),
        "anomaly_percentage": float(anomaly_pct),
        "decision_score_min": float(decision_scores.min()),
        "decision_score_max": float(decision_scores.max()),
        "decision_score_mean": float(decision_scores.mean()),
        "gas_species_breakdown": gas_breakdown,
        "concentration_tier_breakdown": conc_breakdown,
        "pca_variance_explained": [float(v) for v in var_exp],
        "top_deviating_features_abs_diff": top_deviating
    }

    metrics_json_path = os.path.join(OUTPUTS_DIR, "isolation_forest_metrics.json")
    with open(metrics_json_path, "w") as f:
        json.dump(metrics_dict, f, indent=2)
    print(f"[Isolation Forest] Metrics JSON saved to: {metrics_json_path}")

    # Text Report
    report_txt_path = os.path.join(OUTPUTS_DIR, "isolation_forest_report.txt")
    with open(report_txt_path, "w") as f:
        f.write("HORIZONX - ISOLATION FOREST SENSOR ANOMALY DETECTION REPORT\n")
        f.write("="*60 + "\n")
        f.write(f"Total Vectors Evaluated:    {total_samples:,}\n")
        f.write(f"Normal Inlier Vectors:      {normal_count:,} ({(normal_count/total_samples)*100:.2f}%)\n")
        f.write(f"Detected Anomaly Vectors:   {anomaly_count:,} ({anomaly_pct:.2f}%)\n")
        f.write(f"Contamination Threshold:    {contamination*100:.1f}%\n\n")
        f.write("Breakdown by Gas Species:\n")
        for g, d in gas_breakdown.items():
            f.write(f"  {g:<15}: {d['anomalies']:>4} / {d['total_samples']:>4} ({d['anomaly_rate_pct']:5.2f}%)\n")
        f.write("\nBreakdown by Concentration Tier:\n")
        for c, d in conc_breakdown.items():
            f.write(f"  {c:<24}: {d['anomalies']:>4} / {d['total_samples']:>4} ({d['anomaly_rate_pct']:5.2f}%)\n")
    print(f"[Isolation Forest] Text report saved to: {report_txt_path}")

    return metrics_dict

def main():
    print("="*60)
    print("HORIZONX - ISOLATION FOREST MACHINE LEARNING PIPELINE")
    print("="*60)
    df = load_and_validate_data()
    run_isolation_forest(df, contamination=0.05)
    print("\n[Isolation Forest] Execution completed successfully.")

if __name__ == "__main__":
    main()
