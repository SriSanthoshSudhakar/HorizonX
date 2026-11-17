from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from database.connection import get_db_cursor

router = APIRouter(prefix="/api/live", tags=["Live Hardware Telemetry"])

# In-memory notification queue for instant toast delivery
import time
_latest_anomaly_alert: Optional[Dict[str, Any]] = None
_dismissed_alert_ids = set()
_last_occupancy_time: float = 0.0

class ESP32TelemetryPayload(BaseModel):
    device_id: Optional[str] = "HORIZONX_ESP32_01"
    mq2_sensor_1: Optional[int] = 0
    mq2_sensor_2: Optional[int] = 0
    mq2_level_1: Optional[str] = "NORMAL"
    mq2_level_2: Optional[str] = "NORMAL"
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    distance_cm: Optional[float] = None
    hazard_detected: Optional[bool] = False
    hazard_type: Optional[str] = "NORMAL"
    object_detected: Optional[bool] = False
    occupancy_status: Optional[str] = "CLEAR"
    fan_status: Optional[bool] = False
    buzzer_status: Optional[bool] = False
    rfid_uid: Optional[str] = ""
    rfid_detected: Optional[bool] = False
    gas_event: Optional[bool] = False
    occupancy_event: Optional[bool] = False

def evaluate_telemetry_anomaly(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates incoming hardware sensor telemetry for anomalies.
    Alerts when MQ sensor is >= 1200 or smoke is detected, and flags CRITICAL
    when an occupant (hand/face) is detected in front of the ultrasonic sensor.
    """
    global _last_occupancy_time
    now = time.time()

    mq1 = data.get("mq2_sensor_1") or 0
    mq2 = data.get("mq2_sensor_2") or 0
    hazard_flag = bool(data.get("hazard_detected")) or bool(data.get("gas_event"))

    # Parse ultrasonic distance
    dist = data.get("distance_cm")
    try:
        dist_val = float(dist) if dist is not None else None
    except (ValueError, TypeError):
        dist_val = None

    # Ultrasonic occupancy: hand or face detected in front of sensor (typically within 60 cm)
    is_near_ultrasonic = (dist_val is not None and 0.5 < dist_val <= 60.0)
    instant_occupancy = (
        is_near_ultrasonic
        or bool(data.get("object_detected"))
        or bool(data.get("occupancy_event"))
        or (data.get("occupancy_status") in ["POSSIBLE_OCCUPANCY", "OCCUPIED"])
    )

    if instant_occupancy:
        _last_occupancy_time = now

    # Latch occupancy for 15s during active hazard so alerts do not drop on ultrasonic pulse jitter
    is_occupancy_active = instant_occupancy or ((now - _last_occupancy_time) < 15.0)

    # Smoke / Gas condition: MQ sensor >= 1200 ADC or hardware smoke flag (elevated above 800)
    is_smoke_or_gas = (mq1 >= 1200) or (mq2 >= 1200) or (hazard_flag and (mq1 >= 800 or mq2 >= 800))

    if is_smoke_or_gas:
        is_anomaly = True
        dist_text = f"at {dist_val:.1f} cm" if dist_val else "in sensor zone"
        if is_occupancy_active:
            severity = "CRITICAL"
            reason = f"CRITICAL: Occupancy detected ({dist_text}) in active smoke/gas zone (MQ1: {mq1}, MQ2: {mq2})!"
            anomaly_score = 0.99
        else:
            severity = "HIGH"
            reason = f"HAZARD: Elevated smoke/gas detected (MQ1: {mq1}, MQ2: {mq2}). Exhaust ventilation active."
            anomaly_score = 0.85
    else:
        is_anomaly = False
        severity = "NORMAL"
        reason = f"Nominal baseline - MQ sensors below threshold (MQ1: {mq1}, MQ2: {mq2})."
        anomaly_score = 0.05

    return {
        "is_anomaly": is_anomaly,
        "severity": severity,
        "is_occupancy": is_occupancy_active,
        "distance_cm": dist_val,
        "anomaly_reason": reason,
        "anomaly_score": anomaly_score
    }

def save_telemetry_to_db(data: Dict[str, Any], anomaly_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Persists the incoming telemetry reading into PostgreSQL (live_sensor_telemetry).
    """
    query = """
    INSERT INTO live_sensor_telemetry (
        device_id, mq2_sensor_1, mq2_sensor_2, mq2_level_1, mq2_level_2,
        temperature, humidity, distance_cm, hazard_detected, hazard_type,
        object_detected, occupancy_status, fan_status, buzzer_status,
        rfid_uid, rfid_detected, gas_event, occupancy_event,
        is_anomaly, anomaly_score, anomaly_reason, created_at
    ) VALUES (
        %s, %s, %s, %s, %s,
        %s, %s, %s, %s, %s,
        %s, %s, %s, %s,
        %s, %s, %s, %s,
        %s, %s, %s, CURRENT_TIMESTAMP
    ) RETURNING *;
    """

    params = (
        data.get("device_id", "HORIZONX_ESP32_01"),
        data.get("mq2_sensor_1", 0),
        data.get("mq2_sensor_2", 0),
        data.get("mq2_level_1", "NORMAL"),
        data.get("mq2_level_2", "NORMAL"),
        data.get("temperature"),
        data.get("humidity"),
        data.get("distance_cm"),
        bool(data.get("hazard_detected", False)),
        data.get("hazard_type", "NORMAL"),
        bool(data.get("object_detected", False)),
        data.get("occupancy_status", "CLEAR"),
        bool(data.get("fan_status", False)),
        bool(data.get("buzzer_status", False)),
        data.get("rfid_uid", ""),
        bool(data.get("rfid_detected", False)),
        bool(data.get("gas_event", False)),
        bool(data.get("occupancy_event", False)),
        anomaly_info["is_anomaly"],
        anomaly_info["anomaly_score"],
        anomaly_info["anomaly_reason"]
    )

    with get_db_cursor(commit=True) as cur:
        cur.execute(query, params)
        row = cur.fetchone()
        return dict(row) if row else {}

@router.post("/ingest")
async def ingest_live_telemetry(payload: ESP32TelemetryPayload):
    """
    Direct ingestion endpoint for ESP32 hardware or simulation clients.
    """
    global _latest_anomaly_alert
    data_dict = payload.model_dump()
    
    # 1. Anomaly Evaluation
    anomaly_info = evaluate_telemetry_anomaly(data_dict)
    
    # 2. Database Persistence
    saved_record = save_telemetry_to_db(data_dict, anomaly_info)

    # 3. Update alert queue strictly if anomalous
    if anomaly_info["is_anomaly"]:
        _latest_anomaly_alert = {
            "id": saved_record.get("id"),
            "device_id": saved_record.get("device_id"),
            "severity": anomaly_info["severity"],
            "reason": anomaly_info["anomaly_reason"],
            "mq2_1": data_dict.get("mq2_sensor_1"),
            "mq2_2": data_dict.get("mq2_sensor_2"),
            "temperature": data_dict.get("temperature"),
            "distance_cm": anomaly_info.get("distance_cm") or data_dict.get("distance_cm"),
            "occupancy": "POSSIBLE_OCCUPANCY" if anomaly_info.get("is_occupancy") else "NO_OBJECT",
            "object_detected": bool(anomaly_info.get("is_occupancy")),
            "hazard_detected": True,
            "timestamp": datetime.now().isoformat()
        }
    else:
        # Clear active alert when telemetry drops back below threshold
        _latest_anomaly_alert = None

    return {
        "status": "success",
        "message": "Telemetry stored in database successfully",
        "record_id": saved_record.get("id"),
        "is_anomaly": anomaly_info["is_anomaly"],
        "severity": anomaly_info["severity"],
        "anomaly_reason": anomaly_info["anomaly_reason"]
    }

@router.get("/latest")
def get_latest_telemetry():
    """
    Retrieves the most recent hardware telemetry record from PostgreSQL.
    """
    query = "SELECT * FROM live_sensor_telemetry ORDER BY created_at DESC LIMIT 1;"
    with get_db_cursor() as cur:
        cur.execute(query)
        row = cur.fetchone()
        if not row:
            # Fallback nominal state if no records in DB yet
            return {
                "device_id": "HORIZONX_ESP32_01",
                "mq2_sensor_1": 420,
                "mq2_sensor_2": 390,
                "mq2_level_1": "NORMAL",
                "mq2_level_2": "NORMAL",
                "temperature": 24.5,
                "humidity": 52.0,
                "distance_cm": None,
                "hazard_detected": False,
                "hazard_type": "NORMAL",
                "object_detected": False,
                "occupancy_status": "CLEAR",
                "fan_status": False,
                "rfid_uid": "",
                "is_anomaly": False,
                "anomaly_score": 0.02,
                "anomaly_reason": "System standby - nominal baseline",
                "created_at": datetime.now().isoformat()
            }
        return dict(row)

@router.get("/history")
def get_telemetry_history(limit: int = Query(30, ge=5, le=200)):
    """
    Retrieves the last N records from PostgreSQL in chronological order for live charts.
    """
    query = """
    SELECT * FROM (
        SELECT * FROM live_sensor_telemetry ORDER BY created_at DESC LIMIT %s
    ) sub ORDER BY created_at ASC;
    """
    with get_db_cursor() as cur:
        cur.execute(query, (limit,))
        rows = cur.fetchall()
        return [dict(r) for r in rows]

@router.get("/alerts")
def get_live_alerts():
    """
    Returns active anomaly alerts STRICTLY when MQ sensor is >= 1200 or smoke hazard is detected.
    """
    global _latest_anomaly_alert
    
    # Query the last 10 historical anomaly records for the log
    query = """
    SELECT * FROM live_sensor_telemetry 
    WHERE is_anomaly = TRUE 
    ORDER BY created_at DESC LIMIT 10;
    """
    
    # Query the single LATEST reading to determine current active state
    latest_query = "SELECT * FROM live_sensor_telemetry ORDER BY created_at DESC LIMIT 1;"
    
    with get_db_cursor() as cur:
        cur.execute(query)
        rows = [dict(r) for r in cur.fetchall()]
        
        cur.execute(latest_query)
        latest_row = cur.fetchone()

    active_alert = None

    # Check in-memory active alert first
    if _latest_anomaly_alert and _latest_anomaly_alert.get("id") not in _dismissed_alert_ids:
        active_alert = _latest_anomaly_alert

    # If memory is clear, check whether the latest database reading is currently in an active hazard state
    elif latest_row and latest_row["id"] not in _dismissed_alert_ids:
        r = dict(latest_row)
        if r.get("is_anomaly"):
            active_alert = {
                "id": r["id"],
                "device_id": r["device_id"],
                "severity": "CRITICAL" if (r.get("object_detected") or r.get("occupancy_status") == "POSSIBLE_OCCUPANCY") else "HIGH",
                "reason": r["anomaly_reason"],
                "mq2_1": r.get("mq2_sensor_1"),
                "mq2_2": r.get("mq2_sensor_2"),
                "temperature": float(r["temperature"]) if r.get("temperature") else None,
                "distance_cm": float(r["distance_cm"]) if r.get("distance_cm") else None,
                "occupancy": "POSSIBLE_OCCUPANCY" if (r.get("object_detected") or r.get("occupancy_status") == "POSSIBLE_OCCUPANCY") else "NO_OBJECT",
                "object_detected": bool(r.get("object_detected")),
                "hazard_detected": True,
                "timestamp": r["created_at"].isoformat() if hasattr(r["created_at"], "isoformat") else str(r["created_at"])
            }

    return {
        "active_alert": active_alert,
        "recent_anomalies": rows,
        "total_anomalies_logged": len(rows)
    }

@router.post("/alerts/dismiss")
def dismiss_alert(alert_id: int = Query(...)):
    """
    Dismisses a notification banner on the frontend so it doesn't repeatedly ring.
    """
    global _dismissed_alert_ids
    _dismissed_alert_ids.add(alert_id)
    return {"status": "success", "dismissed_id": alert_id}

@router.post("/simulate")
def simulate_hardware_packet(
    scenario: str = Query("normal", regex="^(normal|gas_leak|occupancy_hazard|warmup)$")
):
    """
    Utility endpoint to test the full live hardware ingestion without physical hardware.
    """
    import random
    if scenario == "normal":
        payload = ESP32TelemetryPayload(
            device_id="HORIZONX_ESP32_01",
            mq2_sensor_1=random.randint(350, 650),
            mq2_sensor_2=random.randint(320, 620),
            mq2_level_1="NORMAL",
            mq2_level_2="NORMAL",
            temperature=round(random.uniform(23.5, 26.5), 1),
            humidity=round(random.uniform(48.0, 56.0), 1),
            distance_cm=None,
            hazard_detected=False,
            hazard_type="NORMAL",
            object_detected=False,
            occupancy_status="CLEAR",
            fan_status=False,
            buzzer_status=False
        )
    elif scenario == "gas_leak":
        mq1 = random.randint(1450, 2200)
        mq2 = random.randint(1300, 1950)
        payload = ESP32TelemetryPayload(
            device_id="HORIZONX_ESP32_01",
            mq2_sensor_1=mq1,
            mq2_sensor_2=mq2,
            mq2_level_1="HIGH",
            mq2_level_2="HIGH",
            temperature=round(random.uniform(28.0, 32.5), 1),
            humidity=round(random.uniform(55.0, 65.0), 1),
            distance_cm=None,
            hazard_detected=True,
            hazard_type="MQ2_RESPONSE",
            object_detected=False,
            occupancy_status="CLEAR",
            fan_status=True,
            gas_event=True
        )
    elif scenario == "occupancy_hazard":
        mq1 = random.randint(1600, 2400)
        mq2 = random.randint(1500, 2100)
        dist = round(random.uniform(15.0, 45.0), 1)
        payload = ESP32TelemetryPayload(
            device_id="HORIZONX_ESP32_01",
            mq2_sensor_1=mq1,
            mq2_sensor_2=mq2,
            mq2_level_1="HIGH",
            mq2_level_2="HIGH",
            temperature=round(random.uniform(30.0, 35.0), 1),
            humidity=round(random.uniform(60.0, 70.0), 1),
            distance_cm=dist,
            hazard_detected=True,
            hazard_type="MQ2_RESPONSE",
            object_detected=True,
            occupancy_status="POSSIBLE_OCCUPANCY",
            fan_status=True,
            gas_event=True,
            occupancy_event=True
        )
    else:  # warmup
        payload = ESP32TelemetryPayload(
            device_id="HORIZONX_ESP32_01",
            mq2_sensor_1=random.randint(800, 1100),
            mq2_sensor_2=random.randint(800, 1100),
            temperature=24.0,
            humidity=50.0,
            hazard_type="WARMING_UP"
        )

    # Ingest the simulated packet
    anomaly_info = evaluate_telemetry_anomaly(payload.model_dump())
    saved = save_telemetry_to_db(payload.model_dump(), anomaly_info)
    
    global _latest_anomaly_alert
    if anomaly_info["is_anomaly"]:
        _latest_anomaly_alert = {
            "id": saved.get("id"),
            "device_id": saved.get("device_id"),
            "severity": anomaly_info["severity"],
            "reason": anomaly_info["anomaly_reason"],
            "mq2_1": payload.mq2_sensor_1,
            "mq2_2": payload.mq2_sensor_2,
            "temperature": payload.temperature,
            "distance_cm": payload.distance_cm,
            "occupancy": payload.occupancy_status,
            "timestamp": datetime.now().isoformat()
        }

    return {
        "status": "success",
        "scenario": scenario,
        "ingested_record": saved,
        "is_anomaly": anomaly_info["is_anomaly"],
        "severity": anomaly_info["severity"]
    }
