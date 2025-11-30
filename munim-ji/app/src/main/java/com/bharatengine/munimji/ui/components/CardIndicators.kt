package com.bharatengine.munimji.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.compose.material3.MaterialTheme
import com.bharatengine.munimji.ui.theme.PulseMuted
import com.bharatengine.munimji.ui.theme.PulseSaffron

/**
 * CardIndicators Component
 * 
 * Dot indicators showing which card is currently visible (like paging dots).
 * 
 * 🎓 Learning Tip: This is a common UI pattern for carousels/pagers.
 * The active dot is highlighted with the primary color.
 */
@Composable
fun CardIndicators(
    totalCards: Int,
    currentIndex: Int,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 16.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        repeat(totalCards) { index ->
            val isActive = index == currentIndex
            Box(
                modifier = Modifier
                    .padding(horizontal = 4.dp)
                    .size(if (isActive) 8.dp else 6.dp)
                    .clip(CircleShape)
                    .background(
                        if (isActive) MaterialTheme.colorScheme.primary 
                        else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f)
                    )
            )
        }
    }
}

