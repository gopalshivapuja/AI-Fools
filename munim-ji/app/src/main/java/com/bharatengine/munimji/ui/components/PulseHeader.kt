package com.bharatengine.munimji.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.bharatengine.munimji.data.TimeOfDay
import java.text.SimpleDateFormat
import java.util.*

/**
 * PulseHeader Component (Refined)
 * 
 * Minimalist header with:
 * - App Name ("Munim Ji")
 * - Time-contextual pulse
 * - Settings icon (top right) - NOW MORE VISIBLE! ⚙️
 * 
 * Following ChatGPT Pulse design: Clean, subtle, functional.
 * 
 * 🔧 Fixed: Settings icon is now more prominent with:
 * - Primary color for better visibility
 * - Subtle background on hover/press
 * - Larger tap target
 */
@Composable
fun PulseHeader(
    timeOfDay: TimeOfDay,
    onSettingsClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val dateFormat = SimpleDateFormat("EEEE, MMM d", Locale.getDefault())
    val todayDate = dateFormat.format(Date())
    
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 16.dp)
    ) {
        // Top Row: App Name + Settings Icon
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Munim Ji",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.primary
            )
            
            // Settings button with improved visibility
            IconButton(
                onClick = onSettingsClick,
                modifier = Modifier
                    .size(44.dp) // Larger tap target
                    .clip(CircleShape)
                    .background(
                        MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                    )
            ) {
                Icon(
                    imageVector = Icons.Filled.Settings,
                    contentDescription = "Settings",
                    tint = MaterialTheme.colorScheme.primary, // Changed to primary for visibility
                    modifier = Modifier.size(24.dp)
                )
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Time-contextual header
        Text(
            text = "${timeOfDay.emoji} ${timeOfDay.headerText}",
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Spacer(modifier = Modifier.height(4.dp))
        
        // Today's date
        Text(
            text = todayDate,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
        )
    }
}
