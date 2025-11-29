from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Bharat Context-Adaptive Engine", version="0.1.0")

class ContextSignals(BaseModel):
    network_type: str
    device_class: str
    location_city: str
    time_of_day: str

@app.get("/")
def read_root():
    return {"message": "Namaste! Bharat Engine is running."}

@app.post("/v1/init")
def initialize_context(signals: ContextSignals):
    # This is where the "Munim Ji" logic will go later
    # For now, we just echo back a simple segmentation
    segment = "general"
    if signals.device_class == "low_end":
        segment = "lite_mode_user"
    
    return {
        "user_segment": segment,
        "recommended_mode": "lite" if segment == "lite_mode_user" else "standard",
        "message": f"Context received from {signals.location_city}"
    }

