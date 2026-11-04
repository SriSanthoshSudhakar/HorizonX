import os
import pandas as pd
import numpy as np
from fastapi import APIRouter

router = APIRouter(prefix="/api/analytics", tags=["Telemetry"])

POSSIBLE_PATHS = [
    r"C:\Horizon\backend\spark\processed_gas_sensor_data.csv",
    r"C:\Horizon\output\processed_gas_sensor_data.csv",
    r"C:\Horizon\analytics\processed_gas_sensor_data.csv"
]

CSV_PATH = next((p for p in POSSIBLE_PATHS if os.path.exists(p)), POSSIBLE_PATHS[0])
BATCH_DIR = r"C:\Horizon\gas sensor"

try:
    print(f"Loading telemetry data from {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH)
    if 'gas_type' in df.columns:
        df['gas_type'] = df['gas_type'].astype(int).astype(str)
    print(f"Telemetry data loaded successfully with {len(df)} records.")
except Exception as e:
    print(f"Failed to load data: {e}")
    df = pd.DataFrame()

GAS_NAMES = {
    "1": "Ethanol",
    "2": "Ethylene",
    "3": "Ammonia",
    "4": "Acetaldehyde",
    "5": "Acetone",
    "6": "Toluene"
}

@router.get("/summary")
def get_summary_stats():
    if df.empty:
        return {"error": "Data not loaded"}
    
    total_samples = len(df)
    high_concentration = len(df[df['concentration'] > 50])
    gas_types = int(df['gas_type'].nunique())
    avg_concentration = round(df['concentration'].mean(), 2)
    
    return {
        "total_samples": total_samples,
        "high_concentration_alerts": high_concentration,
        "unique_gas_types": gas_types,
        "average_concentration": avg_concentration
    }

# ==================== ADVANCED D3.JS NON-STANDARD VISUALIZATION ENDPOINTS ====================

# 1. D3 Multi-Batch Organic Streamgraph (Drift evolution across 10 recording batches / 36 months)
@router.get("/d3/streamgraph")
def get_d3_streamgraph():
    stream_data = []
    for b_num in range(1, 11):
        path = os.path.join(BATCH_DIR, f"batch{b_num}.dat")
        counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0}
        if os.path.exists(path):
            with open(path, "r") as f:
                for line in f:
                    if not line.strip(): continue
                    parts = line.split(";")
                    try:
                        g = int(parts[0])
                        counts[g] = counts.get(g, 0) + 1
                    except (ValueError, IndexError):
                        continue
        stream_data.append({
            "batch": f"Batch {b_num:02d}",
            "batch_id": b_num,
            "Ethanol": counts[1],
            "Ethylene": counts[2],
            "Ammonia": counts[3],
            "Acetaldehyde": counts[4],
            "Acetone": counts[5],
            "Toluene": counts[6],
            "total": sum(counts.values())
        })
    return stream_data

# 2. D3 16-Channel Radial Sensor Array Radar / Fingerprint
@router.get("/d3/radar")
def get_d3_radar():
    if df.empty:
        return {}
    sensors = [f"feature_{1 + i*8}" for i in range(16)]
    radar_data = {}
    for gid in range(1, 7):
        sub = df[df['gas_type'] == str(gid)]
        if sub.empty:
            continue
        means = sub[sensors].mean().values
        min_v, max_v = means.min(), means.max()
        norm = ((means - min_v) / (max_v - min_v + 1e-6) * 100).round(1).tolist()
        radar_data[str(gid)] = [
            {
                "sensor": f"S{i+1:02d}",
                "channel": i + 1,
                "value": norm[i],
                "raw": round(float(means[i]), 1)
            }
            for i in range(16)
        ]
    return radar_data

# 3. D3 High-Dimensional Parallel Coordinates Plot (PCP)
@router.get("/d3/parallel-coordinates")
def get_d3_parallel_coordinates():
    if df.empty:
        return {"axes": [], "points": []}
    
    sensor_keys = [
        ("conc", "concentration"),
        ("s01", "feature_1"),
        ("s03", "feature_17"),
        ("s05", "feature_33"),
        ("s07", "feature_49"),
        ("s09", "feature_65"),
        ("s11", "feature_81"),
        ("s13", "feature_97")
    ]
    
    # 250 diverse sampled points for fluid 60fps SVG rendering
    sample = df.sample(min(250, len(df)), random_state=42)
    points = []
    for _, r in sample.iterrows():
        pt = {
            "gas_type": str(int(float(r["gas_type"]))),
            "label": GAS_NAMES.get(str(int(float(r["gas_type"]))), "Gas"),
            "concentration": round(float(r["concentration"]), 1)
        }
        for sk, fk in sensor_keys:
            pt[sk] = round(float(r.get(fk, 0)), 1)
        points.append(pt)
    
    axes_def = [
        {"key": "conc", "label": "Concentration (PPM)"},
        {"key": "s01", "label": "Sensor 01"},
        {"key": "s03", "label": "Sensor 03"},
        {"key": "s05", "label": "Sensor 05"},
        {"key": "s07", "label": "Sensor 07"},
        {"key": "s09", "label": "Sensor 09"},
        {"key": "s11", "label": "Sensor 11"},
        {"key": "s13", "label": "Sensor 13"}
    ]
    
    return {
        "axes": axes_def,
        "points": points
    }

# 4. D3 Zoomable Sunburst Hierarchy (Batch 1-10 -> Gas 1-6 -> Concentration Tiers)
@router.get("/d3/sunburst")
def get_d3_sunburst():
    root = {"name": "Array Fleet", "children": []}
    for b_num in range(1, 11):
        path = os.path.join(BATCH_DIR, f"batch{b_num}.dat")
        if not os.path.exists(path): continue
        batch_node = {"name": f"Batch {b_num:02d}", "children": []}
        gas_counts = {}
        with open(path, "r") as f:
            for line in f:
                if not line.strip(): continue
                parts = line.split(";")
                try:
                    g = int(parts[0])
                    conc = float(parts[1].split(" ")[0])
                    tier = "Low (<30PPM)" if conc < 30 else ("Nominal (30-80PPM)" if conc <= 80 else "Critical (>80PPM)")
                    if g not in gas_counts: gas_counts[g] = {}
                    gas_counts[g][tier] = gas_counts[g].get(tier, 0) + 1
                except (ValueError, IndexError):
                    continue
        for g, tiers in gas_counts.items():
            g_node = {"name": GAS_NAMES.get(str(g), f"Gas {g}"), "gas_type": str(g), "children": []}
            for tier, c in tiers.items():
                g_node["children"].append({"name": tier, "value": c})
            batch_node["children"].append(g_node)
        root["children"].append(batch_node)
    return root

# 5. D3 Ridgeline Plot (Overlapping Joyplot Density Crests for all 6 Gas Classes)
@router.get("/d3/ridgeline")
def get_d3_ridgeline():
    if df.empty:
        return []
    ridgeline = []
    bins = np.linspace(0, 160, 45)
    for gid in range(1, 7):
        sub = df[df["gas_type"] == str(gid)]
        concs = sub["concentration"].dropna()
        if len(concs) == 0:
            continue
        counts, edges = np.histogram(concs, bins=bins, density=True)
        curve = [
            {
                "ppm": round(float((edges[i] + edges[i+1]) / 2), 1),
                "density": round(float(counts[i]), 5)
            }
            for i in range(len(counts))
        ]
        ridgeline.append({
            "gas_type": str(gid),
            "label": GAS_NAMES[str(gid)],
            "median": round(float(concs.median()), 1),
            "curve": curve
        })
    return ridgeline
