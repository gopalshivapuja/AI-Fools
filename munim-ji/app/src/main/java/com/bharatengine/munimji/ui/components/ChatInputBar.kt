package com.bharatengine.munimji.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.unit.dp
import com.bharatengine.munimji.ui.theme.PulseSaffron

/**
 * ChatInputBar Component
 * 
 * A floating input bar anchored to the bottom of the screen.
 * Mimics ChatGPT Pulse's "Ask ChatGPT" interface.
 * 
 * Features:
 * - Text input with "Ask Munim Ji..." placeholder
 * - Voice input button (mic icon)
 * - Send button (appears when typing)
 * - Translucent background with blur effect
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatInputBar(
    onSendClick: (String) -> Unit,
    onVoiceClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    var textState by remember { mutableStateOf(TextFieldValue("")) }
    
    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Surface(
            shape = RoundedCornerShape(32.dp),
            color = MaterialTheme.colorScheme.surfaceVariant,
            modifier = Modifier.fillMaxWidth(),
            shadowElevation = 4.dp
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                // Input Field
                TextField(
                    value = textState,
                    onValueChange = { textState = it },
                    placeholder = { 
                        Text(
                            "Ask Munim Ji...",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                        ) 
                    },
                    modifier = Modifier
                        .weight(1f)
                        .background(Color.Transparent),
                    colors = TextFieldDefaults.textFieldColors(
                        containerColor = Color.Transparent,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent,
                        cursorColor = PulseSaffron
                    ),
                    singleLine = true
                )
                
                // Action Button (Mic or Send)
                IconButton(
                    onClick = {
                        if (textState.text.isNotEmpty()) {
                            onSendClick(textState.text)
                            textState = TextFieldValue("")
                        } else {
                            onVoiceClick()
                        }
                    },
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(
                            if (textState.text.isNotEmpty()) PulseSaffron 
                            else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.1f)
                        )
                ) {
                    Icon(
                        imageVector = if (textState.text.isNotEmpty()) Icons.Filled.Send else Icons.Filled.Mic,
                        contentDescription = if (textState.text.isNotEmpty()) "Send" else "Voice Input",
                        tint = if (textState.text.isNotEmpty()) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }
}

