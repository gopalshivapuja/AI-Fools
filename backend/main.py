import os
import json
import time
from datetime import datetime, timedelta
from typing import Optional, Literal
from collections import defaultdict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="Bharat Context-Adaptive Engine", 
    version="0.4.0",
    description="The 'Munim Ji' (Brain) - User Intelligence Platform with behavioral learning"
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
# PYDANTIC MODELS - Maximum Signal Collection
# ═══════════════════════════════════════════════════════════════

class FlexibleModel(BaseModel):
    """Base model that accepts both camelCase and snake_case fields"""
    model_config = ConfigDict(populate_by_name=True)

class DeviceSignals(FlexibleModel):
    brand: Optional[str] = None
    model_name: Optional[str] = Field(default=None, alias="modelName")
    os_version: Optional[str] = Field(default=None, alias="osVersion")
    device_type: str = Field(default="PHONE", alias="deviceType")
    total_memory: Optional[int] = Field(default=None, alias="totalMemory")
    screen_width: float = Field(default=360, alias="screenWidth")
    screen_height: float = Field(default=640, alias="screenHeight")
    is_low_end: bool = Field(default=False, alias="isLowEnd")
    font_scale: float = Field(default=1.0, alias="fontScale")
    color_scheme: str = Field(default="light", alias="colorScheme")
    reduced_motion: bool = Field(default=False, alias="reducedMotion")

class NetworkSignals(FlexibleModel):
    type: str = "UNKNOWN"
    is_internet_reachable: bool = Field(default=True, alias="isInternetReachable")
    is_wifi: bool = Field(default=False, alias="isWifi")
    carrier_name: Optional[str] = Field(default=None, alias="carrierName")
    carrier_country: Optional[str] = Field(default=None, alias="carrierCountry")

class BatterySignals(FlexibleModel):
    level: float = 1.0
    is_charging: bool = Field(default=False, alias="isCharging")
    is_low_power: bool = Field(default=False, alias="isLowPower")

class ContextSignals(FlexibleModel):
    timestamp: Optional[int] = None
    timezone: str = "Asia/Kolkata"
    locale: str = "en-IN"
    language: str = "en"
    time_of_day: str = Field(default="day", alias="timeOfDay")
    is_morning: bool = Field(default=False, alias="isMorning")
    is_afternoon: bool = Field(default=True, alias="isAfternoon")
    is_evening: bool = Field(default=False, alias="isEvening")
    is_night: bool = Field(default=False, alias="isNight")
    is_weekend: bool = Field(default=False, alias="isWeekend")

class EnvironmentSignals(FlexibleModel):
    brightness: float = 0.5
    volume_level: float = Field(default=0.5, alias="volumeLevel")
    is_headphones_connected: bool = Field(default=False, alias="isHeadphonesConnected")
    is_silent_mode: bool = Field(default=False, alias="isSilentMode")

class AppSignals(FlexibleModel):
    install_time: Optional[int] = Field(default=None, alias="installTime")
    last_open_time: Optional[int] = Field(default=None, alias="lastOpenTime")
    app_version: Optional[str] = Field(default=None, alias="appVersion")
    build_number: Optional[str] = Field(default=None, alias="buildNumber")
    session_count: int = Field(default=1, alias="sessionCount")
    total_time_spent: int = Field(default=0, alias="totalTimeSpent")
    storage_available: Optional[int] = Field(default=None, alias="storageAvailable")
    is_first_launch: bool = Field(default=False, alias="isFirstLaunch")

class LocationSignals(FlexibleModel):
    has_permission: bool = Field(default=False, alias="hasPermission")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    tier: str = "unknown"
    is_urban: bool = Field(default=False, alias="isUrban")

class ActivitySignals(FlexibleModel):
    has_permission: bool = Field(default=False, alias="hasPermission")
    steps_today: Optional[int] = Field(default=None, alias="stepsToday")
    is_moving: bool = Field(default=False, alias="isMoving")
    activity_type: str = Field(default="unknown", alias="activityType")

class SocialSignals(FlexibleModel):
    has_contacts_permission: bool = Field(default=False, alias="hasContactsPermission")
    contacts_count: Optional[int] = Field(default=None, alias="contactsCount")
    has_calendar_permission: bool = Field(default=False, alias="hasCalendarPermission")
    upcoming_events_count: Optional[int] = Field(default=None, alias="upcomingEventsCount")
    is_busy: bool = Field(default=False, alias="isBusy")

class QuestionnaireAnswers(FlexibleModel):
    primary_use: Optional[str] = Field(default=None, alias="primaryUse")
    preferred_language: Optional[str] = Field(default=None, alias="preferredLanguage")
    age_group: Optional[str] = Field(default=None, alias="ageGroup")
    interests: list[str] = []
    occupation: Optional[str] = None
    shopping_frequency: Optional[str] = Field(default=None, alias="shoppingFrequency")
    content_preference: Optional[str] = Field(default=None, alias="contentPreference")
    answered_at: Optional[int] = Field(default=None, alias="answeredAt")
    completed_days: list[int] = Field(default=[], alias="completedDays")

class FullSignalPayload(FlexibleModel):
    fingerprint_id: Optional[str] = Field(default=None, alias="fingerprintId")  # For user intelligence!
    device: DeviceSignals = DeviceSignals()
    network: NetworkSignals = NetworkSignals()
    battery: BatterySignals = BatterySignals()
    context: ContextSignals = ContextSignals()
    environment: EnvironmentSignals = EnvironmentSignals()
    app: AppSignals = AppSignals()
    location: LocationSignals = LocationSignals()
    activity: ActivitySignals = ActivitySignals()
    social: SocialSignals = SocialSignals()
    questionnaire: QuestionnaireAnswers = QuestionnaireAnswers()
    journey_day: int = Field(default=0, alias="journeyDay")
    use_dynamic_recommendations: bool = Field(default=True, alias="useDynamicRecommendations")

# Response Models
class Persona(BaseModel):
    name: str
    emoji: str
    description: str
    scenario: str

class SpecificContent(BaseModel):
    """Deep link content for actionable recommendations"""
    name: str                          # "Pathaan", "Kesariya", "Butter Chicken"
    type: str                          # 'movie' | 'song' | 'recipe' | 'podcast' | 'article' | 'app'
    source: str                        # "YouTube", "Spotify", "Prime Video"
    deep_link: Optional[str] = Field(default=None, alias="deepLink")
    fallback_url: Optional[str] = Field(default=None, alias="fallbackUrl")
    thumbnail: Optional[str] = None
    
    model_config = ConfigDict(populate_by_name=True)

class Suggestion(BaseModel):
    title: str
    description: str
    action: str
    icon: str
    priority: int = 1
    specific_content: Optional[SpecificContent] = Field(default=None, alias="specificContent")
    
    model_config = ConfigDict(populate_by_name=True)

# Feedback Models
class FeedbackRequest(FlexibleModel):
    """User feedback on a suggestion"""
    fingerprint_id: Optional[str] = Field(default=None, alias="fingerprintId")  # Now tracks per user!
    suggestion_action: str = Field(..., alias="suggestionAction")
    scenario: str
    feedback: str  # 'like' | 'dislike'
    category: Optional[str] = None  # What category this suggestion belongs to
    content_type: Optional[str] = Field(default=None, alias="contentType")
    source: Optional[str] = None
    timestamp: int

class FeedbackResponse(BaseModel):
    success: bool
    message: str
    total_likes: int = Field(default=0, alias="totalLikes")
    total_dislikes: int = Field(default=0, alias="totalDislikes")
    learning_applied: bool = Field(default=False, alias="learningApplied")
    
    model_config = ConfigDict(populate_by_name=True)

class Journey(BaseModel):
    day: int
    stage: str
    insights: list[str]
    value_delivered: str
    next_milestone: str = Field(default="", alias="nextMilestone")

class EngineResponse(BaseModel):
    user_segment: str
    recommended_mode: str
    persona: Persona
    suggestions: list[Suggestion]
    journey: Journey
    greeting: str
    message: str
    reasoning: list[str]
    matched_scenario: str
    confidence: float
    
    # User Intelligence additions
    intelligence_summary: Optional[dict] = Field(default=None, alias="intelligenceSummary")
    dynamic_recommendations: bool = Field(default=False, alias="dynamicRecommendations")
    
    model_config = ConfigDict(populate_by_name=True)

# ═══════════════════════════════════════════════════════════════
# USER INTELLIGENCE MODELS - The Memory Palace 🧠
# ═══════════════════════════════════════════════════════════════

class EventType(BaseModel):
    """Types of events we can track"""
    pass  # Using string literals in the Event model

class UserEvent(FlexibleModel):
    """
    An event represents something the user did.
    Think of it as a "memory" we're storing about their behavior.
    """
    event_id: str = Field(default_factory=lambda: f"evt_{int(time.time() * 1000)}")
    event_type: str  # 'view' | 'click' | 'like' | 'dislike' | 'share' | 'purchase' | 'session_start' | 'session_end' | 'suggestion_action'
    event_name: str  # e.g., "played_hanuman_chalisa", "viewed_recipe"
    category: Optional[str] = None  # e.g., "spiritual", "entertainment", "education"
    content_type: Optional[str] = Field(default=None, alias="contentType")  # e.g., "video", "audio", "article"
    source: Optional[str] = None  # e.g., "YouTube", "Spotify"
    scenario: Optional[str] = None  # Which persona scenario this relates to
    timestamp: int = Field(default_factory=lambda: int(time.time() * 1000))
    
    # Optional metadata
    duration_ms: Optional[int] = Field(default=None, alias="durationMs")  # How long they engaged
    value: Optional[float] = None  # For purchases or ratings
    metadata: dict = Field(default_factory=dict)  # Any extra data

class EventRequest(FlexibleModel):
    """Request body for event tracking"""
    fingerprint_id: str = Field(..., alias="fingerprintId")
    events: list[UserEvent]

class EventResponse(FlexibleModel):
    """Response after tracking events"""
    success: bool
    events_tracked: int = Field(default=0, alias="eventsTracked")
    message: str

class BehavioralPattern(FlexibleModel):
    """
    Patterns we detect from user behavior.
    Like "this user loves spiritual content in the morning".
    """
    pattern_type: str  # 'time_preference' | 'content_preference' | 'engagement_pattern'
    description: str
    confidence: float  # 0-1 how confident we are
    detected_at: int = Field(default_factory=lambda: int(time.time() * 1000))
    evidence_count: int = 1  # How many events support this pattern

class UserPreferences(FlexibleModel):
    """
    Explicit + inferred preferences.
    This is what we "learn" about the user.
    """
    # Content preferences (learned from behavior)
    liked_categories: list[str] = Field(default_factory=list, alias="likedCategories")
    disliked_categories: list[str] = Field(default_factory=list, alias="dislikedCategories")
    preferred_content_types: list[str] = Field(default_factory=list, alias="preferredContentTypes")
    preferred_sources: list[str] = Field(default_factory=list, alias="preferredSources")
    
    # Time preferences
    active_hours: list[int] = Field(default_factory=list, alias="activeHours")  # 0-23
    preferred_time_of_day: Optional[str] = Field(default=None, alias="preferredTimeOfDay")
    
    # Engagement stats
    avg_session_duration_ms: int = Field(default=0, alias="avgSessionDurationMs")
    total_sessions: int = Field(default=0, alias="totalSessions")
    
    # Scenario affinity (which personas they match most)
    scenario_affinity: dict[str, float] = Field(default_factory=dict, alias="scenarioAffinity")

class UserIntelligence(FlexibleModel):
    """
    The complete intelligence profile for a user.
    This is the "brain" we're building for each user.
    """
    fingerprint_id: str = Field(..., alias="fingerprintId")
    created_at: int = Field(default_factory=lambda: int(time.time() * 1000), alias="createdAt")
    updated_at: int = Field(default_factory=lambda: int(time.time() * 1000), alias="updatedAt")
    
    # Journey tracking
    journey_day: int = Field(default=0, alias="journeyDay")
    first_seen_at: int = Field(default_factory=lambda: int(time.time() * 1000), alias="firstSeenAt")
    
    # Event history (recent events)
    recent_events: list[UserEvent] = Field(default_factory=list, alias="recentEvents")
    total_events: int = Field(default=0, alias="totalEvents")
    
    # Learned patterns
    patterns: list[BehavioralPattern] = Field(default_factory=list)
    
    # User preferences (learned + explicit)
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    
    # Feedback aggregates
    total_likes: int = Field(default=0, alias="totalLikes")
    total_dislikes: int = Field(default=0, alias="totalDislikes")
    
    # Last matched scenario
    last_scenario: Optional[str] = Field(default=None, alias="lastScenario")
    scenario_history: list[str] = Field(default_factory=list, alias="scenarioHistory")

class IntelligenceSummary(FlexibleModel):
    """
    A summary of what we know about the user.
    This is what we show in the UI.
    """
    journey_day: int = Field(..., alias="journeyDay")
    stage: str  # newcomer, explorer, regular, partner
    
    # Key insights (human-readable)
    insights: list[str]
    
    # Top preferences
    top_categories: list[str] = Field(default_factory=list, alias="topCategories")
    top_content_types: list[str] = Field(default_factory=list, alias="topContentTypes")
    
    # Engagement summary
    engagement_score: float = Field(default=0.5, alias="engagementScore")  # 0-1
    
    # Personalization level
    personalization_level: str = Field(default="low", alias="personalizationLevel")  # low, medium, high

# ═══════════════════════════════════════════════════════════════
# SCENARIO DEFINITIONS - 8 Rich Personas
# ═══════════════════════════════════════════════════════════════

SCENARIOS = {
    "morning_devotee": {
        "name": "Morning Devotee",
        "emoji": "🙏",
        "description": "Starts each day with spirituality and peace",
        "triggers": ["morning", "hindi_or_regional", "spiritual_interest", "low_brightness"],
        "suggestions": [
            {
                "title": "🕉️ Play Kashi Vishwanath Aarti", 
                "description": "Live morning aarti on YouTube", 
                "action": "play_aarti", 
                "icon": "🙏", 
                "priority": 1,
                "specificContent": {
                    "name": "Kashi Vishwanath Morning Aarti",
                    "type": "video",
                    "source": "YouTube",
                    "deepLink": "vnd.youtube://watch?v=BRjP0LYFf1o",
                    "fallbackUrl": "https://www.youtube.com/watch?v=BRjP0LYFf1o"
                }
            },
            {
                "title": "🎵 Play Hanuman Chalisa", 
                "description": "By Hariharan on Spotify", 
                "action": "play_chalisa", 
                "icon": "🎶", 
                "priority": 2,
                "specificContent": {
                    "name": "Hanuman Chalisa - Hariharan",
                    "type": "song",
                    "source": "Spotify",
                    "deepLink": "spotify:track:5ZULALImTm6SY6qLhWCkqe",
                    "fallbackUrl": "https://open.spotify.com/track/5ZULALImTm6SY6qLhWCkqe"
                }
            },
            {
                "title": "📅 Today's Panchang", 
                "description": "Auspicious timings on Drik Panchang", 
                "action": "show_panchang", 
                "icon": "🗓️", 
                "priority": 3,
                "specificContent": {
                    "name": "Daily Panchang",
                    "type": "article",
                    "source": "Drik Panchang",
                    "deepLink": None,
                    "fallbackUrl": "https://www.drikpanchang.com/panchang/day-panchang.html"
                }
            },
        ]
    },
    "evening_merchant": {
        "name": "Evening Merchant",
        "emoji": "🏪",
        "description": "Balances business with family time",
        "triggers": ["evening", "business_use", "cellular_network"],
        "suggestions": [
            {
                "title": "📊 Open Khatabook", 
                "description": "Review today's transactions", 
                "action": "show_ledger", 
                "icon": "💰", 
                "priority": 1,
                "specificContent": {
                    "name": "Khatabook",
                    "type": "app",
                    "source": "Khatabook",
                    "deepLink": "khatabook://",
                    "fallbackUrl": "https://play.google.com/store/apps/details?id=com.vaibhavkalpe.android.khatabook"
                }
            },
            {
                "title": "📱 WhatsApp Business Tips", 
                "description": "Grow your shop with these tricks", 
                "action": "watch_tips", 
                "icon": "📈", 
                "priority": 2,
                "specificContent": {
                    "name": "WhatsApp Business Growth Tips",
                    "type": "video",
                    "source": "YouTube",
                    "deepLink": "vnd.youtube://watch?v=SbFHxqLftyE",
                    "fallbackUrl": "https://www.youtube.com/watch?v=SbFHxqLftyE"
                }
            },
            {
                "title": "🎵 Play Relaxing Music", 
                "description": "Evening Hindi melodies on JioSaavn", 
                "action": "play_music", 
                "icon": "🎶", 
                "priority": 3,
                "specificContent": {
                    "name": "Evening Hindi Classics",
                    "type": "song",
                    "source": "JioSaavn",
                    "deepLink": "jiosaavn://playlist/evening-hindi-classics",
                    "fallbackUrl": "https://www.jiosaavn.com/featured/evening-hindi-classics/xQy7VwNSu3E_"
                }
            },
        ]
    },
    "budget_student": {
        "name": "Data-Conscious Learner",
        "emoji": "📚",
        "description": "Maximizes value on limited resources",
        "triggers": ["low_end_device", "student_occupation", "low_storage"],
        "suggestions": [
            {
                "title": "📖 Physics Wallah Class", 
                "description": "Free JEE/NEET prep on YouTube", 
                "action": "watch_class", 
                "icon": "🎓", 
                "priority": 1,
                "specificContent": {
                    "name": "Physics Wallah - JEE Prep",
                    "type": "video",
                    "source": "YouTube",
                    "deepLink": "vnd.youtube://channel/UCx3U2M-xyBpR5qRb-rl5bkw",
                    "fallbackUrl": "https://www.youtube.com/@PhysicsWallah"
                }
            },
            {
                "title": "✍️ Khan Academy Math", 
                "description": "Practice problems offline", 
                "action": "open_khan", 
                "icon": "📝", 
                "priority": 2,
                "specificContent": {
                    "name": "Khan Academy",
                    "type": "app",
                    "source": "Khan Academy",
                    "deepLink": "khanacademy://",
                    "fallbackUrl": "https://www.khanacademy.org/math"
                }
            },
            {
                "title": "🎯 Unacademy Free Class", 
                "description": "Live class starting soon", 
                "action": "join_class", 
                "icon": "📺", 
                "priority": 3,
                "specificContent": {
                    "name": "Unacademy Free Classes",
                    "type": "app",
                    "source": "Unacademy",
                    "deepLink": "unacademy://",
                    "fallbackUrl": "https://unacademy.com/goal/jee-main-and-advanced/TMUVD"
                }
            },
        ]
    },
    "weekend_family": {
        "name": "Family Entertainer",
        "emoji": "👨‍👩‍👧‍👦",
        "description": "Cherishes quality family time",
        "triggers": ["weekend", "evening", "wifi_connected", "high_volume"],
        "suggestions": [
            {
                "title": "🎬 Watch Pathaan", 
                "description": "Action blockbuster on Prime Video", 
                "action": "watch_movie", 
                "icon": "🍿", 
                "priority": 1,
                "specificContent": {
                    "name": "Pathaan",
                    "type": "movie",
                    "source": "Prime Video",
                    "deepLink": "https://app.primevideo.com/detail?gti=amzn1.dv.gti.e4b4e4c3-a7a9-4f6e-a9c0-f4e2e4e4e4e4",
                    "fallbackUrl": "https://www.primevideo.com/detail/Pathaan/0H3QT9V7G2V7WM9K2V5H"
                }
            },
            {
                "title": "🍳 Cook Butter Chicken", 
                "description": "Easy recipe by Ranveer Brar", 
                "action": "show_recipe", 
                "icon": "👨‍🍳", 
                "priority": 2,
                "specificContent": {
                    "name": "Butter Chicken Recipe - Ranveer Brar",
                    "type": "recipe",
                    "source": "YouTube",
                    "deepLink": "vnd.youtube://watch?v=a03U45jFxOI",
                    "fallbackUrl": "https://www.youtube.com/watch?v=a03U45jFxOI"
                }
            },
            {
                "title": "🎵 Play Kesariya", 
                "description": "Trending song on Spotify", 
                "action": "play_song", 
                "icon": "🎶", 
                "priority": 3,
                "specificContent": {
                    "name": "Kesariya - Brahmastra",
                    "type": "song",
                    "source": "Spotify",
                    "deepLink": "spotify:track:5O4erNlJ7TuWvLhDA6jsXY",
                    "fallbackUrl": "https://open.spotify.com/track/5O4erNlJ7TuWvLhDA6jsXY"
                }
            },
        ]
    },
    "night_owl": {
        "name": "Night Owl Explorer",
        "emoji": "🦉",
        "description": "Finds inspiration in the quiet hours",
        "triggers": ["night", "high_end_device", "headphones_connected", "dark_mode"],
        "suggestions": [
            {
                "title": "🎧 Lofi Hip Hop Radio", 
                "description": "Beats to relax/study to", 
                "action": "play_focus_music", 
                "icon": "🎵", 
                "priority": 1,
                "specificContent": {
                    "name": "Lofi Girl - beats to relax/study to",
                    "type": "song",
                    "source": "YouTube",
                    "deepLink": "vnd.youtube://watch?v=jfKfPfyJRdk",
                    "fallbackUrl": "https://www.youtube.com/watch?v=jfKfPfyJRdk"
                }
            },
            {
                "title": "📚 Read on Kindle", 
                "description": "Continue your current book", 
                "action": "open_kindle", 
                "icon": "📖", 
                "priority": 2,
                "specificContent": {
                    "name": "Kindle App",
                    "type": "app",
                    "source": "Kindle",
                    "deepLink": "kindle://",
                    "fallbackUrl": "https://read.amazon.com/"
                }
            },
            {
                "title": "🌙 Sleep Stories", 
                "description": "Calm meditation for sleep", 
                "action": "play_sleep_story", 
                "icon": "😴", 
                "priority": 3,
                "specificContent": {
                    "name": "Deep Sleep Meditation",
                    "type": "podcast",
                    "source": "Spotify",
                    "deepLink": "spotify:show:5wSTKsQ3MfPRqsWglLq8Pc",
                    "fallbackUrl": "https://open.spotify.com/show/5wSTKsQ3MfPRqsWglLq8Pc"
                }
            },
        ]
    },
    "mobile_commuter": {
        "name": "Mobile Commuter",
        "emoji": "🚇",
        "description": "Makes the most of travel time",
        "triggers": ["is_moving", "morning_or_evening", "cellular_network", "steps_increasing"],
        "suggestions": [
            {
                "title": "🎙️ The Ranveer Show", 
                "description": "Latest episode on Spotify", 
                "action": "play_podcast", 
                "icon": "🎧", 
                "priority": 1,
                "specificContent": {
                    "name": "The Ranveer Show",
                    "type": "podcast",
                    "source": "Spotify",
                    "deepLink": "spotify:show:6ZcvVBPQ2ToLXEWVbaWwXr",
                    "fallbackUrl": "https://open.spotify.com/show/6ZcvVBPQ2ToLXEWVbaWwXr"
                }
            },
            {
                "title": "📰 Inshorts News", 
                "description": "60-word news updates", 
                "action": "open_news", 
                "icon": "📱", 
                "priority": 2,
                "specificContent": {
                    "name": "Inshorts",
                    "type": "app",
                    "source": "Inshorts",
                    "deepLink": "inshorts://",
                    "fallbackUrl": "https://inshorts.com/"
                }
            },
            {
                "title": "🎵 Bollywood Hits", 
                "description": "Download for offline on JioSaavn", 
                "action": "download_music", 
                "icon": "📲", 
                "priority": 3,
                "specificContent": {
                    "name": "Top Bollywood Hits 2024",
                    "type": "song",
                    "source": "JioSaavn",
                    "deepLink": "jiosaavn://playlist/top-bollywood-hits",
                    "fallbackUrl": "https://www.jiosaavn.com/featured/bollywood-hits-2024/RW3-TbJCCh0_"
                }
            },
        ]
    },
    "digital_newcomer": {
        "name": "Digital Newcomer",
        "emoji": "🌱",
        "description": "Exploring the digital world step by step",
        "triggers": ["large_font_scale", "first_launch", "few_sessions", "reduced_motion"],
        "suggestions": [
            {
                "title": "👋 Learn Smartphone Basics", 
                "description": "Easy Hindi tutorial on YouTube", 
                "action": "start_tutorial", 
                "icon": "📱", 
                "priority": 1,
                "specificContent": {
                    "name": "Smartphone Tips in Hindi",
                    "type": "video",
                    "source": "YouTube",
                    "deepLink": "vnd.youtube://watch?v=kVxu-lbYcJA",
                    "fallbackUrl": "https://www.youtube.com/watch?v=kVxu-lbYcJA"
                }
            },
            {
                "title": "🗣️ Google Assistant", 
                "description": "Speak instead of type", 
                "action": "enable_voice", 
                "icon": "🎤", 
                "priority": 2,
                "specificContent": {
                    "name": "Google Assistant",
                    "type": "app",
                    "source": "Google",
                    "deepLink": "googleassistant://",
                    "fallbackUrl": "https://assistant.google.com/"
                }
            },
            {
                "title": "📞 WhatsApp Guide", 
                "description": "Learn video calling step by step", 
                "action": "whatsapp_tutorial", 
                "icon": "☎️", 
                "priority": 3,
                "specificContent": {
                    "name": "WhatsApp Video Call Tutorial Hindi",
                    "type": "video",
                    "source": "YouTube",
                    "deepLink": "vnd.youtube://watch?v=8VgdJxgNEWk",
                    "fallbackUrl": "https://www.youtube.com/watch?v=8VgdJxgNEWk"
                }
            },
        ]
    },
    "busy_professional": {
        "name": "Time-Pressed Executive",
        "emoji": "⏰",
        "description": "Every minute counts",
        "triggers": ["many_calendar_events", "weekday", "work_hours", "is_busy"],
        "suggestions": [
            {
                "title": "⚡ Quick Meditation", 
                "description": "5-min stress relief on Headspace", 
                "action": "quick_meditation", 
                "icon": "🧘", 
                "priority": 1,
                "specificContent": {
                    "name": "5-Minute Stress Relief",
                    "type": "app",
                    "source": "Headspace",
                    "deepLink": "headspace://",
                    "fallbackUrl": "https://www.headspace.com/meditation/5-minute-meditation"
                }
            },
            {
                "title": "📊 LinkedIn Learning", 
                "description": "Quick leadership tips", 
                "action": "learn_skill", 
                "icon": "📈", 
                "priority": 2,
                "specificContent": {
                    "name": "LinkedIn Learning",
                    "type": "app",
                    "source": "LinkedIn",
                    "deepLink": "linkedin://learning",
                    "fallbackUrl": "https://www.linkedin.com/learning/"
                }
            },
            {
                "title": "☕ Order Coffee", 
                "description": "Your usual from Starbucks", 
                "action": "order_coffee", 
                "icon": "🔕", 
                "priority": 3,
                "specificContent": {
                    "name": "Starbucks Order",
                    "type": "app",
                    "source": "Starbucks",
                    "deepLink": "starbucks://",
                    "fallbackUrl": "https://www.starbucks.in/menu"
                }
            },
        ]
    },
}

# ═══════════════════════════════════════════════════════════════
# USER INTELLIGENCE STORAGE SERVICE 🗄️
# In-memory for hackathon, easily swappable for DB in production
# ═══════════════════════════════════════════════════════════════

class UserIntelligenceStore:
    """
    The "Filing Cabinet" for user intelligence.
    
    Why in-memory?
    - Fast for demos (no DB setup)
    - Easy to test
    - Designed for easy swap to Redis/MongoDB later
    
    Just replace this class with a DB-backed version when you go to production!
    """
    
    def __init__(self):
        # Main storage: fingerprint_id -> UserIntelligence
        self._store: dict[str, dict] = {}
        # Feedback aggregates by scenario
        self._feedback_aggregates: dict[str, dict] = {}
        # Event counts by type (for analytics)
        self._event_counts: dict[str, int] = defaultdict(int)
        
        print("🗄️ UserIntelligenceStore initialized (in-memory mode)")
    
    def get_or_create_user(self, fingerprint_id: str) -> dict:
        """
        Get a user's intelligence profile, or create a new one.
        This is the heart of our "memory" system.
        """
        if fingerprint_id not in self._store:
            # First time seeing this user! Create their profile
            now = int(time.time() * 1000)
            self._store[fingerprint_id] = {
                "fingerprint_id": fingerprint_id,
                "created_at": now,
                "updated_at": now,
                "journey_day": 0,
                "first_seen_at": now,
                "recent_events": [],
                "total_events": 0,
                "patterns": [],
                "preferences": {
                    "liked_categories": [],
                    "disliked_categories": [],
                    "preferred_content_types": [],
                    "preferred_sources": [],
                    "active_hours": [],
                    "preferred_time_of_day": None,
                    "avg_session_duration_ms": 0,
                    "total_sessions": 0,
                    "scenario_affinity": {}
                },
                "total_likes": 0,
                "total_dislikes": 0,
                "last_scenario": None,
                "scenario_history": []
            }
            print(f"🆕 New user created: {fingerprint_id[:8]}...")
        
        return self._store[fingerprint_id]
    
    def update_user(self, fingerprint_id: str, updates: dict) -> dict:
        """Update a user's profile with new data."""
        user = self.get_or_create_user(fingerprint_id)
        user.update(updates)
        user["updated_at"] = int(time.time() * 1000)
        return user
    
    def add_events(self, fingerprint_id: str, events: list[dict]) -> int:
        """
        Add events to a user's profile.
        This is how we "learn" from their behavior.
        """
        user = self.get_or_create_user(fingerprint_id)
        
        for event in events:
            # Add to recent events (keep last 100)
            user["recent_events"].append(event)
            if len(user["recent_events"]) > 100:
                user["recent_events"] = user["recent_events"][-100:]
            
            # Increment counters
            user["total_events"] += 1
            self._event_counts[event.get("event_type", "unknown")] += 1
            
            # Update preferences based on event
            self._update_preferences_from_event(user, event)
        
        user["updated_at"] = int(time.time() * 1000)
        return len(events)
    
    def _update_preferences_from_event(self, user: dict, event: dict):
        """
        Learn from an event to update preferences.
        This is where the "magic" happens! 🪄
        """
        prefs = user["preferences"]
        event_type = event.get("event_type")
        category = event.get("category")
        content_type = event.get("content_type")
        source = event.get("source")
        scenario = event.get("scenario")
        
        # Learn from likes/dislikes
        if event_type == "like" and category:
            if category not in prefs["liked_categories"]:
                prefs["liked_categories"].append(category)
            # Remove from disliked if it was there
            if category in prefs["disliked_categories"]:
                prefs["disliked_categories"].remove(category)
        
        elif event_type == "dislike" and category:
            if category not in prefs["disliked_categories"]:
                prefs["disliked_categories"].append(category)
            # Don't remove from liked - they might like some but not others
        
        # Learn content type preferences from views/clicks
        if event_type in ["view", "click"] and content_type:
            if content_type not in prefs["preferred_content_types"]:
                prefs["preferred_content_types"].append(content_type)
                # Keep only top 5
                prefs["preferred_content_types"] = prefs["preferred_content_types"][-5:]
        
        # Learn source preferences
        if source and event_type in ["view", "click", "like"]:
            if source not in prefs["preferred_sources"]:
                prefs["preferred_sources"].append(source)
                prefs["preferred_sources"] = prefs["preferred_sources"][-5:]
        
        # Update scenario affinity
        if scenario:
            if scenario not in prefs["scenario_affinity"]:
                prefs["scenario_affinity"][scenario] = 0
            # Positive events increase affinity
            if event_type in ["like", "click", "view"]:
                prefs["scenario_affinity"][scenario] += 1
            elif event_type == "dislike":
                prefs["scenario_affinity"][scenario] -= 0.5
        
        # Track active hours
        event_time = event.get("timestamp", int(time.time() * 1000))
        hour = datetime.fromtimestamp(event_time / 1000).hour
        if hour not in prefs["active_hours"]:
            prefs["active_hours"].append(hour)
            prefs["active_hours"] = sorted(prefs["active_hours"])[-8:]  # Keep top 8 hours
        
        # Track session stats
        if event_type == "session_end":
            duration = event.get("duration_ms", 0)
            if duration > 0:
                total_sessions = prefs["total_sessions"] + 1
                current_avg = prefs["avg_session_duration_ms"]
                new_avg = ((current_avg * prefs["total_sessions"]) + duration) / total_sessions
                prefs["avg_session_duration_ms"] = int(new_avg)
                prefs["total_sessions"] = total_sessions
    
    def record_feedback(self, fingerprint_id: str, scenario: str, feedback: str):
        """Record like/dislike feedback."""
        user = self.get_or_create_user(fingerprint_id)
        
        if feedback == "like":
            user["total_likes"] += 1
        elif feedback == "dislike":
            user["total_dislikes"] += 1
        
        # Update scenario aggregates
        if scenario not in self._feedback_aggregates:
            self._feedback_aggregates[scenario] = {"likes": 0, "dislikes": 0}
        
        if feedback == "like":
            self._feedback_aggregates[scenario]["likes"] += 1
        elif feedback == "dislike":
            self._feedback_aggregates[scenario]["dislikes"] += 1
    
    def update_scenario(self, fingerprint_id: str, scenario: str):
        """Record that a user matched a scenario."""
        user = self.get_or_create_user(fingerprint_id)
        user["last_scenario"] = scenario
        
        # Add to history (keep last 20)
        user["scenario_history"].append(scenario)
        if len(user["scenario_history"]) > 20:
            user["scenario_history"] = user["scenario_history"][-20:]
        
        # Update affinity
        prefs = user["preferences"]
        if scenario not in prefs["scenario_affinity"]:
            prefs["scenario_affinity"][scenario] = 0
        prefs["scenario_affinity"][scenario] += 0.5  # Small boost for matching
    
    def calculate_journey_day(self, fingerprint_id: str) -> int:
        """
        Calculate how many days since first seen.
        This drives the Day 0 → Day 30 progression!
        """
        user = self.get_or_create_user(fingerprint_id)
        first_seen = user.get("first_seen_at", int(time.time() * 1000))
        now = int(time.time() * 1000)
        
        days = (now - first_seen) // (24 * 60 * 60 * 1000)
        user["journey_day"] = days
        return days
    
    def get_intelligence_summary(self, fingerprint_id: str) -> dict:
        """
        Get a human-readable summary of what we know about a user.
        This powers the "Why This Experience?" section.
        """
        user = self.get_or_create_user(fingerprint_id)
        prefs = user["preferences"]
        journey_day = self.calculate_journey_day(fingerprint_id)
        
        # Determine stage
        if journey_day <= 3:
            stage = "newcomer"
        elif journey_day <= 10:
            stage = "explorer"
        elif journey_day <= 20:
            stage = "regular"
        else:
            stage = "partner"
        
        # Generate insights
        insights = []
        
        if prefs["liked_categories"]:
            cats = ", ".join(prefs["liked_categories"][:3])
            insights.append(f"Loves {cats} content")
        
        if prefs["preferred_sources"]:
            sources = ", ".join(prefs["preferred_sources"][:2])
            insights.append(f"Prefers {sources}")
        
        if prefs["active_hours"]:
            if any(h in [5, 6, 7, 8, 9] for h in prefs["active_hours"]):
                insights.append("Early bird 🌅")
            if any(h in [22, 23, 0, 1, 2] for h in prefs["active_hours"]):
                insights.append("Night owl 🦉")
        
        if user["total_events"] > 50:
            insights.append("Power user! ⚡")
        
        if not insights:
            insights.append("Getting to know you...")
        
        # Calculate engagement score
        events = user["total_events"]
        likes = user["total_likes"]
        sessions = prefs["total_sessions"]
        
        # Simple engagement formula
        engagement = min(1.0, (events / 100) * 0.3 + (likes / 20) * 0.3 + (sessions / 10) * 0.4)
        
        # Personalization level
        if engagement > 0.7:
            level = "high"
        elif engagement > 0.3:
            level = "medium"
        else:
            level = "low"
        
        return {
            "journey_day": journey_day,
            "stage": stage,
            "insights": insights,
            "top_categories": prefs["liked_categories"][:3],
            "top_content_types": prefs["preferred_content_types"][:3],
            "engagement_score": round(engagement, 2),
            "personalization_level": level
        }
    
    def get_feedback_stats(self) -> dict:
        """Get aggregate feedback statistics."""
        return {
            "scenarios": self._feedback_aggregates,
            "total_feedback": sum(
                v.get("likes", 0) + v.get("dislikes", 0)
                for v in self._feedback_aggregates.values()
            ),
            "event_counts": dict(self._event_counts)
        }
    
    def get_all_users_count(self) -> int:
        """Get total number of users."""
        return len(self._store)


# Initialize the global store
intelligence_store = UserIntelligenceStore()

# Legacy compatibility (for existing feedback endpoints)
feedback_store: dict[str, list[dict]] = {}  # user_id -> list of feedback items
feedback_aggregates: dict[str, dict] = {}   # scenario -> {likes: 0, dislikes: 0}

# ═══════════════════════════════════════════════════════════════
# SCENARIO MATCHING ENGINE
# ═══════════════════════════════════════════════════════════════

def match_scenario(signals: FullSignalPayload) -> tuple[str, float]:
    """
    Match signals to the best scenario.
    Returns (scenario_id, confidence_score)
    """
    scores = {}
    
    for scenario_id, scenario in SCENARIOS.items():
        score = 0
        max_score = len(scenario["triggers"])
        
        for trigger in scenario["triggers"]:
            if check_trigger(trigger, signals):
                score += 1
        
        if max_score > 0:
            scores[scenario_id] = score / max_score
    
    # Find best match
    if not scores:
        return "general", 0.3
    
    best_scenario = max(scores, key=scores.get)
    confidence = scores[best_scenario]
    
    # Require at least 40% match
    if confidence < 0.4:
        return "general", confidence
    
    return best_scenario, confidence

def check_trigger(trigger: str, signals: FullSignalPayload) -> bool:
    """Check if a specific trigger condition is met"""
    
    # Time triggers
    if trigger == "morning":
        return signals.context.is_morning
    if trigger == "evening":
        return signals.context.is_evening
    if trigger == "night":
        return signals.context.is_night
    if trigger == "morning_or_evening":
        return signals.context.is_morning or signals.context.is_evening
    if trigger == "weekend":
        return signals.context.is_weekend
    if trigger == "weekday":
        return not signals.context.is_weekend
    if trigger == "work_hours":
        return signals.context.is_afternoon and not signals.context.is_weekend
    
    # Language triggers
    if trigger == "hindi_or_regional":
        return signals.context.language in ["hi", "ta", "te", "mr", "bn", "gu", "kn", "ml"]
    
    # Device triggers
    if trigger == "low_end_device":
        return signals.device.is_low_end
    if trigger == "high_end_device":
        return not signals.device.is_low_end
    if trigger == "large_font_scale":
        return signals.device.font_scale > 1.2
    if trigger == "dark_mode":
        return signals.device.color_scheme == "dark"
    if trigger == "reduced_motion":
        return signals.device.reduced_motion
    
    # Network triggers
    if trigger == "wifi_connected":
        return signals.network.is_wifi
    if trigger == "cellular_network":
        return signals.network.type == "CELLULAR"
    
    # Environment triggers
    if trigger == "low_brightness":
        return signals.environment.brightness < 0.3
    if trigger == "high_volume":
        return signals.environment.volume_level > 0.7
    if trigger == "headphones_connected":
        return signals.environment.is_headphones_connected
    
    # App triggers
    if trigger == "first_launch":
        return signals.app.is_first_launch
    if trigger == "few_sessions":
        return signals.app.session_count < 5
    if trigger == "low_storage":
        return signals.app.storage_available is not None and signals.app.storage_available < 1024 * 1024 * 1024  # < 1GB
    
    # Activity triggers
    if trigger == "is_moving":
        return signals.activity.is_moving
    if trigger == "steps_increasing":
        return signals.activity.steps_today is not None and signals.activity.steps_today > 1000
    
    # Social triggers
    if trigger == "many_calendar_events":
        return signals.social.upcoming_events_count is not None and signals.social.upcoming_events_count >= 2
    if trigger == "is_busy":
        return signals.social.is_busy
    
    # Questionnaire triggers
    if trigger == "spiritual_interest":
        return signals.questionnaire.primary_use == "spiritual" or "devotional" in signals.questionnaire.interests
    if trigger == "business_use":
        return signals.questionnaire.primary_use == "business" or signals.questionnaire.occupation == "business_owner"
    if trigger == "student_occupation":
        return signals.questionnaire.occupation == "student" or signals.questionnaire.primary_use == "education"
    
    return False

# ═══════════════════════════════════════════════════════════════
# MODE & SEGMENT DETERMINATION
# ═══════════════════════════════════════════════════════════════

def determine_mode(signals: FullSignalPayload) -> str:
    """Determine UI mode based on device constraints."""
    if signals.device.is_low_end:
        return "lite"
    if signals.battery.is_low_power:
        return "lite"
    if signals.app.storage_available and signals.app.storage_available < 500 * 1024 * 1024:  # < 500MB
        return "lite"
    if signals.network.is_wifi and signals.battery.level > 0.5:
        return "rich"
    return "standard"

def get_journey_stage(day: int) -> tuple[str, str, str]:
    """Map journey day to stage, value, and next milestone."""
    if day <= 3:
        return "newcomer", "Getting to know you...", f"{4 - day} days to Explorer!"
    elif day <= 10:
        return "explorer", f"Discovered {day} preferences", f"{11 - day} days to Regular!"
    elif day <= 20:
        hours = round(day * 0.3, 1)
        return "regular", f"Saved ~{hours} hours", f"{21 - day} days to Partner!"
    else:
        hours = round(day * 0.4, 1)
        return "partner", f"Saved {hours} hours this month!", "You're a trusted partner! 🤝"

# ═══════════════════════════════════════════════════════════════
# REASONING GENERATOR
# ═══════════════════════════════════════════════════════════════

def generate_reasoning(signals: FullSignalPayload, scenario_id: str, mode: str) -> list[str]:
    """Generate transparent reasoning for the personalization."""
    reasoning = []
    
    # Time
    time = signals.context.time_of_day
    time_emojis = {"morning": "🌅", "afternoon": "🌞", "evening": "🌆", "night": "🌙"}
    reasoning.append(f"{time_emojis.get(time, '⏰')} It's {time} - content adjusted accordingly")
    
    # Weekend/Weekday
    if signals.context.is_weekend:
        reasoning.append("📅 Weekend detected - leisure focus")
    else:
        reasoning.append("💼 Weekday - productivity focus")
    
    # Device
    if signals.device.is_low_end:
        reasoning.append(f"📱 Budget device - Lite mode for smooth experience")
    else:
        reasoning.append(f"📱 {signals.device.brand or 'Device'} {signals.device.model_name or ''} - Full experience")
    
    # Battery
    battery_pct = int(signals.battery.level * 100)
    if signals.battery.is_low_power:
        reasoning.append(f"🔋 Low battery ({battery_pct}%) - Power saving active")
    elif signals.battery.is_charging:
        reasoning.append(f"🔌 Charging ({battery_pct}%) - Rich content enabled")
    else:
        reasoning.append(f"🔋 Battery at {battery_pct}%")
    
    # Network
    if signals.network.is_wifi:
        reasoning.append("📶 WiFi connected - High-quality content")
    else:
        carrier = signals.network.carrier_name or signals.network.type
        reasoning.append(f"📶 {carrier} network - Optimized for data saving")
    
    # Location
    if signals.location.has_permission and signals.location.city:
        tier_label = {"tier1": "Metro", "tier2": "City", "tier3": "Town", "rural": "Village"}.get(signals.location.tier, "")
        reasoning.append(f"📍 {signals.location.city} ({tier_label}) - Local content boosted")
    
    # Activity
    if signals.activity.has_permission and signals.activity.steps_today:
        reasoning.append(f"👟 {signals.activity.steps_today} steps today - Commuter mode suggested")
    
    # Questionnaire
    if signals.questionnaire.primary_use:
        reasoning.append(f"🎯 You told us: {signals.questionnaire.primary_use.title()} focus")
    if signals.questionnaire.interests:
        interests_str = ", ".join(signals.questionnaire.interests[:3])
        reasoning.append(f"⭐ Your interests: {interests_str}")
    
    # Matched scenario
    if scenario_id in SCENARIOS:
        reasoning.append(f"🎭 Matched persona: {SCENARIOS[scenario_id]['name']}")
    
    return reasoning

# ═══════════════════════════════════════════════════════════════
# LLM INTEGRATION - The Brain of Munim Ji 🧠
# ═══════════════════════════════════════════════════════════════

def generate_llm_greeting(signals: FullSignalPayload, scenario_id: str) -> str:
    """Generate a personalized greeting using LLM or fallback."""
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        # Fallback greetings
        greetings = {
            "morning": "🌅 Shubh Prabhat! Ready to start your day?",
            "afternoon": "🌞 Namaste! Hope your day is going well.",
            "evening": "🌆 Shubh Sandhya! Time to wind down.",
            "night": "🌙 Good evening! Burning the midnight oil?"
        }
        return greetings.get(signals.context.time_of_day, "🙏 Namaste!")
    
    try:
        client = OpenAI(api_key=api_key)
        
        context = f"""
Generate a warm, personalized greeting in 1 line for an Indian user.
Time: {signals.context.time_of_day}
Language preference: {signals.context.language}
Persona: {SCENARIOS.get(scenario_id, {}).get('name', 'General User')}
Weekend: {signals.context.is_weekend}
Location: {signals.location.city or 'Unknown'}

Mix Hindi phrases naturally (Namaste, Shubh Prabhat, etc.) if language is Hindi.
Keep it warm and culturally relevant.
"""
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are Munim Ji, a wise Indian assistant. Generate only the greeting, nothing else."},
                {"role": "user", "content": context}
            ],
            temperature=0.8,
            max_tokens=50
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"LLM Error: {e}")
        return "🙏 Namaste!"


def generate_dynamic_recommendations(
    signals: FullSignalPayload, 
    scenario_id: str,
    user_intelligence: dict,
    num_suggestions: int = 3
) -> list[dict]:
    """
    Generate DYNAMIC recommendations using LLM based on:
    1. Current context (time, device, etc.)
    2. User's learned preferences
    3. Historical behavior
    
    This is the "secret sauce" that makes recommendations feel magical! ✨
    """
    api_key = os.getenv("OPENAI_API_KEY")
    
    # Get the base scenario suggestions as fallback
    scenario = SCENARIOS.get(scenario_id, SCENARIOS["weekend_family"])
    base_suggestions = scenario.get("suggestions", [])
    
    if not api_key:
        # No API key - return base suggestions
        return base_suggestions[:num_suggestions]
    
    try:
        client = OpenAI(api_key=api_key)
        
        # Build context for LLM
        prefs = user_intelligence.get("preferences", {})
        liked_cats = prefs.get("liked_categories", [])
        disliked_cats = prefs.get("disliked_categories", [])
        preferred_sources = prefs.get("preferred_sources", [])
        journey_day = user_intelligence.get("journey_day", 0)
        total_events = user_intelligence.get("total_events", 0)
        
        # Create the prompt
        prompt = f"""
You are Munim Ji, a personalization expert for Indian users.

Generate {num_suggestions} personalized recommendations based on this user's profile:

=== CURRENT CONTEXT ===
Time: {signals.context.time_of_day}
Day: {"Weekend" if signals.context.is_weekend else "Weekday"}
Device: {signals.device.brand or "Unknown"} {signals.device.model_name or ""}
Battery: {int(signals.battery.level * 100)}%
Network: {"WiFi" if signals.network.is_wifi else signals.network.type}
Location: {signals.location.city or "Unknown"}

=== USER PREFERENCES (Learned from {total_events} interactions) ===
Liked categories: {', '.join(liked_cats) if liked_cats else 'Still learning...'}
Avoid categories: {', '.join(disliked_cats) if disliked_cats else 'None yet'}
Preferred sources: {', '.join(preferred_sources) if preferred_sources else 'Various'}
Journey day: {journey_day}

=== MATCHED PERSONA ===
Persona: {scenario.get('name', 'General User')}
Description: {scenario.get('description', '')}

=== QUESTIONNAIRE ANSWERS ===
Primary use: {signals.questionnaire.primary_use or 'Not specified'}
Interests: {', '.join(signals.questionnaire.interests) if signals.questionnaire.interests else 'Not specified'}
Occupation: {signals.questionnaire.occupation or 'Not specified'}
Age group: {signals.questionnaire.age_group or 'Not specified'}

Generate recommendations in this JSON format:
[
  {{
    "title": "emoji + catchy title",
    "description": "Short description of what this is",
    "action": "action_identifier",
    "icon": "relevant_emoji",
    "priority": 1,
    "specificContent": {{
      "name": "Content name",
      "type": "video|song|recipe|podcast|article|app",
      "source": "Platform name",
      "deepLink": "app://deep-link or null",
      "fallbackUrl": "https://web-url"
    }}
  }}
]

Rules:
1. Prioritize user's liked categories, avoid disliked ones
2. Match the time of day (spiritual in morning, relaxing at night, etc.)
3. Use real Indian content (Bollywood, Indian apps, local services)
4. Include deep links for popular Indian apps (YouTube, Spotify, JioSaavn, Prime Video, etc.)
5. For new users (journey_day < 3), suggest discovery content
6. For returning users, personalize based on their preferences
7. Keep descriptions short (max 8 words)

Return ONLY the JSON array, no other text.
"""
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a JSON generator. Output only valid JSON arrays. No markdown, no explanations."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )
        
        # Parse the response
        content = response.choices[0].message.content.strip()
        
        # Clean up potential markdown formatting
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        
        suggestions = json.loads(content)
        
        # Validate and return
        if isinstance(suggestions, list) and len(suggestions) > 0:
            print(f"✨ LLM generated {len(suggestions)} dynamic recommendations")
            return suggestions[:num_suggestions]
        
    except json.JSONDecodeError as e:
        print(f"JSON Parse Error: {e}")
    except Exception as e:
        print(f"LLM Recommendation Error: {e}")
    
    # Fallback to base suggestions
    return base_suggestions[:num_suggestions]


def enhance_suggestions_with_learning(
    suggestions: list[dict],
    user_intelligence: dict
) -> list[dict]:
    """
    Enhance/reorder suggestions based on learned preferences.
    
    This is a lighter-weight alternative when LLM is not available.
    It reorders the base suggestions based on what we've learned.
    """
    prefs = user_intelligence.get("preferences", {})
    liked_cats = set(prefs.get("liked_categories", []))
    disliked_cats = set(prefs.get("disliked_categories", []))
    scenario_affinity = prefs.get("scenario_affinity", {})
    
    scored_suggestions = []
    
    for suggestion in suggestions:
        score = suggestion.get("priority", 1)
        
        # Get category from the suggestion (if available)
        specific_content = suggestion.get("specificContent", {})
        content_type = specific_content.get("type", "").lower()
        
        # Map content types to categories
        category_mapping = {
            "video": "entertainment",
            "song": "music",
            "recipe": "cooking",
            "podcast": "education",
            "article": "reading",
            "app": "utility"
        }
        category = category_mapping.get(content_type, "general")
        
        # Boost score for liked categories
        if category in liked_cats:
            score -= 2  # Lower score = higher priority
        
        # Penalize disliked categories
        if category in disliked_cats:
            score += 5  # Higher score = lower priority
        
        # Check source preferences
        source = specific_content.get("source", "").lower()
        preferred_sources = [s.lower() for s in prefs.get("preferred_sources", [])]
        if source in preferred_sources:
            score -= 1
        
        scored_suggestions.append((score, suggestion))
    
    # Sort by score (lower is better)
    scored_suggestions.sort(key=lambda x: x[0])
    
    # Re-assign priorities
    result = []
    for i, (_, suggestion) in enumerate(scored_suggestions):
        suggestion["priority"] = i + 1
        result.append(suggestion)
    
    return result

# ═══════════════════════════════════════════════════════════════
# API ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/")
def read_root():
    return {
        "message": "Namaste! Bharat Engine v0.3.0 is running.",
        "features": [
            "Maximum signal collection (Tier 1 + Tier 2)",
            "8 rich persona scenarios",
            "Progressive questionnaire",
            "LLM-powered personalization"
        ],
        "scenarios": list(SCENARIOS.keys())
    }

@app.post("/v1/init", response_model=EngineResponse)
def initialize_context(signals: FullSignalPayload):
    """
    The Core Inference Endpoint - User Intelligence Edition 🧠
    
    This is the "brain" of Munim Ji:
    1. Matches user to a persona based on signals
    2. Loads their intelligence profile (learned preferences)
    3. Generates dynamic, personalized recommendations
    4. Tracks the interaction for future learning
    """
    
    # 0. Get or create user intelligence
    user_intelligence = {}
    intelligence_summary = None
    journey_day = signals.journey_day
    
    if signals.fingerprint_id:
        # We have a fingerprint - load their intelligence!
        user_intelligence = intelligence_store.get_or_create_user(signals.fingerprint_id)
        
        # Calculate actual journey day from first seen
        calculated_day = intelligence_store.calculate_journey_day(signals.fingerprint_id)
        journey_day = max(signals.journey_day, calculated_day)  # Use higher of the two
        
        # Get their intelligence summary
        intelligence_summary = intelligence_store.get_intelligence_summary(signals.fingerprint_id)
        
        # Track session start event
        intelligence_store.add_events(signals.fingerprint_id, [{
            "event_type": "session_start",
            "event_name": "app_opened",
            "timestamp": int(time.time() * 1000),
            "metadata": {
                "time_of_day": signals.context.time_of_day,
                "is_weekend": signals.context.is_weekend
            }
        }])
        
        print(f"🧠 User intelligence loaded for {signals.fingerprint_id[:8]}... (Day {journey_day})")
    
    # 1. Match to best scenario (consider user preferences too!)
    scenario_id, confidence = match_scenario(signals)
    
    # Boost confidence if we have learned affinity for this scenario
    if user_intelligence:
        prefs = user_intelligence.get("preferences", {})
        affinity = prefs.get("scenario_affinity", {}).get(scenario_id, 0)
        if affinity > 0:
            confidence = min(1.0, confidence + (affinity * 0.1))  # Boost up to 10%
    
    scenario = SCENARIOS.get(scenario_id, SCENARIOS["weekend_family"])  # Fallback
    
    # Update scenario in user profile
    if signals.fingerprint_id:
        intelligence_store.update_scenario(signals.fingerprint_id, scenario_id)
    
    # 2. Determine mode
    mode = determine_mode(signals)
    
    # 3. Get journey info
    stage, value, next_milestone = get_journey_stage(journey_day)
    
    # 4. Generate greeting
    greeting = generate_llm_greeting(signals, scenario_id)
    
    # 5. Generate reasoning (enhanced with intelligence insights)
    reasoning = generate_reasoning(signals, scenario_id, mode)
    
    # Add intelligence-based reasoning
    if intelligence_summary:
        if intelligence_summary.get("personalization_level") == "high":
            reasoning.append("🧠 High personalization - recommendations tailored to your history")
        elif intelligence_summary.get("personalization_level") == "medium":
            reasoning.append("🌱 Learning your preferences...")
        
        if intelligence_summary.get("insights"):
            for insight in intelligence_summary["insights"][:2]:
                reasoning.append(f"💡 {insight}")
    
    # 6. Build insights
    insights = []
    if signals.location.has_permission:
        insights.append("📍 Location-aware content")
    if signals.activity.has_permission:
        insights.append("👟 Activity-based suggestions")
    if signals.social.has_calendar_permission:
        insights.append("📅 Calendar-aware timing")
    if signals.questionnaire.answered_at:
        insights.append("✅ Profile customized")
    
    # Add intelligence-based insights
    if intelligence_summary:
        if intelligence_summary.get("top_categories"):
            insights.append(f"❤️ Loves: {', '.join(intelligence_summary['top_categories'][:2])}")
        
        score = intelligence_summary.get("engagement_score", 0)
        if score > 0.5:
            insights.append(f"⚡ Engaged user ({int(score * 100)}%)")
    
    if not insights:
        insights.append("Getting to know you...")
    
    # 7. Build suggestions - NOW WITH DYNAMIC RECOMMENDATIONS! 🎯
    use_dynamic = signals.use_dynamic_recommendations and bool(os.getenv("OPENAI_API_KEY"))
    
    if use_dynamic and user_intelligence:
        # Use LLM to generate personalized recommendations
        raw_suggestions = generate_dynamic_recommendations(
            signals, 
            scenario_id, 
            user_intelligence,
            num_suggestions=3
        )
    else:
        # Use base scenario suggestions
        raw_suggestions = scenario["suggestions"]
    
    # Enhance with learning (reorder based on preferences)
    if user_intelligence:
        raw_suggestions = enhance_suggestions_with_learning(raw_suggestions, user_intelligence)
    
    # Convert to Suggestion models
    suggestions = []
    for s in raw_suggestions[:3]:  # Keep top 3
        suggestion_data = {
            "title": s.get("title", ""),
            "description": s.get("description", ""),
            "action": s.get("action", ""),
            "icon": s.get("icon", "🎯"),
            "priority": s.get("priority", 1)
        }
        
        # Handle specificContent (could be dict or nested)
        specific = s.get("specificContent") or s.get("specific_content")
        if specific:
            suggestion_data["specificContent"] = SpecificContent(
                name=specific.get("name", ""),
                type=specific.get("type", "article"),
                source=specific.get("source", ""),
                deep_link=specific.get("deepLink") or specific.get("deep_link"),
                fallback_url=specific.get("fallbackUrl") or specific.get("fallback_url"),
                thumbnail=specific.get("thumbnail")
            )
        
        suggestions.append(Suggestion(**suggestion_data))
    
    # 8. Build response with intelligence!
    message = f"Matched {scenario['name']} with {int(confidence * 100)}% confidence."
    if use_dynamic:
        message += " Dynamic recommendations active! ✨"
    message += f" {mode.title()} mode."
    
    return EngineResponse(
        user_segment=scenario_id,
        recommended_mode=mode,
        persona=Persona(
            name=scenario["name"],
            emoji=scenario["emoji"],
            description=scenario["description"],
            scenario=scenario_id
        ),
        suggestions=suggestions,
        journey=Journey(
            day=journey_day,
            stage=stage,
            insights=insights,
            value_delivered=value,
            next_milestone=next_milestone
        ),
        greeting=greeting,
        message=message,
        reasoning=reasoning,
        matched_scenario=scenario_id,
        confidence=confidence,
        intelligence_summary=intelligence_summary,
        dynamic_recommendations=use_dynamic
    )

@app.get("/v1/scenarios")
def list_scenarios():
    """List all available scenarios with their triggers."""
    return {
        "scenarios": [
            {
                "id": sid,
                "name": s["name"],
                "emoji": s["emoji"],
                "description": s["description"],
                "triggers": s["triggers"]
            }
            for sid, s in SCENARIOS.items()
        ]
    }

@app.post("/v1/feedback", response_model=FeedbackResponse)
def submit_feedback(feedback: FeedbackRequest):
    """
    Record user feedback (like/dislike) on a suggestion.
    
    This is where LEARNING happens! 🧠
    - Updates user preferences
    - Affects future recommendations
    - Tracks scenario affinity
    """
    scenario = feedback.scenario
    learning_applied = False
    
    # If we have a fingerprint, apply learning!
    if feedback.fingerprint_id:
        # Record in intelligence store
        intelligence_store.record_feedback(
            feedback.fingerprint_id,
            scenario,
            feedback.feedback
        )
        
        # Create an event for this feedback
        event = {
            "event_type": feedback.feedback,  # 'like' or 'dislike'
            "event_name": f"{feedback.feedback}_{feedback.suggestion_action}",
            "category": feedback.category,
            "content_type": feedback.content_type,
            "source": feedback.source,
            "scenario": scenario,
            "timestamp": feedback.timestamp
        }
        
        # Add the event (this updates preferences automatically!)
        intelligence_store.add_events(feedback.fingerprint_id, [event])
        learning_applied = True
        
        print(f"🧠 Learning applied for {feedback.fingerprint_id[:8]}... - {feedback.feedback} on {feedback.category or 'unknown'}")
    else:
        # Legacy mode - just update aggregates
        if scenario not in feedback_aggregates:
            feedback_aggregates[scenario] = {"likes": 0, "dislikes": 0}
        
        if feedback.feedback == "like":
            feedback_aggregates[scenario]["likes"] += 1
        elif feedback.feedback == "dislike":
            feedback_aggregates[scenario]["dislikes"] += 1
    
    # Get updated stats
    stats = intelligence_store.get_feedback_stats()
    scenario_stats = stats["scenarios"].get(scenario, {"likes": 0, "dislikes": 0})
    
    # Log for debugging
    print(f"📊 Feedback received: {feedback.scenario}/{feedback.suggestion_action} = {feedback.feedback}")
    
    return FeedbackResponse(
        success=True,
        message=f"Thank you! {'We learned from your feedback.' if learning_applied else 'Feedback recorded.'}",
        total_likes=scenario_stats.get("likes", 0),
        total_dislikes=scenario_stats.get("dislikes", 0),
        learning_applied=learning_applied
    )

@app.get("/v1/feedback/stats")
def get_feedback_stats():
    """Get aggregate feedback statistics for all scenarios."""
    return intelligence_store.get_feedback_stats()

# ═══════════════════════════════════════════════════════════════
# EVENT TRACKING ENDPOINTS - The "Ears" of the System 👂
# ═══════════════════════════════════════════════════════════════

@app.post("/v1/event", response_model=EventResponse)
def track_events(request: EventRequest):
    """
    Track user events for behavioral learning.
    
    This is how we "listen" to what users do:
    - Views, clicks, likes, dislikes
    - Session starts/ends
    - Actions taken on suggestions
    
    The more events we collect, the smarter our recommendations become!
    """
    fingerprint_id = request.fingerprint_id
    events = [event.model_dump() for event in request.events]
    
    # Add events to the intelligence store
    events_tracked = intelligence_store.add_events(fingerprint_id, events)
    
    # Log for debugging
    event_types = [e.get("event_type") for e in events]
    print(f"📊 Events tracked for {fingerprint_id[:8]}...: {event_types}")
    
    return EventResponse(
        success=True,
        events_tracked=events_tracked,
        message=f"Tracked {events_tracked} events. Thank you for helping us personalize your experience!"
    )

@app.get("/v1/user/{fingerprint_id}/intelligence")
def get_user_intelligence(fingerprint_id: str):
    """
    Get the intelligence summary for a user.
    
    This shows:
    - What journey day they're on
    - What we've learned about them
    - Their engagement score
    """
    summary = intelligence_store.get_intelligence_summary(fingerprint_id)
    user = intelligence_store.get_or_create_user(fingerprint_id)
    
    return {
        "success": True,
        "fingerprint_id": fingerprint_id,
        "summary": summary,
        "preferences": user.get("preferences", {}),
        "total_events": user.get("total_events", 0),
        "total_likes": user.get("total_likes", 0),
        "total_dislikes": user.get("total_dislikes", 0),
        "scenario_history": user.get("scenario_history", [])[-5:]  # Last 5 scenarios
    }

@app.get("/v1/stats")
def get_platform_stats():
    """
    Get overall platform statistics.
    Useful for dashboards and monitoring.
    """
    return {
        "total_users": intelligence_store.get_all_users_count(),
        "feedback_stats": intelligence_store.get_feedback_stats(),
        "scenarios_available": len(SCENARIOS)
    }

# ═══════════════════════════════════════════════════════════════
# CHAT ENDPOINT - Ask Munim Ji! 💬
# ═══════════════════════════════════════════════════════════════

class ChatRequest(FlexibleModel):
    """Request body for chat with Munim Ji"""
    message: str
    fingerprint_id: Optional[str] = Field(default=None, alias="fingerprintId")
    # Optional context for better responses
    context: Optional[ContextSignals] = None

class ChatResponse(BaseModel):
    """Response from Munim Ji chat"""
    success: bool
    response: str
    suggestions: list[str] = []  # Quick follow-up suggestions
    
    model_config = ConfigDict(populate_by_name=True)

@app.post("/v1/chat", response_model=ChatResponse)
def chat_with_munim_ji(request: ChatRequest):
    """
    Chat with Munim Ji! 💬
    
    This endpoint allows users to ask questions and get personalized responses.
    It uses OpenAI's GPT model to generate helpful, culturally-relevant answers.
    
    The assistant is designed to be:
    - Warm and friendly (like a wise Indian elder)
    - Helpful with recommendations
    - Knowledgeable about Indian culture, festivals, and lifestyle
    - Supportive of the user's journey
    """
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        # Fallback response when no API key is configured
        return ChatResponse(
            success=True,
            response="🙏 Namaste! I'm Munim Ji, your digital companion. I'm currently in offline mode, but I'm here to help! Try swiping through the recommendation cards for personalized suggestions.",
            suggestions=["Show me today's recommendations", "What can you help me with?"]
        )
    
    try:
        client = OpenAI(api_key=api_key)
        
        # Get user context if available
        user_context = ""
        if request.fingerprint_id:
            user_intel = intelligence_store.get_intelligence_summary(request.fingerprint_id)
            if user_intel:
                user_context = f"""
User Context:
- Journey Day: {user_intel.get('journey_day', 0)}
- Stage: {user_intel.get('stage', 'newcomer')}
- Insights: {', '.join(user_intel.get('insights', []))}
- Top Interests: {', '.join(user_intel.get('top_categories', []))}
"""
        
        # Get time context
        time_context = ""
        if request.context:
            time_context = f"""
Current Time: {request.context.time_of_day}
Weekend: {request.context.is_weekend}
"""
        
        system_prompt = f"""You are Munim Ji (मुनीम जी), a wise and friendly Indian digital assistant. 
Your name means "the accountant" or "keeper of records" - you keep track of what users love!

Your personality:
- Warm, respectful, and encouraging (like a wise Indian elder)
- Mix Hindi phrases naturally (Namaste, Shubh, Arre wah!, etc.)
- Knowledgeable about Indian culture, festivals, food, music, movies
- Supportive of personal growth and daily routines
- Keep responses concise (2-3 sentences max) but helpful

{user_context}
{time_context}

Guidelines:
- If asked about recommendations, suggest they check the swipeable cards
- If asked about yourself, explain you're their personal digital companion from Bharat
- For spiritual questions, be respectful and non-denominational
- For entertainment questions, suggest popular Indian content
- Always end with something encouraging or actionable
"""
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ],
            temperature=0.7,
            max_tokens=200
        )
        
        ai_response = response.choices[0].message.content.strip()
        
        # Generate quick follow-up suggestions
        suggestions = []
        message_lower = request.message.lower()
        
        if any(word in message_lower for word in ["music", "song", "gaana"]):
            suggestions = ["Play something devotional", "Bollywood hits", "Relaxing music"]
        elif any(word in message_lower for word in ["movie", "film", "watch"]):
            suggestions = ["Latest releases", "Family movies", "Classic Bollywood"]
        elif any(word in message_lower for word in ["food", "recipe", "cook", "khana"]):
            suggestions = ["Quick recipes", "Festival specials", "Healthy options"]
        elif any(word in message_lower for word in ["help", "what can you"]):
            suggestions = ["Show recommendations", "Change settings", "Learn about me"]
        else:
            suggestions = ["Show me more", "Today's picks", "Surprise me!"]
        
        # Log the chat
        print(f"💬 Chat: '{request.message[:50]}...' -> '{ai_response[:50]}...'")
        
        return ChatResponse(
            success=True,
            response=ai_response,
            suggestions=suggestions
        )
        
    except Exception as e:
        print(f"Chat Error: {e}")
        return ChatResponse(
            success=False,
            response="🙏 Sorry, I'm having trouble connecting right now. Please try again in a moment!",
            suggestions=["Try again", "Browse recommendations"]
        )
