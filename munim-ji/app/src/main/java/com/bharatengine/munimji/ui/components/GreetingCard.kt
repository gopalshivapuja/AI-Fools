package com.bharatengine.munimji.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.bharatengine.munimji.data.Greeting

/**
 * GreetingCard Component
 * 
 * Displays the personalized greeting with persona information.
 * Large, warm typography that makes users feel welcomed.
 * 
 * 🎓 Learning Tip: The Modifier parameter with default value = Modifier
 * is a common pattern in Compose. It allows callers to customize the component
 * while providing sensible defaults.
 */
@Composable
fun GreetingCard(
    greeting: Greeting,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 24.dp)
    ) {
        // Large greeting message
        Text(
            text = greeting.message,
            style = MaterialTheme.typography.displayMedium,
            color = MaterialTheme.colorScheme.onBackground
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // Persona context
        Text(
            text = greeting.personaDescription,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

