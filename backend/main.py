import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from telemetry import router as telemetry_router
from face_recognition.routes import router as face_router
from database.routes import router as database_router

app = FastAPI(title="HorizonX Backend API")

# Allow CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the D3 Telemetry, Facial Recognition, and PostgreSQL Database routes
app.include_router(telemetry_router)
app.include_router(face_router)
app.include_router(database_router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "HorizonX Backend API is running with D3.js telemetry endpoints."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
