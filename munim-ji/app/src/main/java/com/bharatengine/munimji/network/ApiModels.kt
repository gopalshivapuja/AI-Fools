package com.bharatengine.munimji.network

import com.google.gson.annotations.SerializedName

/**
 * API Models for Bharat Context-Adaptive Engine
 * 
 * These data classes match the backend's response format exactly.
 * Gson uses @SerializedName to map JSON keys to Kotlin properties.
 * 
 * 🎓 Learning Tip: The backend uses snake_case (Python style), 
 * but Kotlin prefers camelCase. @SerializedName bridges this gap!
 * 
 * Example:
 *   JSON: { "user_segment": "morning_devotee" }
 *   Kotlin: userSegment = "morning_devotee"
 */

// ═══════════════════════════════════════════════════════════════
// REQUEST MODELS - What we send TO the backend
// ═══════════════════════════════════════════════════════════════

/**
 * The full signal payload we send to get personalized recommendations.
 * For the hackathon demo, we're sending minimal signals.
 * In production, you'd collect device info, location, etc.
 */
data class SignalPayload(
    @SerializedName("fingerprint_id")
    val fingerprintId: String? = null,
    
    @SerializedName("use_dynamic_recommendations")
    val useDynamicRecommendations: Boolean = true,
    
    @SerializedName("journey_day")
    val journeyDay: Int = 0,
    
    // Device signals
    val device: DeviceSignals = DeviceSignals(),
    
    // Network signals  
    val network: NetworkSignals = NetworkSignals(),
    
    // Battery signals
    val battery: BatterySignals = BatterySignals(),
    
    // Context signals (time of day, etc.)
    val context: ContextSignals = ContextSignals(),
    
    // Environment signals
    val environment: EnvironmentSignals = EnvironmentSignals(),
    
    // App signals
    val app: AppSignals = AppSignals(),
    
    // Location signals
    val location: LocationSignals = LocationSignals(),
    
    // Activity signals
    val activity: ActivitySignals = ActivitySignals(),
    
    // Social signals
    val social: SocialSignals = SocialSignals(),
    
    // Questionnaire answers
    val questionnaire: QuestionnaireSignals = QuestionnaireSignals()
)

data class DeviceSignals(
    val brand: String? = android.os.Build.BRAND,
    
    @SerializedName("model_name")
    val modelName: String? = android.os.Build.MODEL,
    
    @SerializedName("os_version")
    val osVersion: String? = android.os.Build.VERSION.RELEASE,
    
    @SerializedName("device_type")
    val deviceType: String = "PHONE",
    
    @SerializedName("total_memory")
    val totalMemory: Long? = null,
    
    @SerializedName("screen_width")
    val screenWidth: Float = 360f,
    
    @SerializedName("screen_height")
    val screenHeight: Float = 640f,
    
    @SerializedName("is_low_end")
    val isLowEnd: Boolean = false,
    
    @SerializedName("font_scale")
    val fontScale: Float = 1.0f,
    
    @SerializedName("color_scheme")
    val colorScheme: String = "dark",
    
    @SerializedName("reduced_motion")
    val reducedMotion: Boolean = false
)

data class NetworkSignals(
    val type: String = "WIFI",
    
    @SerializedName("is_internet_reachable")
    val isInternetReachable: Boolean = true,
    
    @SerializedName("is_wifi")
    val isWifi: Boolean = true,
    
    @SerializedName("carrier_name")
    val carrierName: String? = null,
    
    @SerializedName("carrier_country")
    val carrierCountry: String? = "IN"
)

data class BatterySignals(
    val level: Float = 1.0f,
    
    @SerializedName("is_charging")
    val isCharging: Boolean = false,
    
    @SerializedName("is_low_power")
    val isLowPower: Boolean = false
)

data class ContextSignals(
    val timestamp: Long = System.currentTimeMillis(),
    val timezone: String = "Asia/Kolkata",
    val locale: String = "en-IN",
    val language: String = "en",
    
    @SerializedName("time_of_day")
    val timeOfDay: String = getCurrentTimeOfDay(),
    
    @SerializedName("is_morning")
    val isMorning: Boolean = isCurrentlyMorning(),
    
    @SerializedName("is_afternoon")
    val isAfternoon: Boolean = isCurrentlyAfternoon(),
    
    @SerializedName("is_evening")
    val isEvening: Boolean = isCurrentlyEvening(),
    
    @SerializedName("is_night")
    val isNight: Boolean = isCurrentlyNight(),
    
    @SerializedName("is_weekend")
    val isWeekend: Boolean = isCurrentlyWeekend()
)

data class EnvironmentSignals(
    val brightness: Float = 0.5f,
    
    @SerializedName("volume_level")
    val volumeLevel: Float = 0.5f,
    
    @SerializedName("is_headphones_connected")
    val isHeadphonesConnected: Boolean = false,
    
    @SerializedName("is_silent_mode")
    val isSilentMode: Boolean = false
)

data class AppSignals(
    @SerializedName("install_time")
    val installTime: Long? = null,
    
    @SerializedName("last_open_time")
    val lastOpenTime: Long? = System.currentTimeMillis(),
    
    @SerializedName("app_version")
    val appVersion: String? = "1.0.0",
    
    @SerializedName("build_number")
    val buildNumber: String? = "1",
    
    @SerializedName("session_count")
    val sessionCount: Int = 1,
    
    @SerializedName("total_time_spent")
    val totalTimeSpent: Int = 0,
    
    @SerializedName("storage_available")
    val storageAvailable: Long? = null,
    
    @SerializedName("is_first_launch")
    val isFirstLaunch: Boolean = false
)

data class LocationSignals(
    @SerializedName("has_permission")
    val hasPermission: Boolean = false,
    
    val latitude: Double? = null,
    val longitude: Double? = null,
    val city: String? = null,
    val state: String? = null,
    val country: String? = "India",
    val tier: String = "unknown",
    
    @SerializedName("is_urban")
    val isUrban: Boolean = false
)

data class ActivitySignals(
    @SerializedName("has_permission")
    val hasPermission: Boolean = false,
    
    @SerializedName("steps_today")
    val stepsToday: Int? = null,
    
    @SerializedName("is_moving")
    val isMoving: Boolean = false,
    
    @SerializedName("activity_type")
    val activityType: String = "unknown"
)

data class SocialSignals(
    @SerializedName("has_contacts_permission")
    val hasContactsPermission: Boolean = false,
    
    @SerializedName("contacts_count")
    val contactsCount: Int? = null,
    
    @SerializedName("has_calendar_permission")
    val hasCalendarPermission: Boolean = false,
    
    @SerializedName("upcoming_events_count")
    val upcomingEventsCount: Int? = null,
    
    @SerializedName("is_busy")
    val isBusy: Boolean = false
)

data class QuestionnaireSignals(
    @SerializedName("primary_use")
    val primaryUse: String? = null,
    
    @SerializedName("preferred_language")
    val preferredLanguage: String? = "en",
    
    @SerializedName("age_group")
    val ageGroup: String? = null,
    
    val interests: List<String> = emptyList(),
    val occupation: String? = null,
    
    @SerializedName("shopping_frequency")
    val shoppingFrequency: String? = null,
    
    @SerializedName("content_preference")
    val contentPreference: String? = null,
    
    @SerializedName("answered_at")
    val answeredAt: Long? = null,
    
    @SerializedName("completed_days")
    val completedDays: List<Int> = emptyList()
)

// ═══════════════════════════════════════════════════════════════
// RESPONSE MODELS - What we receive FROM the backend
// ═══════════════════════════════════════════════════════════════

/**
 * The main response from the engine.
 * Contains everything needed to show personalized content!
 */
data class EngineResponse(
    @SerializedName("user_segment")
    val userSegment: String,
    
    @SerializedName("recommended_mode")
    val recommendedMode: String,
    
    val persona: Persona,
    val suggestions: List<Suggestion>,
    val journey: Journey,
    val greeting: String,
    val message: String,
    val reasoning: List<String>,
    
    @SerializedName("matched_scenario")
    val matchedScenario: String,
    
    val confidence: Float,
    
    @SerializedName("intelligence_summary")
    val intelligenceSummary: IntelligenceSummary? = null,
    
    @SerializedName("dynamic_recommendations")
    val dynamicRecommendations: Boolean = false
)

/**
 * The persona/character that was matched to the user.
 * e.g., "Morning Devotee", "Night Owl", etc.
 */
data class Persona(
    val name: String,
    val emoji: String,
    val description: String,
    val scenario: String
)

/**
 * A recommendation/suggestion shown as a swipeable card.
 */
data class Suggestion(
    val title: String,
    val description: String,
    val action: String,
    val icon: String,
    val priority: Int = 1,
    
    @SerializedName("specificContent")
    val specificContent: SpecificContent? = null
)

/**
 * Deep link information for a suggestion.
 * Allows tapping to open content in native apps.
 */
data class SpecificContent(
    val name: String,
    val type: String,  // 'video' | 'song' | 'recipe' | 'podcast' | 'article' | 'app'
    val source: String,  // "YouTube", "Spotify", etc.
    
    @SerializedName("deepLink")
    val deepLink: String? = null,
    
    @SerializedName("fallbackUrl")
    val fallbackUrl: String? = null,
    
    val thumbnail: String? = null
)

/**
 * The user's journey progress (Day 0 → Day 30+).
 */
data class Journey(
    val day: Int,
    val stage: String,  // 'newcomer' | 'explorer' | 'regular' | 'partner'
    val insights: List<String>,
    
    @SerializedName("value_delivered")
    val valueDelivered: String,
    
    @SerializedName("nextMilestone")
    val nextMilestone: String = ""
)

/**
 * What the engine has learned about the user.
 */
data class IntelligenceSummary(
    @SerializedName("journey_day")
    val journeyDay: Int,
    
    val stage: String,
    val insights: List<String>,
    
    @SerializedName("top_categories")
    val topCategories: List<String> = emptyList(),
    
    @SerializedName("top_content_types")
    val topContentTypes: List<String> = emptyList(),
    
    @SerializedName("engagement_score")
    val engagementScore: Float = 0.5f,
    
    @SerializedName("personalization_level")
    val personalizationLevel: String = "low"
)

// ═══════════════════════════════════════════════════════════════
// FEEDBACK MODELS - For like/dislike tracking
// ═══════════════════════════════════════════════════════════════

data class FeedbackRequest(
    @SerializedName("fingerprintId")
    val fingerprintId: String? = null,
    
    @SerializedName("suggestionAction")
    val suggestionAction: String,
    
    val scenario: String,
    val feedback: String,  // 'like' | 'dislike'
    val category: String? = null,
    
    @SerializedName("contentType")
    val contentType: String? = null,
    
    val source: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)

data class FeedbackResponse(
    val success: Boolean,
    val message: String,
    
    @SerializedName("totalLikes")
    val totalLikes: Int = 0,
    
    @SerializedName("totalDislikes")
    val totalDislikes: Int = 0,
    
    @SerializedName("learningApplied")
    val learningApplied: Boolean = false
)

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS - For context signals
// ═══════════════════════════════════════════════════════════════

private fun getCurrentTimeOfDay(): String {
    val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
    return when (hour) {
        in 5..11 -> "morning"
        in 12..16 -> "afternoon"
        in 17..20 -> "evening"
        else -> "night"
    }
}

private fun isCurrentlyMorning(): Boolean {
    val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
    return hour in 5..11
}

private fun isCurrentlyAfternoon(): Boolean {
    val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
    return hour in 12..16
}

private fun isCurrentlyEvening(): Boolean {
    val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
    return hour in 17..20
}

private fun isCurrentlyNight(): Boolean {
    val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
    return hour < 5 || hour > 20
}

private fun isCurrentlyWeekend(): Boolean {
    val dayOfWeek = java.util.Calendar.getInstance().get(java.util.Calendar.DAY_OF_WEEK)
    return dayOfWeek == java.util.Calendar.SATURDAY || dayOfWeek == java.util.Calendar.SUNDAY
}

