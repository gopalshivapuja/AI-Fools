from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(
    title="Bharat Context-Adaptive Engine", 
    version="0.1.0",
    description="The 'Munim Ji' (Brain) of the operation. Takes raw signals and returns a personalized user segment."
)

class ContextSignals(BaseModel):
    """
    The raw signals sent by the mobile SDK.
    """
    network_type: str
    device_class: str  # 'low_end' or 'high_end'
    location_city: str
    time_of_day: str   # 'morning', 'day', etc.

@app.get("/")
def read_root():
    """
    Health Check endpoint.
    """
    return {"message": "Namaste! Bharat Engine is running."}

@app.post("/v1/init")
def initialize_context(signals: ContextSignals):
    """
    The Core Inference Endpoint.
    
    Receives: Device & Context Signals
    Returns: User Segment & Recommended UI Mode
    
    Logic (MVP):
    - If Device is 'low_end' -> Recommend 'lite' mode (Save Data/RAM).
    - Else -> Recommend 'standard' mode.
    """
    # This is where the "Munim Ji" logic will go later
    # For now, we just echo back a simple segmentation
    segment = "general"
    
    # Simple Heuristic: Low End Device = Lite Mode
    if signals.device_class == "low_end":
        segment = "lite_mode_user"
    
    return {
        "user_segment": segment,
        "recommended_mode": "lite" if segment == "lite_mode_user" else "standard",
        "message": f"Context received. Optimization applied for {segment}."
    }
