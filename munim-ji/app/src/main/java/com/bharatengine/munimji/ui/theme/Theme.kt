package com.bharatengine.munimji.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

/**
 * Munim Ji Theme
 * 
 * Supports BOTH dark and light themes with toggle capability!
 * Default is dark (ChatGPT Pulse style), but user can switch to light.
 * 
 * 🎓 Learning Tip: We use CompositionLocal to provide theme state
 * throughout the app. This lets any component access and change the theme!
 */

// ═══════════════════════════════════════════════════════════════
// DARK COLOR SCHEME (ChatGPT Pulse Style - Default)
// ═══════════════════════════════════════════════════════════════
private val DarkColorScheme = darkColorScheme(
    primary = PulseSaffron,
    onPrimary = PulseBackground,
    primaryContainer = PulseSaffron.copy(alpha = 0.2f),
    onPrimaryContainer = PulseSaffron,
    
    secondary = PulseMuted,
    onSecondary = PulseBackground,
    secondaryContainer = PulseSurfaceVariant,
    onSecondaryContainer = PulseTextSecondary,
    
    background = PulseBackground,
    onBackground = PulseTextPrimary,
    surface = PulseSurface,
    onSurface = PulseTextPrimary,
    surfaceVariant = PulseSurfaceVariant,
    onSurfaceVariant = PulseTextSecondary,
    
    outline = PulseDivider,
    outlineVariant = PulseCardBorder,
    
    error = SwipeDislike,
    onError = PulseTextPrimary
)

// ═══════════════════════════════════════════════════════════════
// LIGHT COLOR SCHEME (Clean, minimal option)
// ═══════════════════════════════════════════════════════════════
private val LightColorScheme = lightColorScheme(
    primary = PulseSaffron,
    onPrimary = Color.White,
    primaryContainer = PulseSaffron.copy(alpha = 0.1f),
    onPrimaryContainer = PulseSaffron,
    
    secondary = PulseMuted,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFF5F5F5),
    onSecondaryContainer = Color(0xFF1A1A1A),
    
    background = Color.White,
    onBackground = Color(0xFF1A1A1A),
    surface = Color.White,
    onSurface = Color(0xFF1A1A1A),
    surfaceVariant = Color(0xFFFAFAFA),
    onSurfaceVariant = Color(0xFF666666),
    
    outline = Color(0xFFE5E5EA),
    outlineVariant = Color(0xFFE5E5EA),
    
    error = SwipeDislike,
    onError = Color.White
)

// ═══════════════════════════════════════════════════════════════
// THEME STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Theme state holder - allows toggling between dark and light
 */
class ThemeState(initialDarkMode: Boolean = true) {
    var isDarkMode by mutableStateOf(initialDarkMode)
    
    fun toggle() {
        isDarkMode = !isDarkMode
    }
}

/**
 * CompositionLocal to provide theme state throughout the app
 */
val LocalThemeState = staticCompositionLocalOf { ThemeState() }

@Composable
fun MunimJiTheme(
    themeState: ThemeState = remember { ThemeState(true) },
    content: @Composable () -> Unit
) {
    val colorScheme = if (themeState.isDarkMode) DarkColorScheme else LightColorScheme
    
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            if (themeState.isDarkMode) {
                // Dark mode - dark status bar with light icons
                window.statusBarColor = PulseBackground.toArgb()
                WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
                window.navigationBarColor = PulseBackground.toArgb()
                WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = false
            } else {
                // Light mode - light status bar with dark icons
                window.statusBarColor = Color.White.toArgb()
                WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = true
                window.navigationBarColor = Color.White.toArgb()
                WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = true
            }
        }
    }

    CompositionLocalProvider(LocalThemeState provides themeState) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = MunimJiTypography,
            content = content
        )
    }
}

