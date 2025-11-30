package com.bharatengine.munimji.network

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * API Client Singleton for Bharat Engine
 * 
 * 🎓 Learning Tip: This is a "singleton" pattern using Kotlin's `object`.
 * There's only ONE instance of this client in the entire app.
 * This is efficient because creating HTTP clients is expensive!
 * 
 * The client is configured with:
 * - Base URL: Where the backend is running (ngrok URL for demo)
 * - Gson: Converts JSON ↔ Kotlin objects
 * - Logging: Shows network requests in Logcat (debug mode)
 * - Timeouts: Prevents hanging if the server is slow
 */
object ApiClient {
    
    // ═══════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * The backend base URL.
     * 
     * 🔧 For Demo Setup:
     * 
     * Option 1 - Localtunnel (recommended):
     *   1. Run: npx localtunnel --port 8000 --subdomain bharat-engine-hackathon
     *   2. Use the URL below
     * 
     * Option 2 - Same WiFi (if tunnel fails):
     *   1. Find your laptop's IP: ifconfig | grep "inet "
     *   2. Replace with: "http://YOUR_LAPTOP_IP:8000/"
     *   3. Phone and laptop must be on same WiFi
     * 
     * Option 3 - Emulator only:
     *   - Use: "http://10.0.2.2:8000/"
     */
    private const val BASE_URL = "https://bharat-engine-hackathon.loca.lt/"
    
    // Alternative URLs:
    // private const val BASE_URL = "http://10.0.2.2:8000/"  // For Android Emulator
    // private const val BASE_URL = "http://192.168.1.XXX:8000/"  // For same WiFi
    
    // ═══════════════════════════════════════════════════════════════
    // HTTP CLIENT SETUP
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Logging interceptor - Shows all HTTP traffic in Logcat.
     * 
     * Filter by "okhttp" tag to see:
     * - Request URL, headers, body
     * - Response status, headers, body
     * 
     * Super helpful for debugging! 🔍
     */
    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }
    
    /**
     * OkHttp client with all our configurations.
     */
    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS)  // Time to establish connection
        .readTimeout(30, TimeUnit.SECONDS)     // Time to read response
        .writeTimeout(30, TimeUnit.SECONDS)    // Time to send request
        .build()
    
    // ═══════════════════════════════════════════════════════════════
    // RETROFIT INSTANCE
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * The Retrofit instance - creates our API implementation.
     * 
     * Uses lazy initialization - only created when first accessed.
     * This is a Kotlin best practice for expensive objects!
     */
    private val retrofit: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
    
    /**
     * The API service - this is what you use to make calls!
     * 
     * Example usage:
     * ```kotlin
     * val response = ApiClient.api.initializeEngine(signals)
     * if (response.isSuccessful) {
     *     val data = response.body()
     *     // Use the data!
     * }
     * ```
     */
    val api: BharatEngineApi by lazy {
        retrofit.create(BharatEngineApi::class.java)
    }
    
    // ═══════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Get the current base URL (useful for debugging).
     */
    fun getBaseUrl(): String = BASE_URL
    
    /**
     * Create a new client with a different base URL.
     * Useful if you need to switch between environments.
     * 
     * @param newBaseUrl The new base URL to use
     * @return A new BharatEngineApi instance
     */
    fun createApiWithUrl(newBaseUrl: String): BharatEngineApi {
        return Retrofit.Builder()
            .baseUrl(newBaseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(BharatEngineApi::class.java)
    }
}

