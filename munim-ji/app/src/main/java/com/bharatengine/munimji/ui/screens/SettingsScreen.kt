package com.bharatengine.munimji.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.bharatengine.munimji.ui.components.SettingsItem
import com.bharatengine.munimji.ui.components.SettingsSectionHeader
import com.bharatengine.munimji.ui.theme.*

/**
 * SettingsScreen - Customize Your Pulse
 * 
 * An extensible settings screen where users can:
 * - Toggle dark/light theme
 * - Set their preferences (interests, language, timing)
 * - Give feedback to the recommendation engine
 * - Learn about how Munim Ji works
 * 
 * 🎓 Learning Tip: This screen is designed to be easily extensible.
 * Each section and item is modular, so you can add more settings later.
 * The onClick handlers currently show toasts, but will connect to SDK later.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onNavigateBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val themeState = LocalThemeState.current
    
    // Helper to show placeholder toast
    fun showPlaceholder(feature: String) {
        Toast.makeText(context, "$feature - Coming soon!", Toast.LENGTH_SHORT).show()
    }
    
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // ═══════════════════════════════════════════════════════════════
        // TOP BAR
        // ═══════════════════════════════════════════════════════════════
        TopAppBar(
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(text = "⚙️", style = MaterialTheme.typography.titleLarge)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "Customize Your Pulse")
                }
            },
            navigationIcon = {
                IconButton(onClick = onNavigateBack) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Go back"
                    )
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = MaterialTheme.colorScheme.background,
                titleContentColor = MaterialTheme.colorScheme.onBackground
            )
        )
        
        HorizontalDivider(color = MaterialTheme.colorScheme.outline)
        
        // ═══════════════════════════════════════════════════════════════
        // SETTINGS LIST
        // ═══════════════════════════════════════════════════════════════
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
        ) {
            // ───────────────────────────────────────────────────────────
            // APPEARANCE SECTION
            // ───────────────────────────────────────────────────────────
            SettingsSectionHeader(title = "Appearance")
            
            // Theme Toggle Row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { themeState.toggle() }
                    .padding(horizontal = 20.dp, vertical = 16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (themeState.isDarkMode) "🌙" else "☀️",
                    style = MaterialTheme.typography.titleLarge
                )
                Spacer(modifier = Modifier.width(16.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Dark Mode",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Text(
                        text = if (themeState.isDarkMode) "ChatGPT Pulse style" else "Light & clean",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Switch(
                    checked = themeState.isDarkMode,
                    onCheckedChange = { themeState.toggle() },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = MaterialTheme.colorScheme.primary,
                        checkedTrackColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.5f)
                    )
                )
            }
            
            HorizontalDivider(
                modifier = Modifier.padding(start = 56.dp),
                color = MaterialTheme.colorScheme.outline
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // ───────────────────────────────────────────────────────────
            // YOUR PREFERENCES SECTION
            // ───────────────────────────────────────────────────────────
            SettingsSectionHeader(title = "Your Preferences")
            
            SettingsItem(
                emoji = "📝",
                title = "Interests & Topics",
                onClick = { showPlaceholder("Interests & Topics") }
            )
            
            SettingsItem(
                emoji = "🌐",
                title = "Language",
                onClick = { showPlaceholder("Language") }
            )
            
            SettingsItem(
                emoji = "🕐",
                title = "Best Time for Updates",
                onClick = { showPlaceholder("Update Timing") }
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // ───────────────────────────────────────────────────────────
            // FEEDBACK SECTION
            // ───────────────────────────────────────────────────────────
            SettingsSectionHeader(title = "Feedback")
            
            SettingsItem(
                emoji = "💬",
                title = "Rate Recommendations",
                onClick = { showPlaceholder("Rate Recommendations") }
            )
            
            SettingsItem(
                emoji = "📊",
                title = "What We've Learned",
                onClick = { showPlaceholder("Your Profile Insights") }
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // ───────────────────────────────────────────────────────────
            // ABOUT SECTION
            // ───────────────────────────────────────────────────────────
            SettingsSectionHeader(title = "About")
            
            SettingsItem(
                emoji = "ℹ️",
                title = "How Munim Ji Works",
                onClick = { showPlaceholder("About Munim Ji") }
            )
            
            SettingsItem(
                emoji = "🔒",
                title = "Privacy",
                onClick = { showPlaceholder("Privacy Settings") }
            )
            
            SettingsItem(
                emoji = "📱",
                title = "App Version",
                onClick = { 
                    Toast.makeText(context, "Munim Ji v1.0.0", Toast.LENGTH_SHORT).show()
                },
                showDivider = false
            )
            
            // ───────────────────────────────────────────────────────────
            // EXTENSIBILITY PLACEHOLDER
            // Add more settings sections here as needed!
            // ───────────────────────────────────────────────────────────
            
            Spacer(modifier = Modifier.height(32.dp))
            
            // Footer
            Text(
                text = "🇮🇳 Made with ❤️ for Bharat",
                style = MaterialTheme.typography.labelMedium,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

