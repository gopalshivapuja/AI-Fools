package com.bharatengine.munimji.repository

import com.bharatengine.munimji.data.Greeting
import com.bharatengine.munimji.data.MockDataProvider
import com.bharatengine.munimji.data.Recommendation
import com.bharatengine.munimji.network.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Repository for fetching recommendations from the backend.
 * 
 * 🎓 Learning Tip: The "Repository Pattern" is a design pattern that:
 * 1. Abstracts the data source (API, database, cache)
 * 2. Provides a clean API for the ViewModel
 * 3. Handles errors and data transformation
 * 
 * The ViewModel doesn't know (or care) if data comes from:
 * - Network API
 * - Local database
 * - In-memory cache
 * - Mock data
 * 
 * This makes testing easier and code more maintainable!
 * 
 * 📡 Now supports maximum signal collection!
 * Call setSignals() to provide device/context signals before fetching.
 */
class RecommendationRepository {
    
    private val api = ApiClient.api
    
    // Cached signals from SignalCollector - set this before calling getRecommendations!
    private var cachedSignals: SignalPayload? = null
    
    /**
     * Set the collected signals to be used in API calls.
     * 
     * 🎓 Learning Tip: We cache the signals so the repository doesn't
     * need a Context reference. The ViewModel/UI collects signals 
     * and passes them here before fetching recommendations.
     * 
     * @param signals The SignalPayload from SignalCollector
     */
    fun setSignals(signals: SignalPayload) {
        cachedSignals = signals
        println("📡 Signals cached: ${signals.device.brand} ${signals.device.modelName}, " +
                "Network: ${signals.network.type}, Battery: ${(signals.battery.level * 100).toInt()}%")
    }
    
    /**
     * Result wrapper for API calls.
     * 
     * This is a "sealed class" - like an enum but can hold data!
     * Much better than throwing exceptions everywhere.
     */
    sealed class Result<out T> {
        data class Success<T>(val data: T) : Result<T>()
        data class Error(val message: String, val exception: Throwable? = null) : Result<Nothing>()
        data object Loading : Result<Nothing>()
    }
    
    /**
     * Data class combining all the info we need for the home screen.
     */
    data class HomeData(
        val greeting: Greeting,
        val recommendations: List<Recommendation>,
        val matchedScenario: String,
        val confidence: Float,
        val reasoning: List<String>
    )
    
    /**
     * Fetch personalized recommendations from the backend.
     * 
     * @param journeyDay The user's journey day (0 for new users)
     * @return Result containing HomeData or an error
     * 
     * 🎓 Learning Tip: `withContext(Dispatchers.IO)` moves this work
     * to a background thread. Network calls should NEVER be on the main thread!
     * 
     * 📡 Now uses cached signals if available for maximum personalization!
     */
    suspend fun getRecommendations(journeyDay: Int = 0): Result<HomeData> {
        return withContext(Dispatchers.IO) {
            try {
                // Use cached signals if available, otherwise create minimal payload
                val signals = cachedSignals?.copy(
                    journeyDay = journeyDay,
                    useDynamicRecommendations = true
                ) ?: SignalPayload(
                    journeyDay = journeyDay,
                    useDynamicRecommendations = true
                )
                
                println("📤 Sending signals to backend: ${signals.device.brand} ${signals.device.modelName}")
                
                // Make the API call
                val response = api.initializeEngine(signals)
                
                if (response.isSuccessful) {
                    val engineResponse = response.body()
                    
                    if (engineResponse != null) {
                        // Transform API response to our UI models
                        val homeData = transformToHomeData(engineResponse)
                        Result.Success(homeData)
                    } else {
                        Result.Error("Empty response from server")
                    }
                } else {
                    // HTTP error (4xx, 5xx)
                    Result.Error("Server error: ${response.code()} - ${response.message()}")
                }
                
            } catch (e: java.net.UnknownHostException) {
                // No internet or wrong URL
                Result.Error("Cannot reach server. Check your internet connection.", e)
            } catch (e: java.net.SocketTimeoutException) {
                // Server too slow
                Result.Error("Server is taking too long to respond.", e)
            } catch (e: Exception) {
                // Catch-all for other errors
                Result.Error("Something went wrong: ${e.message}", e)
            }
        }
    }
    
    /**
     * Send feedback (like/dislike) for a recommendation.
     * This helps the engine learn!
     */
    suspend fun sendFeedback(
        suggestionAction: String,
        scenario: String,
        isLike: Boolean,
        category: String? = null,
        contentType: String? = null,
        source: String? = null
    ): Result<FeedbackResponse> {
        return withContext(Dispatchers.IO) {
            try {
                val feedback = FeedbackRequest(
                    suggestionAction = suggestionAction,
                    scenario = scenario,
                    feedback = if (isLike) "like" else "dislike",
                    category = category,
                    contentType = contentType,
                    source = source
                )
                
                val response = api.sendFeedback(feedback)
                
                if (response.isSuccessful && response.body() != null) {
                    Result.Success(response.body()!!)
                } else {
                    Result.Error("Failed to send feedback")
                }
            } catch (e: Exception) {
                // Silently fail for feedback - not critical
                Result.Error("Feedback failed: ${e.message}", e)
            }
        }
    }
    
    /**
     * Check if the backend is reachable.
     * Useful for showing connection status.
     */
    suspend fun checkConnection(): Boolean {
        return withContext(Dispatchers.IO) {
            try {
                val response = api.healthCheck()
                response.isSuccessful
            } catch (e: Exception) {
                false
            }
        }
    }
    
    /**
     * Get fallback data when offline.
     * Falls back to MockDataProvider.
     */
    fun getOfflineData(): HomeData {
        val mockGreeting = MockDataProvider.getGreeting()
        val mockRecommendations = MockDataProvider.getRecommendations()
        
        return HomeData(
            greeting = mockGreeting,
            recommendations = mockRecommendations,
            matchedScenario = "offline_fallback",
            confidence = 0.5f,
            reasoning = listOf("📴 Offline mode - showing cached content")
        )
    }
    
    // ═══════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Transform the API response to our UI-friendly HomeData.
     * 
     * This is where we map backend models → UI models.
     * Keeps the API and UI concerns separated!
     */
    private fun transformToHomeData(response: EngineResponse): HomeData {
        // Transform persona to greeting
        val greeting = Greeting(
            message = response.greeting,
            personaName = response.persona.name,
            personaEmoji = response.persona.emoji,
            personaDescription = response.persona.description
        )
        
        // Transform suggestions to recommendations
        val recommendations = response.suggestions.mapIndexed { index, suggestion ->
            Recommendation(
                id = "rec_${index}_${System.currentTimeMillis()}",
                title = suggestion.title,
                description = suggestion.description,
                icon = suggestion.icon,
                imageUrl = getImageForSuggestion(suggestion),
                source = suggestion.specificContent?.source ?: "Bharat Engine",
                deepLink = suggestion.specificContent?.deepLink ?: "",
                fallbackUrl = suggestion.specificContent?.fallbackUrl ?: "",
                category = getCategoryFromSuggestion(suggestion)
            )
        }
        
        return HomeData(
            greeting = greeting,
            recommendations = recommendations,
            matchedScenario = response.matchedScenario,
            confidence = response.confidence,
            reasoning = response.reasoning
        )
    }
    
    /**
     * Get an appropriate image URL for a suggestion.
     * Falls back to category-based images.
     */
    private fun getImageForSuggestion(suggestion: Suggestion): String {
        // Use thumbnail if available
        suggestion.specificContent?.thumbnail?.let { return it }
        
        // Otherwise, pick based on content type/source
        val type = suggestion.specificContent?.type?.lowercase() ?: ""
        val source = suggestion.specificContent?.source?.lowercase() ?: ""
        
        return when {
            source.contains("youtube") -> "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800"
            source.contains("spotify") -> "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800"
            type == "video" -> "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800"
            type == "song" || type == "music" -> "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800"
            type == "recipe" -> "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800"
            type == "podcast" -> "https://images.unsplash.com/photo-1478737270239-2f02b77ac6b5?w=800"
            type == "article" -> "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800"
            else -> "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800"
        }
    }
    
    /**
     * Extract category from suggestion for feedback.
     */
    private fun getCategoryFromSuggestion(suggestion: Suggestion): String {
        val type = suggestion.specificContent?.type?.lowercase() ?: ""
        val action = suggestion.action.lowercase()
        
        return when {
            action.contains("aarti") || action.contains("chalisa") || action.contains("panchang") -> "spiritual"
            action.contains("music") || action.contains("song") || type == "song" -> "music"
            action.contains("recipe") || type == "recipe" -> "cooking"
            action.contains("podcast") || type == "podcast" -> "podcast"
            action.contains("news") -> "news"
            action.contains("meditation") -> "wellness"
            action.contains("movie") || action.contains("watch") -> "entertainment"
            type == "video" -> "video"
            else -> "general"
        }
    }
}

