package com.bharatengine.munimji

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.bharatengine.munimji.navigation.MunimJiNavGraph
import com.bharatengine.munimji.ui.components.ChatInputBar
import com.bharatengine.munimji.ui.theme.MunimJiTheme
import com.bharatengine.munimji.ui.theme.ThemeState

/**
 * MainActivity - Entry Point for Munim Ji
 * 
 * This is where your Android app starts! 🚀
 * 
 * 🎓 Learning Tip: In modern Android development with Jetpack Compose,
 * the Activity is minimal. It just sets up the Compose content and theme.
 * All the actual UI is defined in @Composable functions.
 * 
 * Think of it like this:
 * - MainActivity = The stage
 * - MunimJiTheme = The lighting and ambiance (now with toggle!)
 * - MunimJiNavGraph = The show itself!
 */
class MainActivity : ComponentActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Enable edge-to-edge display (content goes under status bar)
        enableEdgeToEdge()
        
        // Set the Compose content
        setContent {
            // Create theme state - starts in dark mode (ChatGPT Pulse style)
            val themeState = remember { ThemeState(initialDarkMode = true) }
            
            // Apply our Pulse-inspired theme with toggle capability
            MunimJiTheme(themeState = themeState) {
                // Main container
                Box(modifier = Modifier.fillMaxSize()) {
                    // Navigation graph handles screen switching
                    // It's behind the chat bar (z-index 0)
                    MunimJiNavGraph()
                    
                    // Floating Chat Bar anchored to bottom (z-index 1)
                    ChatInputBar(
                        onSendClick = { message ->
                            Toast.makeText(this@MainActivity, "Sent: $message", Toast.LENGTH_SHORT).show()
                        },
                        onVoiceClick = {
                            Toast.makeText(this@MainActivity, "Listening...", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .navigationBarsPadding() // Avoid overlapping gesture bar
                    )
                }
            }
        }
    }
}

