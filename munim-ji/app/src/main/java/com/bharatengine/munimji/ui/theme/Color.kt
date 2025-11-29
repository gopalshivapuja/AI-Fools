package com.bharatengine.munimji.ui.theme

import androidx.compose.ui.graphics.Color

/**
 * Munim Ji Color Palette
 * 
 * Inspired by ChatGPT Pulse's DARK aesthetic with a warm Bharat touch.
 * Following the dark theme with saffron accent for cultural relevance.
 * 
 * ChatGPT Pulse uses: Dark backgrounds, white text, colorful accents
 */

// ═══════════════════════════════════════════════════════════════
// DARK THEME PALETTE (ChatGPT Pulse Style)
// ═══════════════════════════════════════════════════════════════

// Background hierarchy - Dark like ChatGPT Pulse
val PulseBackground = Color(0xFF0D0D0D)      // Deepest black background
val PulseSurface = Color(0xFF1A1A1A)         // Card/surface background
val PulseSurfaceVariant = Color(0xFF2D2D2D)  // Elevated surface

// Accent colors
val PulseSaffron = Color(0xFFFF9933)         // Bharat's signature color 🇮🇳
val PulseSaffronLight = Color(0xFFFFB366)    // Lighter saffron for hover

// Text hierarchy - Light text on dark
val PulseTextPrimary = Color(0xFFFFFFFF)     // Primary text - white
val PulseTextSecondary = Color(0xFFE5E5E5)   // Secondary text - light gray
val PulseMuted = Color(0xFF8E8E93)           // Muted text - iOS gray

// UI elements
val PulseDivider = Color(0xFF3D3D3D)         // Subtle dark dividers
val PulseCardBg = Color(0xFF1A1A1A)          // Card background (dark)
val PulseCardBorder = Color(0xFF3D3D3D)      // Card border

// Legacy compatibility (for components using old names)
val PulseWhite = Color(0xFFFFFFFF)
val PulseOffWhite = Color(0xFF2D2D2D)        // Now dark surface variant
val PulseText = PulseTextPrimary             // Alias

// Swipe feedback colors (bright on dark)
val SwipeLike = Color(0xFF34C759)            // Green for like
val SwipeLikeLight = Color(0xFF1A3D26)       // Dark green glow
val SwipeDislike = Color(0xFFFF3B30)         // Red for dislike  
val SwipeDislikeLight = Color(0xFF3D1A18)    // Dark red glow

// Source chip colors - Vibrant on dark
val ChipYouTube = Color(0xFFFF0000)
val ChipSpotify = Color(0xFF1DB954)
val ChipPrimeVideo = Color(0xFF00A8E1)
val ChipJioSaavn = Color(0xFF2BC5B4)
val ChipDefault = Color(0xFF8E8E93)

// Tab colors (ChatGPT Pulse style)
val TabActive = Color(0xFF3D3D3D)            // Active tab background
val TabInactive = Color.Transparent          // Inactive tab

