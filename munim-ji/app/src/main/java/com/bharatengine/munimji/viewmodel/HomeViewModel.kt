package com.bharatengine.munimji.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bharatengine.munimji.data.Greeting
import com.bharatengine.munimji.data.Recommendation
import com.bharatengine.munimji.network.SignalPayload
import com.bharatengine.munimji.repository.RecommendationRepository
import com.bharatengine.munimji.util.SignalCollector
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * ViewModel for the Home Screen
 * 
 * 🎓 Learning Tip: A ViewModel is like a "data butler" for your UI.
 * It:
 * - Survives configuration changes (screen rotation)
 * - Holds UI state
 * - Triggers data loading
 * - Handles user actions
 * 
 * The UI observes the ViewModel's state and reacts to changes.
 * This is the "MVVM" pattern (Model-View-ViewModel)!
 * 
 * StateFlow is like a "live variable" - when it changes,
 * all observers get notified automatically. 🔄
 * 
 * 🔄 INFINITE SWIPING: This ViewModel now supports continuous card loading!
 * When cards run low, it automatically fetches more from the backend.
 */
class HomeViewModel : ViewModel() {
    
    private val repository = RecommendationRepository()
    
    // ═══════════════════════════════════════════════════════════════
    // UI STATE
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Represents all possible states of the home screen.
     * 
     * Using a sealed class makes state handling exhaustive -
     * the compiler ensures you handle ALL cases!
     */
    sealed class HomeUiState {
        data object Loading : HomeUiState()
        data class Success(val data: HomeScreenData) : HomeUiState()
        data class Error(val message: String) : HomeUiState()
    }
    
    /**
     * All the data needed to render the home screen.
     */
    data class HomeScreenData(
        val greeting: Greeting,
        val recommendations: List<Recommendation>,
        val matchedScenario: String,
        val confidence: Float,
        val reasoning: List<String>,
        val isOnline: Boolean = true
    )
    
    // Private mutable state - only the ViewModel can change this
    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    
    // Public immutable state - the UI observes this
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()
    
    // Track current recommendations (for swiping)
    private val _currentRecommendations = MutableStateFlow<List<Recommendation>>(emptyList())
    val currentRecommendations: StateFlow<List<Recommendation>> = _currentRecommendations.asStateFlow()
    
    // Track likes/dislikes
    private val _likedIds = MutableStateFlow<Set<String>>(emptySet())
    val likedIds: StateFlow<Set<String>> = _likedIds.asStateFlow()
    
    private val _dislikedIds = MutableStateFlow<Set<String>>(emptySet())
    val dislikedIds: StateFlow<Set<String>> = _dislikedIds.asStateFlow()
    
    // Track matched scenario for feedback
    private var currentScenario: String = ""
    
    // ═══════════════════════════════════════════════════════════════
    // INFINITE SWIPING STATE
    // ═══════════════════════════════════════════════════════════════
    
    // Track all seen recommendation IDs to avoid duplicates
    private val seenRecommendationIds = mutableSetOf<String>()
    
    // Track if we're currently fetching more cards (to prevent double-fetch)
    private val _isFetchingMore = MutableStateFlow(false)
    val isFetchingMore: StateFlow<Boolean> = _isFetchingMore.asStateFlow()
    
    // Total cards swiped (for display purposes)
    private val _totalCardsSwiped = MutableStateFlow(0)
    val totalCardsSwiped: StateFlow<Int> = _totalCardsSwiped.asStateFlow()
    
    // ═══════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════
    
    // Track if signals have been initialized
    private var signalsInitialized = false
    
    init {
        // Don't load immediately - wait for signals to be set
        // The UI will call initializeWithContext() which then loads recommendations
    }
    
    /**
     * Initialize the ViewModel with Android context to collect signals.
     * 
     * 🎓 Learning Tip: ViewModels shouldn't hold Context references directly
     * because they outlive Activities (memory leak risk!). Instead, we:
     * 1. Accept Context briefly to collect signals
     * 2. Store only the data (SignalPayload), not the Context
     * 3. Pass signals to the Repository
     * 
     * Call this from your Activity/Fragment's onCreate or LaunchedEffect!
     * 
     * @param context Android context for signal collection
     */
    fun initializeWithContext(context: Context) {
        if (signalsInitialized) return // Only initialize once
        
        // Collect all signals from the device
        val signals = SignalCollector.collectAllSignals(context)
        
        // Pass signals to repository
        repository.setSignals(signals)
        
        signalsInitialized = true
        println("📡 Signals initialized! Loading recommendations...")
        
        // Now load recommendations with full signal context
        loadRecommendations()
    }
    
    /**
     * Update signals (e.g., when app comes to foreground).
     * 
     * @param context Android context for signal collection
     */
    fun updateSignals(context: Context) {
        val signals = SignalCollector.collectAllSignals(context)
        repository.setSignals(signals)
        println("🔄 Signals updated!")
    }
    
    // ═══════════════════════════════════════════════════════════════
    // PUBLIC ACTIONS
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Load personalized recommendations from the backend.
     * Called on init and when user pulls to refresh.
     * 
     * 🔄 This now clears the seen tracking for a fresh start!
     */
    fun loadRecommendations() {
        viewModelScope.launch {
            _uiState.value = HomeUiState.Loading
            
            // Clear seen recommendations for fresh start
            seenRecommendationIds.clear()
            _totalCardsSwiped.value = 0
            
            when (val result = repository.getRecommendations()) {
                is RecommendationRepository.Result.Success -> {
                    val data = result.data
                    currentScenario = data.matchedScenario
                    
                    _currentRecommendations.value = data.recommendations
                    
                    _uiState.value = HomeUiState.Success(
                        HomeScreenData(
                            greeting = data.greeting,
                            recommendations = data.recommendations,
                            matchedScenario = data.matchedScenario,
                            confidence = data.confidence,
                            reasoning = data.reasoning,
                            isOnline = true
                        )
                    )
                }
                
                is RecommendationRepository.Result.Error -> {
                    // Try offline fallback
                    val offlineData = repository.getOfflineData()
                    currentScenario = offlineData.matchedScenario
                    
                    _currentRecommendations.value = offlineData.recommendations
                    
                    _uiState.value = HomeUiState.Success(
                        HomeScreenData(
                            greeting = offlineData.greeting,
                            recommendations = offlineData.recommendations,
                            matchedScenario = offlineData.matchedScenario,
                            confidence = offlineData.confidence,
                            reasoning = offlineData.reasoning + listOf("⚠️ ${result.message}"),
                            isOnline = false
                        )
                    )
                }
                
                is RecommendationRepository.Result.Loading -> {
                    // Already handled above
                }
            }
        }
    }
    
    /**
     * Handle swipe right (like) on a recommendation.
     * 
     * 🔄 Now triggers fetching more cards when running low!
     */
    fun onSwipeRight(recommendation: Recommendation) {
        // Add to liked set and track as seen
        _likedIds.value = _likedIds.value + recommendation.id
        seenRecommendationIds.add(recommendation.id)
        _totalCardsSwiped.value = _totalCardsSwiped.value + 1
        
        // Remove from current list
        _currentRecommendations.value = _currentRecommendations.value.filter { 
            it.id != recommendation.id 
        }
        
        // Send feedback to backend (fire and forget)
        viewModelScope.launch {
            repository.sendFeedback(
                suggestionAction = recommendation.title,
                scenario = currentScenario,
                isLike = true,
                category = recommendation.category,
                source = recommendation.source
            )
        }
        
        println("👍 Liked: ${recommendation.title}")
        
        // Check if we need more cards (fetch when 1 or fewer remaining)
        checkAndFetchMoreCards()
    }
    
    /**
     * Handle swipe left (dislike) on a recommendation.
     * 
     * 🔄 Now triggers fetching more cards when running low!
     */
    fun onSwipeLeft(recommendation: Recommendation) {
        // Add to disliked set and track as seen
        _dislikedIds.value = _dislikedIds.value + recommendation.id
        seenRecommendationIds.add(recommendation.id)
        _totalCardsSwiped.value = _totalCardsSwiped.value + 1
        
        // Remove from current list
        _currentRecommendations.value = _currentRecommendations.value.filter { 
            it.id != recommendation.id 
        }
        
        // Send feedback to backend (fire and forget)
        viewModelScope.launch {
            repository.sendFeedback(
                suggestionAction = recommendation.title,
                scenario = currentScenario,
                isLike = false,
                category = recommendation.category,
                source = recommendation.source
            )
        }
        
        println("👎 Disliked: ${recommendation.title}")
        
        // Check if we need more cards (fetch when 1 or fewer remaining)
        checkAndFetchMoreCards()
    }
    
    /**
     * Check if we're running low on cards and fetch more if needed.
     * 
     * 🎓 Learning Tip: This is the "infinite scroll" pattern!
     * Instead of waiting for the list to be empty, we proactively
     * fetch more content when running low. This creates a seamless
     * experience - the user never sees a loading state!
     */
    private fun checkAndFetchMoreCards() {
        val remainingCards = _currentRecommendations.value.size
        
        // Fetch more when 1 or fewer cards remain
        if (remainingCards <= 1 && !_isFetchingMore.value) {
            println("📦 Running low on cards ($remainingCards left), fetching more...")
            fetchMoreRecommendations()
        }
    }
    
    /**
     * Fetch additional recommendations and append to the list.
     * 
     * This is different from loadRecommendations() because it:
     * - Doesn't show a loading state (background fetch)
     * - Appends to existing cards instead of replacing
     * - Filters out already-seen recommendations
     */
    private fun fetchMoreRecommendations() {
        if (_isFetchingMore.value) return // Prevent double-fetch
        
        viewModelScope.launch {
            _isFetchingMore.value = true
            
            when (val result = repository.getRecommendations()) {
                is RecommendationRepository.Result.Success -> {
                    val newRecommendations = result.data.recommendations
                        // Filter out recommendations we've already seen
                        .filter { it.id !in seenRecommendationIds }
                        // Also filter out any that are currently in the list
                        .filter { newRec -> 
                            _currentRecommendations.value.none { it.id == newRec.id }
                        }
                    
                    if (newRecommendations.isNotEmpty()) {
                        // Append new cards to the existing list
                        _currentRecommendations.value = _currentRecommendations.value + newRecommendations
                        println("✅ Added ${newRecommendations.size} new cards!")
                    } else {
                        // All recommendations were duplicates, the backend will
                        // return different ones next time due to LLM variation
                        println("🔄 No new unique cards, will try again on next swipe")
                    }
                    
                    // Update scenario if changed
                    currentScenario = result.data.matchedScenario
                }
                
                is RecommendationRepository.Result.Error -> {
                    // Silently fail for background fetch - don't disrupt the user
                    println("⚠️ Background fetch failed: ${result.message}")
                }
                
                is RecommendationRepository.Result.Loading -> {
                    // Already handled
                }
            }
            
            _isFetchingMore.value = false
        }
    }
    
    /**
     * Handle tap on a recommendation (open deep link).
     */
    fun onRecommendationTap(recommendation: Recommendation) {
        println("📱 Tapped: ${recommendation.title}")
        // The actual deep link handling is done in the UI layer
        // because it requires Android Context
    }
    
    /**
     * Refresh data (for pull-to-refresh).
     */
    fun refresh() {
        loadRecommendations()
    }
    
    /**
     * Reset the recommendations list (start over).
     * 
     * 🔄 Now also clears the seen tracking for a fresh experience!
     */
    fun resetRecommendations() {
        val state = _uiState.value
        if (state is HomeUiState.Success) {
            _currentRecommendations.value = state.data.recommendations
            _likedIds.value = emptySet()
            _dislikedIds.value = emptySet()
            seenRecommendationIds.clear()
            _totalCardsSwiped.value = 0
        }
    }
}

