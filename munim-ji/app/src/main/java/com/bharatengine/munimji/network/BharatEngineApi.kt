package com.bharatengine.munimji.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

/**
 * Retrofit API Interface for Bharat Context-Adaptive Engine
 * 
 * 🎓 Learning Tip: This is a Retrofit "service interface". 
 * Each method represents an API endpoint. Retrofit generates 
 * the implementation at runtime - you just define WHAT you want!
 * 
 * Annotations tell Retrofit:
 * - @GET / @POST / @PUT / @DELETE = HTTP method
 * - @Body = The request body (converted to JSON automatically)
 * - @Path("id") = URL path parameter (e.g., /users/{id})
 * - @Query("name") = Query parameter (e.g., ?name=value)
 * 
 * The return type can be:
 * - Response<T> = Full response with status code, headers, etc.
 * - T = Just the body (throws on error)
 * - Call<T> = For callback-style (older pattern)
 */
interface BharatEngineApi {
    
    /**
     * Initialize the engine and get personalized recommendations.
     * 
     * This is the main endpoint - send device signals, 
     * get back a persona match and suggestions!
     * 
     * @param signals The collected device/context signals
     * @return EngineResponse with greeting, persona, suggestions, etc.
     */
    @POST("v1/init")
    suspend fun initializeEngine(
        @Body signals: SignalPayload
    ): Response<EngineResponse>
    
    /**
     * Send feedback (like/dislike) for a suggestion.
     * This helps the engine learn user preferences!
     * 
     * @param feedback The feedback data
     * @return FeedbackResponse with success status
     */
    @POST("v1/feedback")
    suspend fun sendFeedback(
        @Body feedback: FeedbackRequest
    ): Response<FeedbackResponse>
    
    /**
     * Health check endpoint to verify backend is reachable.
     * Useful for debugging connectivity issues.
     */
    @GET("/")
    suspend fun healthCheck(): Response<Map<String, Any>>
}

