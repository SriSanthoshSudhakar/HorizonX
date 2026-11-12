import os
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    classification_report,
    confusion_matrix,
    r2_score,
    mean_absolute_error,
    root_mean_squared_error
)

# Paths configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "output", "processed_gas_sensor_data.csv"))
MODELS_DIR = os.path.join(BASE_DIR, "models")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)

# Gas Species Mapping (Sensor Array Calibration Specification)
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
    print(f"[Random Forest] Loading historical telemetry from: {DATA_PATH}")
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    print(f"[Random Forest] Dataset loaded successfully. Shape: {df.shape}")
    
    # Check nulls
    null_count = df.isnull().sum().sum()
    if null_count > 0:
        print(f"[Random Forest] Found {null_count} nulls. Imputing with median.")
        df = df.fillna(df.median(numeric_only=True))
    else:
        print("[Random Forest] Data integrity check passed: 0 missing/null values.")

    return df

def run_random_forest_classification(df):
    """Executes multi-class Random Forest classification for gas species."""
    print("\n" + "="*60)
    print("STEP 1: RANDOM FOREST CLASSIFIER (GAS TYPE IDENTIFICATION)")
    print("="*60)

    feature_cols = [c for c in df.columns if c.startswith("feature_")]
    X = df[feature_cols].values
    y = df["gas_type"].values
    gas_names = [GAS_SPECIES_MAP[i] for i in sorted(GAS_SPECIES_MAP.keys())]

    # Strict Featurization Ordering: Stratified split BEFORE scaling
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Training samples: {X_train.shape[0]} | Testing samples: {X_test.shape[0]}")

    # Standardize numerical features using training statistics
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Save fitted scaler for future inference
    scaler_path = os.path.join(MODELS_DIR, "sensor_scaler.joblib")
    joblib.dump(scaler, scaler_path)
    print(f"Fitted StandardScaler saved to: {scaler_path}")

    # Initialize Random Forest Classifier
    rf_clf = RandomForestClassifier(
        n_estimators=150,
        max_depth=22,
        min_samples_split=4,
        min_samples_leaf=1,
        max_features="sqrt",
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )

    # 5-Fold Stratified Cross-Validation
    print("Running 5-fold stratified cross-validation on training partition...")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(rf_clf, X_train_scaled, y_train, cv=cv, scoring="accuracy")
    print(f"5-Fold Cross-Validation Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")

    # Fit Model
    print("Fitting Random Forest Classifier on complete training dataset...")
    rf_clf.fit(X_train_scaled, y_train)

    # Predict Test Set
    y_pred = rf_clf.predict(X_test_scaled)
    y_prob = rf_clf.predict_proba(X_test_scaled)

    # Compute Metrics
    acc = accuracy_score(y_test, y_pred)
    prec_macro, rec_macro, f1_macro, _ = precision_recall_fscore_support(y_test, y_pred, average="macro")
    prec_weighted, rec_weighted, f1_weighted, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted")
    cm = confusion_matrix(y_test, y_pred)
    cr_dict = classification_report(y_test, y_pred, target_names=gas_names, output_dict=True)
    cr_text = classification_report(y_test, y_pred, target_names=gas_names)

    print("\n--- CLASSIFICATION TEST RESULTS ---")
    print(f"Accuracy:          {acc*100:.2f}%")
    print(f"F1-Score (Macro):  {f1_macro*100:.2f}%")
    print(f"F1-Score (Weight): {f1_weighted*100:.2f}%")
    print("\nDetailed Per-Class Report:\n" + cr_text)

    # Save classification text report
    with open(os.path.join(OUTPUTS_DIR, "classification_report.txt"), "w") as f:
        f.write("HORIZONX - RANDOM FOREST GAS CLASSIFIER REPORT\n")
        f.write("="*50 + "\n")
        f.write(f"Overall Accuracy: {acc*100:.2f}%\n")
        f.write(f"5-Fold CV Accuracy: {cv_scores.mean()*100:.2f}%\n\n")
        f.write(cr_text)

    # Plot Confusion Matrix
    plt.figure(figsize=(8, 6))
    plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title('Random Forest - Confusion Matrix (Gas Species Identification)', fontsize=12, fontweight='bold', pad=12)
    plt.colorbar(fraction=0.046, pad=0.04)
    tick_marks = np.arange(len(gas_names))
    plt.xticks(tick_marks, gas_names, rotation=35, ha='right', fontsize=9)
    plt.yticks(tick_marks, gas_names, fontsize=9)

    thresh = cm.max() / 2.
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(j, i, format(cm[i, j], 'd'),
                     ha="center", va="center",
                     color="white" if cm[i, j] > thresh else "black",
                     fontweight='bold', fontsize=10)

    plt.ylabel('Ground Truth Species', fontweight='bold', fontsize=10)
    plt.xlabel('Model Predicted Species', fontweight='bold', fontsize=10)
    plt.tight_layout()
    cm_path = os.path.join(OUTPUTS_DIR, "confusion_matrix.png")
    plt.savefig(cm_path, dpi=300)
    plt.close()
    print(f"Confusion Matrix plot saved to: {cm_path}")

    # Top 25 Feature Importances
    importances = rf_clf.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    top_n = 25
    top_features = [feature_cols[i] for i in sorted_idx[:top_n]]
    top_importances = [float(importances[i]) for i in sorted_idx[:top_n]]

    feat_df = pd.DataFrame({
        "sensor_feature": [feature_cols[i] for i in sorted_idx],
        "importance_weight": [float(importances[i]) for i in sorted_idx]
    })
    feat_csv_path = os.path.join(OUTPUTS_DIR, "feature_importances.csv")
    feat_df.to_csv(feat_csv_path, index=False)
    print(f"Full feature importances saved to: {feat_csv_path}")

    # Plot Top 25 Feature Importances
    plt.figure(figsize=(10, 6))
    plt.barh(range(top_n), top_importances[::-1], color='#2563eb', align='center', edgecolor='#1e40af')
    plt.yticks(range(top_n), top_features[::-1], fontsize=8)
    plt.xlabel('Gini Importance (Information Gain Weight)', fontweight='bold', fontsize=10)
    plt.title('Top 25 Most Influential Figaro Sensor Channels', fontweight='bold', fontsize=12, pad=12)
    plt.grid(axis='x', linestyle='--', alpha=0.5)
    plt.tight_layout()
    fi_path = os.path.join(OUTPUTS_DIR, "feature_importances.png")
    plt.savefig(fi_path, dpi=300)
    plt.close()
    print(f"Feature importance barplot saved to: {fi_path}")

    # Save trained classifier
    model_path = os.path.join(MODELS_DIR, "random_forest_classifier.joblib")
    joblib.dump(rf_clf, model_path)
    print(f"Trained Random Forest Classifier saved to: {model_path}")

    metrics_dict = {
        "model_type": "RandomForestClassifier",
        "total_samples": len(df),
        "test_samples": len(y_test),
        "accuracy": float(acc),
        "cv_5fold_mean_accuracy": float(cv_scores.mean()),
        "cv_5fold_std_accuracy": float(cv_scores.std()),
        "macro_precision": float(prec_macro),
        "macro_recall": float(rec_macro),
        "macro_f1": float(f1_macro),
        "weighted_f1": float(f1_weighted),
        "confusion_matrix": cm.tolist(),
        "per_class_report": cr_dict,
        "top_features": list(zip(top_features, top_importances))
    }

    return metrics_dict, scaler

def run_random_forest_regression(df, scaler):
    """Executes Random Forest regression to predict continuous gas concentration (PPM)."""
    print("\n" + "="*60)
    print("STEP 2: RANDOM FOREST REGRESSOR (CONCENTRATION ESTIMATION)")
    print("="*60)

    feature_cols = [c for c in df.columns if c.startswith("feature_")]
    X = df[feature_cols].values
    y = df["concentration"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )

    X_train_scaled = scaler.transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    rf_reg = RandomForestRegressor(
        n_estimators=100,
        max_depth=16,
        min_samples_split=4,
        random_state=42,
        n_jobs=-1
    )

    print("Fitting Random Forest Regressor for gas concentration...")
    rf_reg.fit(X_train_scaled, y_train)

    y_pred = rf_reg.predict(X_test_scaled)

    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = root_mean_squared_error(y_test, y_pred)

    print(f"R² Score:             {r2:.4f}")
    print(f"Mean Absolute Error:  {mae:.2f} PPM")
    print(f"Root Mean Sq Error:   {rmse:.2f} PPM")

    # Plot Actual vs Predicted Concentration
    plt.figure(figsize=(7, 6))
    plt.scatter(y_test, y_pred, alpha=0.35, color='#059669', s=16, edgecolors='none')
    min_val = min(float(y_test.min()), float(y_pred.min()))
    max_val = max(float(y_test.max()), float(y_pred.max()))
    plt.plot([min_val, max_val], [min_val, max_val], 'r--', lw=2, label='Ideal 1:1 Identity')
    plt.xlabel('Ground Truth Concentration (PPM)', fontweight='bold', fontsize=10)
    plt.ylabel('Random Forest Predicted (PPM)', fontweight='bold', fontsize=10)
    plt.title(f'Gas Concentration Regression (R² = {r2:.3f}, MAE = {mae:.1f} PPM)', fontweight='bold', fontsize=11, pad=12)
    plt.legend()
    plt.grid(True, linestyle='--', alpha=0.4)
    plt.tight_layout()
    reg_plot_path = os.path.join(OUTPUTS_DIR, "concentration_regression_plot.png")
    plt.savefig(reg_plot_path, dpi=300)
    plt.close()
    print(f"Regression scatter plot saved to: {reg_plot_path}")

    # Save trained regressor
    reg_model_path = os.path.join(MODELS_DIR, "random_forest_regressor.joblib")
    joblib.dump(rf_reg, reg_model_path)
    print(f"Trained Random Forest Regressor saved to: {reg_model_path}")

    reg_metrics = {
        "model_type": "RandomForestRegressor",
        "r2_score": float(r2),
        "mean_absolute_error_ppm": float(mae),
        "root_mean_squared_error_ppm": float(rmse),
        "min_ppm": float(y_test.min()),
        "max_ppm": float(y_test.max())
    }

    return reg_metrics

def main():
    print("="*60)
    print("HORIZONX - RANDOM FOREST MACHINE LEARNING PIPELINE")
    print("="*60)
    
    df = load_and_validate_data()
    clf_metrics, scaler = run_random_forest_classification(df)
    reg_metrics = run_random_forest_regression(df, scaler)

    # Export consolidated Random Forest metrics JSON
    final_output = {
        "classification": clf_metrics,
        "regression": reg_metrics
    }
    metrics_json_path = os.path.join(OUTPUTS_DIR, "random_forest_metrics.json")
    with open(metrics_json_path, "w") as f:
        json.dump(final_output, f, indent=2)
    print(f"\n[Random Forest] All metrics consolidated into: {metrics_json_path}")
    print("[Random Forest] Pipeline execution completed successfully.")

if __name__ == "__main__":
    main()
