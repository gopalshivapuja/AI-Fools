package com.bharatengine.munimji.ui.components

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.bharatengine.munimji.data.Recommendation
import com.bharatengine.munimji.ui.theme.*
import kotlinx.coroutines.launch
import kotlin.math.absoluteValue
import kotlin.math.roundToInt

/**
 * SwipeableCard Component
 * 
 * UPGRADED DESIGN:
 * - Full-width immersive image header
 * - Minimalist content area
 * - No explicit thumbs buttons (swipe handles it)
 * - Subtle source chip overlay
 */

// Swipe threshold (how far to swipe before action triggers)
private const val SWIPE_THRESHOLD = 200f

@Composable
fun SwipeableCard(
    recommendation: Recommendation,
    onSwipeLeft: () -> Unit,
    onSwipeRight: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    
    // Offset for drag gesture
    var offsetX by remember { mutableFloatStateOf(0f) }
    
    // Animation for spring-back or fly-off
    val animatedOffset = remember { Animatable(0f) }
    
    // Calculate swipe progress (-1 to 1)
    val swipeProgress = (animatedOffset.value / SWIPE_THRESHOLD).coerceIn(-1f, 1f)
    
    // Rotation based on swipe (subtle tilt)
    val rotation = swipeProgress * 5f
    
    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp)
    ) {
        // Main card
        Card(
            modifier = Modifier
                .offset { IntOffset(animatedOffset.value.roundToInt(), 0) }
                .graphicsLayer {
                    rotationZ = rotation
                }
                .pointerInput(Unit) {
                    detectDragGestures(
                        onDragEnd = {
                            coroutineScope.launch {
                                when {
                                    // Swiped right far enough
                                    animatedOffset.value > SWIPE_THRESHOLD -> {
                                        animatedOffset.animateTo(
                                            targetValue = 1000f,
                                            animationSpec = tween(300)
                                        )
                                        triggerHaptic(context)
                                        onSwipeRight()
                                    }
                                    // Swiped left far enough
                                    animatedOffset.value < -SWIPE_THRESHOLD -> {
                                        animatedOffset.animateTo(
                                            targetValue = -1000f,
                                            animationSpec = tween(300)
                                        )
                                        triggerHaptic(context)
                                        onSwipeLeft()
                                    }
                                    // Snap back to center
                                    else -> {
                                        animatedOffset.animateTo(
                                            targetValue = 0f,
                                            animationSpec = spring(
                                                dampingRatio = Spring.DampingRatioMediumBouncy,
                                                stiffness = Spring.StiffnessLow
                                            )
                                        )
                                    }
                                }
                            }
                        },
                        onDrag = { change, dragAmount ->
                            change.consume()
                            coroutineScope.launch {
                                animatedOffset.snapTo(animatedOffset.value + dragAmount.x)
                            }
                        }
                    )
                }
                .pointerInput(Unit) {
                    detectTapGestures(
                        onTap = {
                            openDeepLink(context, recommendation)
                        }
                    )
                },
            shape = RoundedCornerShape(24.dp), // Increased corner radius
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp) // Flat look
        ) {
            Column {
                // ═══════════════════════════════════════════════════════════════
                // IMMERSIVE IMAGE HEADER
                // ═══════════════════════════════════════════════════════════════
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                ) {
                    // Placeholder until Coil is added properly, using a colored box for preview
                    // In real implementation, use AsyncImage
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(MaterialTheme.colorScheme.surfaceVariant)
                    )
                    
                    // Gradient overlay for text readability if needed
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.verticalGradient(
                                    colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.3f))
                                )
                            )
                    )
                    
                    // Source chip overlay (top left)
                    SourceChip(
                        source = recommendation.source,
                        modifier = Modifier.padding(16.dp)
                    )
                }
                
                // ═══════════════════════════════════════════════════════════════
                // CONTENT AREA
                // ═══════════════════════════════════════════════════════════════
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp)
                ) {
                    // Title with icon
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = recommendation.icon,
                            style = MaterialTheme.typography.titleLarge
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = recommendation.title,
                            style = MaterialTheme.typography.titleLarge,
                            color = MaterialTheme.colorScheme.onSurface,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // Description
                    Text(
                        text = recommendation.description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 3,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
        
        // Swipe overlay indicators (shown only when swiping)
        if (swipeProgress.absoluteValue > 0.1f) {
            val isLike = swipeProgress > 0
            val color = if (isLike) SwipeLike else SwipeDislike
            val icon = if (isLike) "👍" else "👎"
            val alignment = if (isLike) Alignment.CenterStart else Alignment.CenterEnd
            
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .clip(RoundedCornerShape(24.dp))
                    .background(color.copy(alpha = swipeProgress.absoluteValue * 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = icon,
                    style = MaterialTheme.typography.displayMedium,
                    modifier = Modifier.graphicsLayer {
                        scaleX = 1f + swipeProgress.absoluteValue
                        scaleY = 1f + swipeProgress.absoluteValue
                        alpha = swipeProgress.absoluteValue
                    }
                )
            }
        }
    }
}

/**
 * Source chip showing where the content is from
 * Now refined to be a translucent pill on the image
 */
@Composable
private fun SourceChip(
    source: String,
    modifier: Modifier = Modifier
) {
    Surface(
        shape = RoundedCornerShape(50),
        color = Color.Black.copy(alpha = 0.6f),
        modifier = modifier
    ) {
        Text(
            text = source.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = Color.White,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        )
    }
}

/**
 * Trigger haptic feedback
 */
private fun triggerHaptic(context: Context) {
    try {
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(50, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(50)
        }
    } catch (e: Exception) {
        // Ignore vibration errors
    }
}

/**
 * Open deep link or fallback URL
 */
private fun openDeepLink(context: Context, recommendation: Recommendation) {
    try {
        val deepLink = recommendation.deepLink
        val fallbackUrl = recommendation.fallbackUrl
        
        // Try deep link first if available
        if (deepLink.isNotEmpty()) {
            try {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(deepLink))
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                context.startActivity(intent)
                return
            } catch (e: Exception) {
                // Deep link failed, try fallback
            }
        }
        
        // Try fallback URL
        if (fallbackUrl.isNotEmpty()) {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(fallbackUrl))
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            context.startActivity(intent)
        }
    } catch (e: Exception) {
        // Unable to open link
    }
}

