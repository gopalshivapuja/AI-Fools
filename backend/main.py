import os
import json
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="Bharat Context-Adaptive Engine", 
    version="0.2.0",
    description="The 'Munim Ji' (Brain) of the operation. An LLM-powered personalization engine for the Next Billion Users."
)

# Enable CORS for Expo/React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════════════
# MODELS - The Language of Bharat
# ═══════════════════════════════════════════════════════════════

# Base config to accept both snake_case and camelCase
class FlexibleModel(BaseModel):
    """Base model that accepts both camelCase and snake_case fields"""
    model_config = ConfigDict(populate_by_name=True)

class DeviceSignals(FlexibleModel):
    """Device-level signals from the user's phone"""
    brand: Optional[str] = None
    model_name: Optional[str] = Field(default=None, alias="modelName")
    device_type: str = Field(default="PHONE", alias="deviceType")
    total_memory: Optional[int] = Field(default=None, alias="totalMemory")
    screen_width: float = Field(default=360, alias="screenWidth")  # Can be float from React Native
    screen_height: float = Field(default=640, alias="screenHeight")  # Can be float from React Native
    is_low_end: bool = Field(default=False, alias="isLowEnd")

class NetworkSignals(FlexibleModel):
    """Network connectivity signals"""
    type: str  # 'WIFI', 'CELLULAR', 'NONE', 'UNKNOWN'
    is_internet_reachable: bool = Field(default=True, alias="isInternetReachable")
    is_wifi: bool = Field(default=False, alias="isWifi")

class BatterySignals(FlexibleModel):
    """Battery state signals"""
    level: float = 1.0  # 0-1
    is_charging: bool = Field(default=False, alias="isCharging")
    is_low_power: bool = Field(default=False, alias="isLowPower")

class ContextSignals(FlexibleModel):
    """Temporal and locale context"""
    timezone: str = "Asia/Kolkata"
    locale: str = "en-IN"
    language: str = "en"
    time_of_day: str = Field(default="day", alias="timeOfDay")
    is_morning: bool = Field(default=False, alias="isMorning")
    is_afternoon: bool = Field(default=True, alias="isAfternoon")
    is_evening: bool = Field(default=False, alias="isEvening")
    is_night: bool = Field(default=False, alias="isNight")
    is_weekend: bool = Field(default=False, alias="isWeekend")

class FullSignalPayload(FlexibleModel):
    """
    The complete signal payload from the Bharat Engine SDK.
    This is everything we know about the user's context WITHOUT asking them.
    """
    device: DeviceSignals
    network: NetworkSignals
    battery: BatterySignals
    context: ContextSignals
    
    # Simulated Day (for demo - in production this comes from user journey tracking)
    journey_day: int = Field(default=0, alias="journeyDay")

class Persona(BaseModel):
    """AI-generated user persona"""
    name: str
    emoji: str
    description: str

class Suggestion(BaseModel):
    """LLM-generated action suggestion"""
    title: str
    description: str
    action: str
    icon: str

class Journey(BaseModel):
    """User's journey progress"""
    day: int
    stage: str  # newcomer, explorer, regular, partner
    insights: list[str]
    value_delivered: str

class EngineResponse(BaseModel):
    """
    The full response from Munim Ji.
    Contains both inference results AND LLM-generated personalized content.
    """
    user_segment: str
    recommended_mode: str  # lite, standard, rich
    persona: Persona
    suggestions: list[Suggestion]
    journey: Journey
    greeting: str
    message: str
    reasoning: list[str]  # Transparent explanation of WHY we made these choices

# ═══════════════════════════════════════════════════════════════
# THE BRAIN - Munim Ji's Logic
# ═══════════════════════════════════════════════════════════════

def determine_mode(signals: FullSignalPayload) -> str:
    """
    Determine UI mode based on device constraints.
    
    LITE MODE triggers when:
    - Low-end device (RAM < 4GB)
    - Low battery (< 20%)
    - Poor network (not WiFi and not reliable)
    
    RICH MODE enables when:
    - High-end device
    - WiFi connected
    - Battery > 50%
    """
    # Lite mode conditions
    if signals.device.is_low_end:
        return "lite"
    if signals.battery.is_low_power:
        return "lite"
    if signals.network.type == "CELLULAR" and not signals.network.is_internet_reachable:
        return "lite"
    
    # Rich mode conditions  
    if (signals.network.is_wifi and 
        signals.battery.level > 0.5 and 
        not signals.device.is_low_end):
        return "rich"
    
    return "standard"

def determine_segment(signals: FullSignalPayload) -> str:
    """
    Segment the user based on context.
    This is the rule-based foundation that the LLM enhances.
    """
    time = signals.context.time_of_day
    is_weekend = signals.context.is_weekend
    language = signals.context.language
    
    # Morning patterns
    if time == "morning":
        if language == "hi":
            return "hindi_morning_devotee"
        return "morning_professional"
    
    # Evening patterns (business closing time)
    if time == "evening":
        if is_weekend:
            return "weekend_relaxer"
        return "evening_merchant"
    
    # Night patterns
    if time == "night":
        return "night_browser"
    
    # Default afternoon
    if is_weekend:
        return "weekend_explorer"
    return "weekday_worker"

def get_journey_stage(day: int) -> tuple[str, str]:
    """
    Map journey day to stage and value delivered.
    
    Day 0-3: Newcomer (just getting started)
    Day 4-10: Explorer (trying features)
    Day 11-20: Regular (building habits)
    Day 21+: Partner (trusted companion)
    """
    if day <= 3:
        return "newcomer", "Getting to know you..."
    elif day <= 10:
        return "explorer", f"Discovered {day} preferences"
    elif day <= 20:
        hours_saved = round(day * 0.3, 1)
        return "regular", f"Saved ~{hours_saved} hours so far"
    else:
        hours_saved = round(day * 0.4, 1)
        return "partner", f"Saved {hours_saved} hours this month!"

# ═══════════════════════════════════════════════════════════════
# LLM LAYER - The Creative Brain
# ═══════════════════════════════════════════════════════════════

def generate_llm_response(signals: FullSignalPayload, segment: str, mode: str) -> dict:
    """
    Use OpenAI to generate personalized content based on signals.
    
    This is the "Day 30" experience - the engine becomes a creative partner,
    not just a rule-based system.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        # Fallback to demo responses if no API key
        return get_demo_response(signals, segment, mode)
    
    client = OpenAI(api_key=api_key)
    
    # Build context for the LLM
    context = f"""
You are "Munim Ji", a wise digital assistant for Indian users (the "Next Billion Users").
You speak warmly, mix Hindi phrases naturally, and understand the rhythms of Indian daily life.

CURRENT USER CONTEXT:
- Time: {signals.context.time_of_day} ({signals.context.timezone})
- Language preference: {signals.context.language}
- Device: {signals.device.brand or 'Unknown'} {signals.device.model_name or 'Phone'}
- Battery: {int(signals.battery.level * 100)}% {"(charging)" if signals.battery.is_charging else ""}
- Network: {signals.network.type}
- Weekend: {"Yes" if signals.context.is_weekend else "No"}
- Journey Day: {signals.journey_day}
- User Segment: {segment}
- UI Mode: {mode}

Generate a personalized response with:
1. A warm greeting (1 line, match time of day, use Hindi phrases like "Namaste", "Shubh Prabhat", "Sat Sri Akal")
2. A persona name for this user (e.g., "Morning Devotee", "Evening Merchant", "Weekend Explorer")
3. An emoji that represents them
4. 3 smart suggestions based on their context (what would help them RIGHT NOW)

Respond ONLY with valid JSON in this exact format:
{{
    "greeting": "Your greeting here",
    "persona_name": "Name",
    "persona_emoji": "🙏",
    "persona_description": "One line about who they are",
    "suggestions": [
        {{"title": "Action title", "description": "Why this helps", "action": "action_id", "icon": "emoji"}},
        {{"title": "Action 2", "description": "Why", "action": "action_id", "icon": "emoji"}},
        {{"title": "Action 3", "description": "Why", "action": "action_id", "icon": "emoji"}}
    ]
}}
"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Fast and cost-effective
            messages=[
                {"role": "system", "content": "You are Munim Ji, a wise Indian digital assistant. Respond only with valid JSON."},
                {"role": "user", "content": context}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        content = response.choices[0].message.content
        # Clean up potential markdown formatting
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        
        return json.loads(content)
    
    except Exception as e:
        print(f"LLM Error: {e}")
        return get_demo_response(signals, segment, mode)

def get_demo_response(signals: FullSignalPayload, segment: str, mode: str) -> dict:
    """
    Fallback responses when OpenAI API key is not available.
    Still demonstrates the Day 30 experience with hardcoded examples.
    """
    time = signals.context.time_of_day
    lang = signals.context.language
    
    # Time-based greetings
    greetings = {
        "morning": "🌅 Shubh Prabhat! Ready to start your day?",
        "afternoon": "🌞 Namaste! Hope your day is going well.",
        "evening": "🌆 Shubh Sandhya! Time to wind down.",
        "night": "🌙 Good evening! Burning the midnight oil?"
    }
    
    # Segment-based personas
    personas = {
        "hindi_morning_devotee": ("Morning Devotee", "🙏", "Starts each day with spirituality and peace"),
        "morning_professional": ("Morning Achiever", "☀️", "Early bird who gets things done"),
        "evening_merchant": ("Evening Merchant", "🏪", "Balances business with family time"),
        "weekend_relaxer": ("Weekend Relaxer", "🎉", "Enjoys quality time and exploration"),
        "night_browser": ("Night Owl", "🦉", "Finds inspiration in the quiet hours"),
        "weekend_explorer": ("Weekend Explorer", "🗺️", "Always discovering something new"),
        "weekday_worker": ("Focused Professional", "💼", "Making every hour count")
    }
    
    persona = personas.get(segment, ("Bharat User", "🇮🇳", "Part of the Next Billion"))
    
    # Time-based suggestions
    morning_suggestions = [
        {"title": "🕉️ Play Morning Aarti", "description": "Start your day with blessings", "action": "play_aarti", "icon": "🙏"},
        {"title": "📰 Today's Headlines", "description": "Catch up in 2 minutes", "action": "show_news", "icon": "📱"},
        {"title": "☑️ Plan Your Day", "description": "Set your top 3 priorities", "action": "open_planner", "icon": "📝"}
    ]
    
    evening_suggestions = [
        {"title": "📊 Daily Summary", "description": "Review what you accomplished", "action": "show_summary", "icon": "✅"},
        {"title": "🏪 Close Your Books", "description": "Settle today's transactions", "action": "open_ledger", "icon": "💰"},
        {"title": "📲 Share Status", "description": "Let customers know you're closing", "action": "create_status", "icon": "🖼️"}
    ]
    
    night_suggestions = [
        {"title": "📚 Learn Something New", "description": "5-minute skill boost", "action": "show_learning", "icon": "🧠"},
        {"title": "🎵 Relaxing Music", "description": "Wind down with soothing sounds", "action": "play_music", "icon": "🎶"},
        {"title": "📅 Plan Tomorrow", "description": "Set yourself up for success", "action": "open_planner", "icon": "🌅"}
    ]
    
    default_suggestions = [
        {"title": "✨ Discover Features", "description": "See what's new for you", "action": "show_features", "icon": "🆕"},
        {"title": "💡 Quick Tips", "description": "Make the most of your day", "action": "show_tips", "icon": "📌"},
        {"title": "🎯 Your Goals", "description": "Track your progress", "action": "show_goals", "icon": "📈"}
    ]
    
    suggestions_map = {
        "morning": morning_suggestions,
        "evening": evening_suggestions,
        "night": night_suggestions
    }
    
    return {
        "greeting": greetings.get(time, "🙏 Namaste!"),
        "persona_name": persona[0],
        "persona_emoji": persona[1],
        "persona_description": persona[2],
        "suggestions": suggestions_map.get(time, default_suggestions)
    }

# ═══════════════════════════════════════════════════════════════
# API ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/")
def read_root():
    """Health Check endpoint."""
    return {
        "message": "Namaste! Bharat Engine v0.2.0 is running.",
        "features": ["LLM-powered personalization", "Day 30 experiences", "Context-adaptive UI"]
    }

def generate_reasoning(signals: FullSignalPayload, segment: str, mode: str) -> list[str]:
    """
    Generate transparent reasoning for WHY we made the personalization choices.
    This builds trust by showing users the signals we used.
    """
    reasoning = []
    
    # Time-based reasoning
    time = signals.context.time_of_day
    if time == "morning":
        reasoning.append("🌅 It's morning - showing productivity & spiritual content")
    elif time == "afternoon":
        reasoning.append("🌞 It's afternoon - focus mode content")
    elif time == "evening":
        reasoning.append("🌆 It's evening - relaxation & wrap-up suggestions")
    elif time == "night":
        reasoning.append("🌙 It's night - calm & reflective content")
    
    # Weekend/Weekday reasoning
    if signals.context.is_weekend:
        reasoning.append("📅 It's the weekend - leisure & exploration focus")
    else:
        reasoning.append("💼 It's a weekday - work & productivity focus")
    
    # Device reasoning
    if signals.device.is_low_end:
        reasoning.append(f"📱 Budget device detected - Lite mode for smooth performance")
    else:
        reasoning.append(f"📱 {signals.device.brand} {signals.device.model_name} - Full experience enabled")
    
    # Battery reasoning
    battery_pct = int(signals.battery.level * 100)
    if signals.battery.is_low_power:
        reasoning.append(f"🔋 Battery low ({battery_pct}%) - Power-saving mode active")
    elif signals.battery.is_charging:
        reasoning.append(f"🔌 Charging ({battery_pct}%) - Rich content enabled")
    else:
        reasoning.append(f"🔋 Battery at {battery_pct}%")
    
    # Network reasoning
    if signals.network.is_wifi:
        reasoning.append("📶 Connected to WiFi - High-quality content available")
    else:
        reasoning.append(f"📶 On {signals.network.type} - Optimized for data saving")
    
    # Language reasoning
    if signals.context.language != "en":
        reasoning.append(f"🌐 Language: {signals.context.language.upper()} - Regional content prioritized")
    
    # Journey reasoning
    if signals.journey_day == 0:
        reasoning.append("👋 Day 0 - Getting to know you!")
    elif signals.journey_day <= 7:
        reasoning.append(f"🌱 Day {signals.journey_day} - Still learning your preferences")
    elif signals.journey_day <= 21:
        reasoning.append(f"📈 Day {signals.journey_day} - Building your personalized experience")
    else:
        reasoning.append(f"🤝 Day {signals.journey_day} - You're a trusted partner!")
    
    return reasoning

@app.post("/v1/init", response_model=EngineResponse)
def initialize_context(signals: FullSignalPayload):
    """
    The Core Inference Endpoint - Now with LLM superpowers! 🚀
    
    Receives: Full device, network, battery, and context signals
    Returns: Personalized UI config with LLM-generated content
    
    This is the "Day 30" experience where the engine truly becomes
    a Digital Partner, not just a rule-based guesser.
    """
    # 1. Determine UI mode based on device constraints
    mode = determine_mode(signals)
    
    # 2. Segment the user based on context
    segment = determine_segment(signals)
    
    # 3. Get journey stage
    stage, value = get_journey_stage(signals.journey_day)
    
    # 4. Generate LLM-powered personalized content
    llm_response = generate_llm_response(signals, segment, mode)
    
    # 5. Build insights based on signals
    insights = []
    if signals.device.is_low_end:
        insights.append("Optimized for your device")
    if signals.battery.is_low_power:
        insights.append("Battery saver mode active")
    if signals.network.is_wifi:
        insights.append("Rich content available on WiFi")
    if signals.context.language != "en":
        insights.append(f"Content in {signals.context.language.upper()}")
    
    # 6. Generate transparent reasoning
    reasoning = generate_reasoning(signals, segment, mode)
    
    # 7. Build the full response
    return EngineResponse(
        user_segment=segment,
        recommended_mode=mode,
        persona=Persona(
            name=llm_response.get("persona_name", "Bharat User"),
            emoji=llm_response.get("persona_emoji", "🇮🇳"),
            description=llm_response.get("persona_description", "Welcome to the journey!")
        ),
        suggestions=[
            Suggestion(**s) for s in llm_response.get("suggestions", [])
        ],
        journey=Journey(
            day=signals.journey_day,
            stage=stage,
            insights=insights if insights else ["Learning your preferences..."],
            value_delivered=value
        ),
        greeting=llm_response.get("greeting", "🙏 Namaste!"),
        message=f"Context received. {mode.title()} mode active for {segment}.",
        reasoning=reasoning
    )

# Legacy endpoint for backwards compatibility
@app.post("/v1/init/simple")
def initialize_simple(network_type: str = "UNKNOWN", device_class: str = "high_end", 
                      location_city: str = "Unknown", time_of_day: str = "day"):
    """Simple endpoint for basic integration (backwards compatible)."""
    segment = "general"
    if device_class == "low_end":
        segment = "lite_mode_user"
    
    return {
        "user_segment": segment,
        "recommended_mode": "lite" if segment == "lite_mode_user" else "standard",
        "message": f"Context received. Optimization applied for {segment}."
    }
