package com.bharatengine.munimji.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.bharatengine.munimji.data.MockDataProvider
import com.bharatengine.munimji.data.Recommendation
import com.bharatengine.munimji.ui.components.*
import com.bharatengine.munimji.ui.theme.*

/**
 * HomeScreen - The Main Pulse Experience
 * 
 * This is where users see their personalized greeting and swipeable recommendations.
 * Following ChatGPT Pulse's design philosophy:
 * - Time-contextual header
 * - Warm, personalized greeting
 * - Glanceable, swipeable cards
 * - Dark theme by default (like ChatGPT Pulse)
 * 
 * 🎓 Learning Tip: This screen manages state for the recommendation cards.
 * When a card is swiped, we remove it from the list and show the next one.
 */
@Composable
fun HomeScreen(
    onNavigateToSettings: () -> Unit,
    modifier: Modifier = Modifier
) {
    // Get current time context and data
    val timeOfDay = MockDataProvider.getCurrentTimeOfDay()
    val greeting = MockDataProvider.getGreeting()
    
    // Mutable list of recommendations (can be swiped away)
    var recommendations by remember { 
        mutableStateOf(MockDataProvider.getRecommendations()) 
    }
    
    // Track current card index for indicators
    var currentCardIndex by remember { mutableIntStateOf(0) }
    
    // Track liked/disliked for future SDK integration
    var likedRecommendations by remember { mutableStateOf(listOf<String>()) }
    var dislikedRecommendations by remember { mutableStateOf(listOf<String>()) }
    
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
    ) {
        // ═══════════════════════════════════════════════════════════════
        // PULSE HEADER (New Minimal Design)
        // ═══════════════════════════════════════════════════════════════
        PulseHeader(
            timeOfDay = timeOfDay,
            onSettingsClick = onNavigateToSettings
        )
        
        // ═══════════════════════════════════════════════════════════════
        // GREETING CARD - Personalized welcome
        // ═══════════════════════════════════════════════════════════════
        GreetingCard(greeting = greeting)
        
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
            targetState = recommendations.isNotEmpty(),
            transitionSpec = {
                fadeIn() togetherWith fadeOut()
            },
            label = "card_content"
        ) { hasCards ->
            if (hasCards && recommendations.isNotEmpty()) {
                Column {
                    // Current recommendation card
                    val currentRecommendation = recommendations.first()
                    
                    SwipeableCard(
                        recommendation = currentRecommendation,
                        onSwipeLeft = {
                            // Dislike - remove card and track
                            dislikedRecommendations = dislikedRecommendations + currentRecommendation.id
                            recommendations = recommendations.drop(1)
                            
                            // Log for future SDK integration
                            println("👎 Disliked: ${currentRecommendation.title}")
                        },
                        onSwipeRight = {
                            // Like - remove card and track
                            likedRecommendations = likedRecommendations + currentRecommendation.id
                            recommendations = recommendations.drop(1)
                            
                            // Log for future SDK integration
                            println("👍 Liked: ${currentRecommendation.title}")
                        }
                    )
                    
                    // Card indicators
                    CardIndicators(
                        totalCards = MockDataProvider.getRecommendations().size,
                        currentIndex = MockDataProvider.getRecommendations().size - recommendations.size
                    )
                }
            } else {
                // All cards swiped - show empty state
                EmptyState()
            }
        }
        
        // Removed the Settings Link row since it's now in the header!
        
        // Bottom padding for floating chat bar for floating chat bar
        Spacer(modifier = Modifier.height(100.dp))
    }
}

