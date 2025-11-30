package com.bharatengine.munimji.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.runtime.collectAsState
import androidx.lifecycle.viewmodel.compose.viewModel
import com.bharatengine.munimji.data.MockDataProvider
import com.bharatengine.munimji.ui.components.*
import com.bharatengine.munimji.viewmodel.HomeViewModel

/**
 * HomeScreen - The Main Pulse Experience (Now with LIVE Backend!)
 * 
 * This is where users see their personalized greeting and swipeable recommendations.
 * 
 * 🎓 Learning Tip: This screen now uses a ViewModel to manage state!
 * - ViewModel survives configuration changes (rotation)
 * - StateFlow provides reactive updates
 * - Repository handles API calls
 * 
 * The data flow is:
 * Backend API → Repository → ViewModel → UI (this screen)
 * 
 * When you swipe:
 * UI → ViewModel → Repository → Backend (feedback)
 */
@Composable
fun HomeScreen(
    onNavigateToSettings: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: HomeViewModel = viewModel()
) {
    // Observe ViewModel state
    val uiState by viewModel.uiState.collectAsState()
    val currentRecommendations by viewModel.currentRecommendations.collectAsState()
    
    // Get time of day for header (still from local)
    val timeOfDay = MockDataProvider.getCurrentTimeOfDay()
    
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // ═══════════════════════════════════════════════════════════════
        // PULSE HEADER (Always shown)
        // ═══════════════════════════════════════════════════════════════
        PulseHeader(
            timeOfDay = timeOfDay,
            onSettingsClick = onNavigateToSettings
        )
        
        // ═══════════════════════════════════════════════════════════════
        // CONTENT - Based on UI State
        // ═══════════════════════════════════════════════════════════════
        when (val state = uiState) {
            is HomeViewModel.HomeUiState.Loading -> {
                LoadingContent()
            }
            
            is HomeViewModel.HomeUiState.Error -> {
                ErrorContent(
                    message = state.message,
                    onRetry = { viewModel.refresh() }
                )
            }
            
            is HomeViewModel.HomeUiState.Success -> {
                SuccessContent(
                    data = state.data,
                    currentRecommendations = currentRecommendations,
                    totalRecommendations = state.data.recommendations.size,
                    onSwipeLeft = { viewModel.onSwipeLeft(it) },
                    onSwipeRight = { viewModel.onSwipeRight(it) },
                    onRefresh = { viewModel.refresh() },
                    onReset = { viewModel.resetRecommendations() }
                )
            }
        }
    }
}

/**
 * Loading state - Shows while fetching from backend
 */
@Composable
private fun LoadingContent() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        CircularProgressIndicator(
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(48.dp)
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = "🧠 Munim Ji is thinking...",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurface
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = "Personalizing your experience",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

/**
 * Error state - Shows when backend is unreachable
 */
@Composable
private fun ErrorContent(
    message: String,
    onRetry: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.WifiOff,
            contentDescription = "Connection Error",
            tint = MaterialTheme.colorScheme.error,
            modifier = Modifier.size(64.dp)
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = "Oops! Connection Issue",
            style = MaterialTheme.typography.headlineSmall,
            color = MaterialTheme.colorScheme.onSurface
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Button(
            onClick = onRetry,
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary
            )
        ) {
            Icon(
                imageVector = Icons.Default.Refresh,
                contentDescription = null,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text("Try Again")
        }
    }
}

/**
 * Success state - The main content
 */
@Composable
private fun SuccessContent(
    data: HomeViewModel.HomeScreenData,
    currentRecommendations: List<com.bharatengine.munimji.data.Recommendation>,
    totalRecommendations: Int,
    onSwipeLeft: (com.bharatengine.munimji.data.Recommendation) -> Unit,
    onSwipeRight: (com.bharatengine.munimji.data.Recommendation) -> Unit,
    onRefresh: () -> Unit,
    onReset: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
    ) {
        // Offline indicator
        if (!data.isOnline) {
            OfflineBanner()
        }
        
        // ═══════════════════════════════════════════════════════════════
        // GREETING CARD - Personalized welcome from backend!
        // ═══════════════════════════════════════════════════════════════
        GreetingCard(greeting = data.greeting)
        
        // ═══════════════════════════════════════════════════════════════
        // CONFIDENCE & SCENARIO (Debug info - fun to show!)
        // ═══════════════════════════════════════════════════════════════
        if (data.isOnline) {
            MatchInfo(
                scenario = data.matchedScenario,
                confidence = data.confidence
            )
        }
        
        // ═══════════════════════════════════════════════════════════════
        // RECOMMENDATIONS SECTION
        // ═══════════════════════════════════════════════════════════════
        Text(
            text = "For you right now",
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp)
        )
        
        // Show cards or empty state
        AnimatedContent(
            targetState = currentRecommendations.isNotEmpty(),
            transitionSpec = {
                fadeIn() togetherWith fadeOut()
            },
            label = "card_content"
        ) { hasCards ->
            if (hasCards && currentRecommendations.isNotEmpty()) {
                Column {
                    // Current recommendation card
                    val currentRecommendation = currentRecommendations.first()
                    
                    SwipeableCard(
                        recommendation = currentRecommendation,
                        onSwipeLeft = { onSwipeLeft(currentRecommendation) },
                        onSwipeRight = { onSwipeRight(currentRecommendation) }
                    )
                    
                    // Card indicators
                    CardIndicators(
                        totalCards = totalRecommendations,
                        currentIndex = totalRecommendations - currentRecommendations.size
                    )
                }
            } else {
                // All cards swiped - show empty state with reset
                EmptyStateWithReset(
                    onReset = onReset,
                    onRefresh = onRefresh
                )
            }
        }
        
        // ═══════════════════════════════════════════════════════════════
        // REASONING SECTION - Why these recommendations?
        // ═══════════════════════════════════════════════════════════════
        if (data.reasoning.isNotEmpty()) {
            ReasoningSection(reasoning = data.reasoning)
        }
        
        // Bottom padding
        Spacer(modifier = Modifier.height(100.dp))
    }
}

/**
 * Shows when app is in offline mode
 */
@Composable
private fun OfflineBanner() {
    Surface(
        color = MaterialTheme.colorScheme.errorContainer,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.WifiOff,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onErrorContainer,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Offline - Showing cached content",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onErrorContainer
            )
        }
    }
}

/**
 * Shows the matched scenario and confidence
 */
@Composable
private fun MatchInfo(
    scenario: String,
    confidence: Float
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "🎭 ${scenario.replace("_", " ").replaceFirstChar { it.uppercase() }}",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.primary
        )
        
        Text(
            text = "${(confidence * 100).toInt()}% match",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

/**
 * Shows the reasoning behind recommendations
 */
@Composable
private fun ReasoningSection(reasoning: List<String>) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 16.dp)
    ) {
        Text(
            text = "Why these recommendations?",
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Surface(
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
            shape = MaterialTheme.shapes.medium,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                reasoning.take(5).forEach { reason ->
                    Text(
                        text = reason,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(vertical = 2.dp)
                    )
                }
            }
        }
    }
}

/**
 * Empty state with options to reset or refresh
 */
@Composable
private fun EmptyStateWithReset(
    onReset: () -> Unit,
    onRefresh: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        EmptyState()
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Row(
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(onClick = onReset) {
                Text("See Again")
            }
            
            Button(onClick = onRefresh) {
                Icon(
                    imageVector = Icons.Default.Refresh,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Get New")
            }
        }
    }
}
