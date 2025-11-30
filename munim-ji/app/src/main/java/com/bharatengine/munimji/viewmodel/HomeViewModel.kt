package com.bharatengine.munimji.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bharatengine.munimji.data.Greeting
import com.bharatengine.munimji.data.Recommendation
import com.bharatengine.munimji.repository.RecommendationRepository
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
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════
    
    init {
        // Load data when ViewModel is created
        loadRecommendations()
    }
    
    // ═══════════════════════════════════════════════════════════════
    // PUBLIC ACTIONS
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Load personalized recommendations from the backend.
     * Called on init and when user pulls to refresh.
     */
    fun loadRecommendations() {
        viewModelScope.launch {
            _uiState.value = HomeUiState.Loading
            
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
     */
    fun onSwipeRight(recommendation: Recommendation) {
        // Add to liked set
        _likedIds.value = _likedIds.value + recommendation.id
        
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
    }
    
    /**
     * Handle swipe left (dislike) on a recommendation.
     */
    fun onSwipeLeft(recommendation: Recommendation) {
        // Add to disliked set
        _dislikedIds.value = _dislikedIds.value + recommendation.id
        
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
     */
    fun resetRecommendations() {
        val state = _uiState.value
        if (state is HomeUiState.Success) {
            _currentRecommendations.value = state.data.recommendations
            _likedIds.value = emptySet()
            _dislikedIds.value = emptySet()
        }
    }
}

