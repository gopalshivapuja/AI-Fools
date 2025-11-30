package com.bharatengine.munimji.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bharatengine.munimji.network.ApiClient
import com.bharatengine.munimji.network.ChatRequest
import com.bharatengine.munimji.network.ChatResponse
import com.bharatengine.munimji.network.ContextSignals
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * ChatViewModel - Manages conversation with Munim Ji 💬
 * 
 * 🎓 Learning Tip: This ViewModel manages the chat state:
 * - Sends messages to the backend
 * - Tracks conversation history
 * - Handles loading states
 * 
 * Unlike the HomeViewModel which deals with recommendations,
 * this one handles the back-and-forth chat dialogue!
 */
class ChatViewModel : ViewModel() {
    
    private val api = ApiClient.api
    
    // ═══════════════════════════════════════════════════════════════
    // CHAT STATE
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Represents a single message in the conversation.
     */
    data class ChatMessage(
        val id: String = "msg_${System.currentTimeMillis()}",
        val content: String,
        val isFromUser: Boolean,
        val timestamp: Long = System.currentTimeMillis(),
        val suggestions: List<String> = emptyList()
    )
    
    /**
     * UI state for the chat feature.
     */
    sealed class ChatUiState {
        data object Idle : ChatUiState()
        data object Sending : ChatUiState()
        data class Response(val message: ChatMessage) : ChatUiState()
        data class Error(val message: String) : ChatUiState()
    }
    
    // Current UI state
    private val _uiState = MutableStateFlow<ChatUiState>(ChatUiState.Idle)
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()
    
    // Conversation history (for potential future use)
    private val _messages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val messages: StateFlow<List<ChatMessage>> = _messages.asStateFlow()
    
    // Last response from Munim Ji (for displaying in UI)
    private val _lastResponse = MutableStateFlow<ChatMessage?>(null)
    val lastResponse: StateFlow<ChatMessage?> = _lastResponse.asStateFlow()
    
    // Quick suggestions for the user
    private val _suggestions = MutableStateFlow<List<String>>(
        listOf("What can you help me with?", "Show me something fun", "Tell me about yourself")
    )
    val suggestions: StateFlow<List<String>> = _suggestions.asStateFlow()
    
    // ═══════════════════════════════════════════════════════════════
    // PUBLIC ACTIONS
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Send a message to Munim Ji.
     * 
     * @param message The user's message
     * @param fingerprintId Optional user ID for personalization
     */
    fun sendMessage(message: String, fingerprintId: String? = null) {
        if (message.isBlank()) return
        
        viewModelScope.launch {
            // Add user message to history
            val userMessage = ChatMessage(
                content = message,
                isFromUser = true
            )
            _messages.value = _messages.value + userMessage
            
            // Set loading state
            _uiState.value = ChatUiState.Sending
            
            try {
                // Create request with context
                val request = ChatRequest(
                    message = message,
                    fingerprintId = fingerprintId,
                    context = ContextSignals() // Uses current time context
                )
                
                // Make API call
                val response = api.chat(request)
                
                if (response.isSuccessful && response.body() != null) {
                    val chatResponse = response.body()!!
                    
                    // Create response message
                    val responseMessage = ChatMessage(
                        content = chatResponse.response,
                        isFromUser = false,
                        suggestions = chatResponse.suggestions
                    )
                    
                    // Update state
                    _messages.value = _messages.value + responseMessage
                    _lastResponse.value = responseMessage
                    _suggestions.value = chatResponse.suggestions.ifEmpty { 
                        listOf("Tell me more", "Something else", "Thanks!") 
                    }
                    _uiState.value = ChatUiState.Response(responseMessage)
                    
                    println("💬 Munim Ji: ${chatResponse.response}")
                } else {
                    _uiState.value = ChatUiState.Error("Could not get a response. Try again!")
                }
                
            } catch (e: Exception) {
                println("Chat Error: ${e.message}")
                _uiState.value = ChatUiState.Error(
                    "Connection issue. Please check your internet."
                )
            }
        }
    }
    
    /**
     * Send a quick suggestion as a message.
     */
    fun sendSuggestion(suggestion: String, fingerprintId: String? = null) {
        sendMessage(suggestion, fingerprintId)
    }
    
    /**
     * Clear the last response (dismiss dialog/snackbar).
     */
    fun clearLastResponse() {
        _lastResponse.value = null
        _uiState.value = ChatUiState.Idle
    }
    
    /**
     * Clear all conversation history.
     */
    fun clearHistory() {
        _messages.value = emptyList()
        _lastResponse.value = null
        _uiState.value = ChatUiState.Idle
        _suggestions.value = listOf(
            "What can you help me with?", 
            "Show me something fun", 
            "Tell me about yourself"
        )
    }
}

