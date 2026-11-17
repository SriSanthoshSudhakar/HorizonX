import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any
from telemetry import router as telemetry_router
from face_recognition.routes import router as face_router
from database.routes import router as database_router
from live_sensor_routes import (
    router as live_router,
    evaluate_telemetry_anomaly,
    save_telemetry_to_db
)
import live_sensor_routes

app = FastAPI(title="HorizonX Backend API")

# Allow CORS for the React frontend and external clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the D3 Telemetry, Facial Recognition, PostgreSQL Database, and Live Telemetry routes
app.include_router(telemetry_router)
app.include_router(face_router)
app.include_router(database_router)
app.include_router(live_router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "HorizonX Backend API is running with D3.js telemetry endpoints."}

# Endpoint for IoT hardware (ESP32 / ESP8266 / Arduino / Simulators)
@app.post("/api/sensor-data")
async def receive_sensor_data(request: Request):
    """
    Receives incoming sensor telemetry from microcontrollers (ESP32/ESP8266) or IoT clients,
    evaluates real-time anomaly scores, and persists into PostgreSQL (live_sensor_telemetry).
    """
    try:
        payload = await request.json()
    except Exception:
        body_bytes = await request.body()
        payload = {"raw": body_bytes.decode("utf-8", errors="ignore")}
    
    print(f"[Sensor API] Received sensor packet from {payload.get('device_id', 'unknown')}: {payload}")

    # Evaluate anomaly
    anomaly_info = evaluate_telemetry_anomaly(payload)

    # Persist to PostgreSQL database
    try:
        saved_record = save_telemetry_to_db(payload, anomaly_info)
        record_id = saved_record.get("id")
    except Exception as e:
        print(f"[Sensor API Error] Database write failed: {e}")
        saved_record = {}
        record_id = None

    # Trigger live notification alert strictly when anomalous (MQ >= 1200 or smoke hazard)
    if anomaly_info["is_anomaly"]:
        from datetime import datetime
        live_sensor_routes._latest_anomaly_alert = {
            "id": record_id or 1,
            "device_id": payload.get("device_id", "HORIZONX_ESP32_01"),
            "severity": anomaly_info["severity"],
            "reason": anomaly_info["anomaly_reason"],
            "mq2_1": payload.get("mq2_sensor_1"),
            "mq2_2": payload.get("mq2_sensor_2"),
            "temperature": payload.get("temperature"),
            "distance_cm": payload.get("distance_cm"),
            "occupancy": payload.get("occupancy_status"),
            "hazard_detected": bool(payload.get("hazard_detected")),
            "timestamp": datetime.now().isoformat()
        }
    else:
        # Clear active alert when readings return to normal
        live_sensor_routes._latest_anomaly_alert = None

    return {
        "status": "success",
        "message": "Sensor data received and saved to database",
        "record_id": record_id,
        "is_anomaly": anomaly_info["is_anomaly"],
        "severity": anomaly_info["severity"],
        "anomaly_reason": anomaly_info["anomaly_reason"]
    }

@app.get("/api/sensor-data")
def get_sensor_data_status():
    return {"status": "online", "endpoint": "/api/sensor-data", "method": "POST expected"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
