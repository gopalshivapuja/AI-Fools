package com.bharatengine.munimji

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.bharatengine.munimji.navigation.MunimJiNavGraph
import com.bharatengine.munimji.ui.components.ChatInputBar
import com.bharatengine.munimji.ui.theme.MunimJiTheme
import com.bharatengine.munimji.ui.theme.ThemeState
import com.bharatengine.munimji.viewmodel.ChatViewModel

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
 * 
 * 💬 Now with LIVE CHAT with Munim Ji powered by OpenAI!
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
            
            // Chat ViewModel for managing conversation
            val chatViewModel: ChatViewModel = viewModel()
            
            // Observe chat state
            val chatState by chatViewModel.uiState.collectAsState()
            val lastResponse by chatViewModel.lastResponse.collectAsState()
            
            // Apply our Pulse-inspired theme with toggle capability
            MunimJiTheme(themeState = themeState) {
                // Main container with Snackbar support
                val snackbarHostState = remember { SnackbarHostState() }
                
                // Show response in Snackbar
                LaunchedEffect(lastResponse) {
                    lastResponse?.let { response ->
                        snackbarHostState.showSnackbar(
                            message = response.content,
                            duration = SnackbarDuration.Long,
                            withDismissAction = true
                        )
                        chatViewModel.clearLastResponse()
                    }
                }
                
                Scaffold(
                    snackbarHost = { 
                        SnackbarHost(hostState = snackbarHostState) { data ->
                            // Custom styled snackbar for Munim Ji responses
                            MunimJiResponseSnackbar(
                                message = data.visuals.message,
                                onDismiss = { data.dismiss() }
                            )
                        }
                    },
                    containerColor = MaterialTheme.colorScheme.background
                ) { paddingValues ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues)
                    ) {
                        // Navigation graph handles screen switching
                        MunimJiNavGraph()
                        
                        // Loading indicator when sending message
                        if (chatState is ChatViewModel.ChatUiState.Sending) {
                            CircularProgressIndicator(
                                modifier = Modifier
                                    .align(Alignment.Center)
                                    .size(48.dp),
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        
                        // Floating Chat Bar anchored to bottom
                        ChatInputBar(
                            onSendClick = { message ->
                                chatViewModel.sendMessage(message)
                            },
                            onVoiceClick = {
                                Toast.makeText(
                                    this@MainActivity, 
                                    "🎤 Voice input coming soon!", 
                                    Toast.LENGTH_SHORT
                                ).show()
                            },
                            modifier = Modifier
                                .align(Alignment.BottomCenter)
                                .navigationBarsPadding()
                        )
                    }
                }
            }
        }
    }
}

/**
 * Custom Snackbar for Munim Ji responses.
 * 
 * 🎓 Learning Tip: This creates a nicer-looking response card
 * compared to the default Snackbar. It shows the AI response
 * with proper styling that matches our app theme.
 */
@Composable
private fun MunimJiResponseSnackbar(
    message: String,
    onDismiss: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surfaceVariant,
        shadowElevation = 8.dp
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "🙏 Munim Ji says:",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.weight(1f))
                TextButton(onClick = onDismiss) {
                    Text("Dismiss", style = MaterialTheme.typography.labelSmall)
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Response message
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Start
            )
        }
    }
}

