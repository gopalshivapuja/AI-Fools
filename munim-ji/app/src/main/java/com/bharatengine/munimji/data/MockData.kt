package com.bharatengine.munimji.data

import java.util.Calendar

/**
 * Mock Data for Munim Ji
 * 
 * This file contains placeholder data for UI development.
 * In the future, this will be replaced with actual SDK API calls.
 * 
 * 🎓 Learning Tip: Data classes in Kotlin automatically generate
 * equals(), hashCode(), toString(), and copy() methods. Super handy!
 */

// ═══════════════════════════════════════════════════════════════
// DATA MODELS
// ═══════════════════════════════════════════════════════════════

/**
 * Represents the personalized greeting shown at the top
 */
data class Greeting(
    val message: String,           // "Shubh Prabhat!"
    val personaName: String,       // "Morning Devotee"
    val personaEmoji: String,      // "🙏"
    val personaDescription: String // "You're vibing as a Morning Devotee today"
)

/**
 * Represents a recommendation card that can be swiped
 */
data class Recommendation(
    val id: String,
    val title: String,             // "Kashi Vishwanath Aarti"
    val description: String,       // "Live morning aarti from Varanasi"
    val icon: String,              // "🕉️"
    val imageUrl: String,          // "https://images.unsplash.com/..."
    val source: String,            // "YouTube", "Spotify", etc.
    val deepLink: String,          // "vnd.youtube://watch?v=..."
    val fallbackUrl: String,       // "https://youtube.com/watch?v=..."
    val category: String = "general" // For future learning
)

/**
 * Time of day context for dynamic headers
 */
enum class TimeOfDay(
    val emoji: String,
    val headerText: String,
    val hindiGreeting: String
) {
    MORNING("☀️", "Your Morning Pulse", "Shubh Prabhat!"),
    AFTERNOON("🌤️", "Your Afternoon Pulse", "Namaste!"),
    EVENING("🌆", "Your Evening Pulse", "Shubh Sandhya!"),
    NIGHT("🌙", "Your Night Pulse", "Shubh Ratri!")
}

// ═══════════════════════════════════════════════════════════════
// MOCK DATA PROVIDER
// ═══════════════════════════════════════════════════════════════

object MockDataProvider {
    
    /**
     * Get the current time of day
     */
    fun getCurrentTimeOfDay(): TimeOfDay {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        return when (hour) {
            in 5..11 -> TimeOfDay.MORNING
            in 12..16 -> TimeOfDay.AFTERNOON
            in 17..20 -> TimeOfDay.EVENING
            else -> TimeOfDay.NIGHT
        }
    }
    
    /**
     * Get a mock greeting based on time of day
     */
    fun getGreeting(): Greeting {
        val timeOfDay = getCurrentTimeOfDay()
        
        // Different personas for different times
        return when (timeOfDay) {
            TimeOfDay.MORNING -> Greeting(
                message = "🙏 ${timeOfDay.hindiGreeting}",
                personaName = "Morning Devotee",
                personaEmoji = "🙏",
                personaDescription = "You're vibing as a Morning Devotee today"
            )
            TimeOfDay.AFTERNOON -> Greeting(
                message = "🌞 ${timeOfDay.hindiGreeting}",
                personaName = "Busy Professional",
                personaEmoji = "⏰",
                personaDescription = "Productivity mode activated!"
            )
            TimeOfDay.EVENING -> Greeting(
                message = "🌆 ${timeOfDay.hindiGreeting}",
                personaName = "Evening Merchant",
                personaEmoji = "🏪",
                personaDescription = "Time to wind down and relax"
            )
            TimeOfDay.NIGHT -> Greeting(
                message = "🌙 ${timeOfDay.hindiGreeting}",
                personaName = "Night Owl",
                personaEmoji = "🦉",
                personaDescription = "Burning the midnight oil?"
            )
        }
    }
    
    /**
     * Get mock recommendations based on time of day
     */
    fun getRecommendations(): List<Recommendation> {
        val timeOfDay = getCurrentTimeOfDay()
        
        return when (timeOfDay) {
            TimeOfDay.MORNING -> listOf(
                Recommendation(
                    id = "rec_1",
                    title = "🕉️ Kashi Vishwanath Aarti",
                    description = "Live morning aarti from Varanasi",
                    icon = "🕉️",
                    imageUrl = "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=1000&auto=format&fit=crop",
                    source = "YouTube",
                    deepLink = "vnd.youtube://watch?v=BRjP0LYFf1o",
                    fallbackUrl = "https://www.youtube.com/watch?v=BRjP0LYFf1o",
                    category = "spiritual"
                ),
                Recommendation(
                    id = "rec_2",
                    title = "🎵 Hanuman Chalisa",
                    description = "By Hariharan • Peaceful morning vibes",
                    icon = "🎵",
                    imageUrl = "https://images.unsplash.com/photo-1582510003544-4d00b7f5feee?q=80&w=1000&auto=format&fit=crop",
                    source = "Spotify",
                    deepLink = "spotify:track:5ZULALImTm6SY6qLhWCkqe",
                    fallbackUrl = "https://open.spotify.com/track/5ZULALImTm6SY6qLhWCkqe",
                    category = "spiritual"
                ),
                Recommendation(
                    id = "rec_3",
                    title = "📅 Today's Panchang",
                    description = "Auspicious timings for your day",
                    icon = "📅",
                    imageUrl = "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=1000&auto=format&fit=crop",
                    source = "Drik Panchang",
                    deepLink = "",
                    fallbackUrl = "https://www.drikpanchang.com/panchang/day-panchang.html",
                    category = "spiritual"
                )
            )
            
            TimeOfDay.AFTERNOON -> listOf(
                Recommendation(
                    id = "rec_4",
                    title = "⚡ Quick Meditation",
                    description = "5-minute stress relief",
                    icon = "🧘",
                    imageUrl = "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop",
                    source = "Headspace",
                    deepLink = "headspace://",
                    fallbackUrl = "https://www.headspace.com/meditation/5-minute-meditation",
                    category = "wellness"
                ),
                Recommendation(
                    id = "rec_5",
                    title = "📰 Inshorts News",
                    description = "60-word news updates",
                    icon = "📰",
                    imageUrl = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop",
                    source = "Inshorts",
                    deepLink = "inshorts://",
                    fallbackUrl = "https://inshorts.com/",
                    category = "news"
                ),
                Recommendation(
                    id = "rec_6",
                    title = "🎙️ The Ranveer Show",
                    description = "Latest podcast episode",
                    icon = "🎙️",
                    imageUrl = "https://images.unsplash.com/photo-1478737270239-2f02b77ac6b5?q=80&w=1000&auto=format&fit=crop",
                    source = "Spotify",
                    deepLink = "spotify:show:6ZcvVBPQ2ToLXEWVbaWwXr",
                    fallbackUrl = "https://open.spotify.com/show/6ZcvVBPQ2ToLXEWVbaWwXr",
                    category = "podcast"
                )
            )
            
            TimeOfDay.EVENING -> listOf(
                Recommendation(
                    id = "rec_7",
                    title = "📊 Open Khatabook",
                    description = "Review today's transactions",
                    icon = "📊",
                    imageUrl = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1000&auto=format&fit=crop",
                    source = "Khatabook",
                    deepLink = "khatabook://",
                    fallbackUrl = "https://play.google.com/store/apps/details?id=com.vaibhavkalpe.android.khatabook",
                    category = "business"
                ),
                Recommendation(
                    id = "rec_8",
                    title = "🎵 Evening Hindi Classics",
                    description = "Relaxing melodies for wind-down",
                    icon = "🎵",
                    imageUrl = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000&auto=format&fit=crop",
                    source = "JioSaavn",
                    deepLink = "jiosaavn://playlist/evening-hindi-classics",
                    fallbackUrl = "https://www.jiosaavn.com/featured/evening-hindi-classics/xQy7VwNSu3E_",
                    category = "music"
                ),
                Recommendation(
                    id = "rec_9",
                    title = "🍳 Butter Chicken Recipe",
                    description = "Easy dinner by Ranveer Brar",
                    icon = "🍳",
                    imageUrl = "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=1000&auto=format&fit=crop",
                    source = "YouTube",
                    deepLink = "vnd.youtube://watch?v=a03U45jFxOI",
                    fallbackUrl = "https://www.youtube.com/watch?v=a03U45jFxOI",
                    category = "cooking"
                )
            )
            
            TimeOfDay.NIGHT -> listOf(
                Recommendation(
                    id = "rec_10",
                    title = "🎧 Lofi Hip Hop Radio",
                    description = "Beats to relax/study to",
                    icon = "🎧",
                    imageUrl = "https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=1000&auto=format&fit=crop",
                    source = "YouTube",
                    deepLink = "vnd.youtube://watch?v=jfKfPfyJRdk",
                    fallbackUrl = "https://www.youtube.com/watch?v=jfKfPfyJRdk",
                    category = "music"
                ),
                Recommendation(
                    id = "rec_11",
                    title = "📚 Continue Reading",
                    description = "Your Kindle book awaits",
                    icon = "📚",
                    imageUrl = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop",
                    source = "Kindle",
                    deepLink = "kindle://",
                    fallbackUrl = "https://read.amazon.com/",
                    category = "reading"
                ),
                Recommendation(
                    id = "rec_12",
                    title = "🌙 Sleep Stories",
                    description = "Calm meditation for sleep",
                    icon = "🌙",
                    imageUrl = "https://images.unsplash.com/photo-1532099554103-97542d117186?q=80&w=1000&auto=format&fit=crop",
                    source = "Spotify",
                    deepLink = "spotify:show:5wSTKsQ3MfPRqsWglLq8Pc",
                    fallbackUrl = "https://open.spotify.com/show/5wSTKsQ3MfPRqsWglLq8Pc",
                    category = "wellness"
                )
            )
        }
    }
}

