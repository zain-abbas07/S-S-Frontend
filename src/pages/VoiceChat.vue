<template>
    <div class="voice-chat">
      <h1>AI Voice Assistant</h1>
      
      <div class="chat-container">
        <div class="messages" ref="messagesContainer">
          <div v-for="(message, index) in messages" :key="index" 
               :class="['message', message.sender]">
            <div class="message-content">
              <strong>{{ message.sender === 'user' ? 'You' : 'AI Assistant' }}:</strong>
              <p>{{ message.text }}</p>
              <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
            </div>
          </div>
        </div>
        
        <div class="input-container">
          <input 
            type="text" 
            v-model="userInput" 
            placeholder="Type a message..." 
            @keyup.enter="sendMessage"
            :disabled="isListening || isSpeaking"
          />
          <button @click="sendMessage" :disabled="isListening || isSpeaking || !userInput">
            Send
          </button>
          <button @click="toggleListening" :class="{ 'active': isListening }" :disabled="isSpeaking">
            {{ isListening ? 'Listening...' : 'Speak' }}
          </button>
        </div>
      </div>
      
      <div class="voice-controls">
        <label>
          <input type="checkbox" v-model="autoSpeak" />
          Auto-speak responses
        </label>
        <button @click="clearChat" class="clear-btn">Clear Chat</button>
      </div>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div class="chat-history" v-if="chatHistory.length > 0">
        <h2>Chat History</h2>
        <div v-for="(item, index) in chatHistory" :key="index" class="history-item">
          <div class="history-content">
            <p><strong>You:</strong> {{ item.message }}</p>
            <p><strong>AI:</strong> {{ item.response }}</p>
            <span class="timestamp">{{ formatTime(new Date(item.timestamp)) }}</span>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: 'VoiceChat',
    data() {
      return {
        userInput: '',
        messages: [],
        chatHistory: [],
        isListening: false,
        isSpeaking: false,
        recognition: null,
        synthesizer: window.speechSynthesis,
        autoSpeak: true,
        error: null,
        loadingHistory: false
      };
    },
    mounted() {
      this.initSpeechRecognition();
      this.fetchChatHistory();
    },
    beforeDestroy() {
      if (this.recognition) {
        this.recognition.stop();
      }
      if (this.synthesizer.speaking) {
        this.synthesizer.cancel();
      }
    },
    methods: {
      initSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
          this.error = "Speech recognition is not supported in this browser.";
          return;
        }
  
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US'; // Set language
  
        this.recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          this.userInput = transcript;
          this.sendMessage();
        };
  
        this.recognition.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          this.isListening = false;
          this.error = `Speech recognition error: ${event.error}`;
        };
  
        this.recognition.onend = () => {
          this.isListening = false;
        };
      },
      toggleListening() {
        if (this.isListening) {
          this.recognition.stop();
          this.isListening = false;
        } else {
          this.userInput = '';
          this.error = null;
          this.recognition.start();
          this.isListening = true;
        }
      },
      async sendMessage() {
        if (!this.userInput.trim()) return;
        
        const userMessage = {
          sender: 'user',
          text: this.userInput,
          timestamp: new Date()
        };
        
        this.messages.push(userMessage);
        const messageText = this.userInput;
        this.userInput = '';
        this.scrollToBottom();
  
        try {
          const userId = localStorage.getItem('userId');
          const token = localStorage.getItem('token');
          
          if (!userId) {
            this.error = "You must be logged in to use the voice assistant";
            return;
          }
  
          const response = await axios.post(
            `/api/users/${userId}/voice-logs`, 
            { message: messageText },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          // Check if this is an error with fallback response
            const isError = response.data.isError;
    
          const aiResponse = {
            sender: 'ai',
            text: response.data.response,
            timestamp: new Date(),
            isError
          };
          
          this.messages.push(aiResponse);
          this.scrollToBottom();
          
          if (this.autoSpeak) {
            this.speakText(aiResponse.text);
          }
          
          // Refresh history after new message
          this.fetchChatHistory();
        } catch (err) {
          console.error('Error sending message:', err);
          // Handle rate limiting specifically
        if (err.response && err.response.status === 429) {
        this.error = "You've reached the message limit. Please try again in a minute.";
        } else {
        this.error = err.response?.data?.error || 'Failed to get AI response';
        }
        
        this.messages.push({
        sender: 'ai',
        text: 'Sorry, I encountered an error. Please try again in a moment.',
        timestamp: new Date(),
        isError: true
          });
        }
      },
      speakText(text) {
        if (!this.synthesizer) {
          this.error = "Speech synthesis is not supported in this browser.";
          return;
        }
        
        if (this.synthesizer.speaking) {
          this.synthesizer.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;  // Speed (0.1 to 10)
        utterance.pitch = 1.0; // Pitch (0 to 2)
        
        utterance.onstart = () => {
          this.isSpeaking = true;
        };
        
        utterance.onend = () => {
          this.isSpeaking = false;
        };
        
        utterance.onerror = (event) => {
          console.error('Speech synthesis error', event);
          this.isSpeaking = false;
        };
        
        this.synthesizer.speak(utterance);
      },
      async fetchChatHistory() {
        this.loadingHistory = true;
        this.error = null;
        
        try {
          const userId = localStorage.getItem('userId');
          const token = localStorage.getItem('token');
          
          if (!userId) return;
          
          const response = await axios.get(
            `/api/users/${userId}/voice-logs`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          this.chatHistory = response.data;
        } catch (err) {
          console.error('Error fetching chat history:', err);
          this.error = 'Failed to load chat history';
        } finally {
          this.loadingHistory = false;
        }
      },
      clearChat() {
        this.messages = [];
      },
      scrollToBottom() {
        setTimeout(() => {
          if (this.$refs.messagesContainer) {
            this.$refs.messagesContainer.scrollTop = this.$refs.messagesContainer.scrollHeight;
          }
        }, 50);
      },
      formatTime(date) {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }
  };
  </script>
  
  <style scoped>
  .voice-chat {
    max-width: 800px;
    margin: 2rem auto;
    padding: 1.5rem;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 450px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 1rem;
  }
  
  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    background: #f8f9fa;
  }
  
  .message {
    margin-bottom: 1rem;
    max-width: 80%;
    padding: 0.75rem;
    border-radius: 1rem;
    position: relative;
  }
  
  .message.user {
    align-self: flex-end;
    background-color: #dcf8c6;
    margin-left: auto;
  }
  
  .message.ai {
    align-self: flex-start;
    background-color: #e9e9eb;
  }
  
  .message-content {
    word-break: break-word;
  }
  
  .message-content p {
    margin: 0.5rem 0;
  }
  
  .timestamp {
    font-size: 0.75rem;
    color: #777;
    margin-top: 0.25rem;
    display: block;
  }
  
  .input-container {
    display: flex;
    padding: 0.75rem;
    background: #fff;
    border-top: 1px solid #e0e0e0;
  }
  
  input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-right: 0.5rem;
  }
  
  button {
    padding: 0.75rem 1.25rem;
    background: #42b983;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-left: 0.5rem;
  }
  
  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  button.active {
    background: #ff5722;
    animation: pulse 1.5s infinite;
  }
  
  .voice-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .error-message {
    color: #e53935;
    margin: 1rem 0;
    padding: 0.75rem;
    background: #ffebee;
    border-radius: 4px;
  }
  
  .chat-history {
    margin-top: 2rem;
    border-top: 1px solid #eee;
    padding-top: 1rem;
  }
  
  .history-item {
    padding: 0.75rem;
    border-bottom: 1px solid #eee;
  }
  
  .history-content p {
    margin: 0.25rem 0;
  }
  
  .clear-btn {
    background: #f44336;
  }
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
  </style>