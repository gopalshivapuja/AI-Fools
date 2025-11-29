package com.bharatengine.munimji.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

/**
 * Munim Ji Typography
 * 
 * Clean sans-serif typography following ChatGPT Pulse's readable,
 * glanceable design philosophy. Uses system fonts for fast loading.
 */

val MunimJiTypography = Typography(
    // Pulse header - "Your Morning Pulse"
    labelLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp,
        color = PulseMuted
    ),
    
    // Date text
    labelMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.sp,
        color = PulseMuted
    ),
    
    // Large greeting - "Shubh Prabhat!"
    displayMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.SemiBold, // Toned down from Bold
        fontSize = 28.sp,                 // Slightly smaller
        lineHeight = 36.sp,
        letterSpacing = (-0.5).sp,
        color = PulseTextPrimary
    ),
    
    // Persona text - "You're vibing as..."
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 15.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.sp,
        color = PulseMuted
    ),
    
    // Card title - "Kashi Vishwanath Aarti"
    titleLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,   // Toned down from SemiBold
        fontSize = 18.sp,                 // More refined
        lineHeight = 26.sp,
        letterSpacing = 0.sp,
        color = PulseTextPrimary
    ),
    
    // Card description
    bodyMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.sp,
        color = PulseTextSecondary
    ),
    
    // Source chip text - "YouTube"
    labelSmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.sp
    ),
    
    // Section headers - "YOUR PREFERENCES"
    titleSmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.SemiBold,
        fontSize = 13.sp,
        lineHeight = 18.sp,
        letterSpacing = 0.5.sp,
        color = PulseMuted
    ),
    
    // Settings item title
    titleMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 17.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.sp,
        color = PulseText
    )
)

