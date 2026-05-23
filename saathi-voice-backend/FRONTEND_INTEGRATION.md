# Frontend Integration Guide 📱

This guide shows how to integrate the Saathi Voice backend with your frontend application (React, React Native, Flutter, etc.)

---

## Quick Start

### 1. API Base URL

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
```

### 2. Create API Service

```javascript
// services/saathiApi.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 30000, // 30 seconds for voice processing
});

export default {
  // User Management
  createUser: (userData) => api.post('/api/users', userData),
  getUser: (userId) => api.get(`/api/users/${userId}`),
  selectRole: (userId, role, languageMix = 'hi-en') => 
    api.post('/api/users/select-role', { userId, role, languageMix }),
  getRoles: () => api.get('/api/roles'),

  // Conversation
  sendVoiceMessage: (userId, audioBlob) => {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('audio', audioBlob, 'audio.webm');
    
    return api.post('/api/conversation/voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob', // Important: Response is audio file
    });
  },
  
  sendTextMessage: (userId, message) => 
    api.post('/api/conversation/text', { userId, message }),
    
  getHistory: (userId, limit = 10) => 
    api.get(`/api/conversation/history/${userId}?limit=${limit}`),
    
  getMemory: (userId) => 
    api.get(`/api/conversation/memory/${userId}`),
};
```

---

## React Web App Example

### Complete Voice Chat Component

```jsx
// components/VoiceChat.jsx
import React, { useState, useRef, useEffect } from 'react';
import saathiApi from '../services/saathiApi';

function VoiceChat({ userId, selectedRole }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [mood, setMood] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(new Audio());

  // Request microphone permission
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorderRef.current = new MediaRecorder(stream);
        
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
        
        mediaRecorderRef.current.onstop = handleRecordingStop;
      })
      .catch(err => {
        console.error('Microphone access denied:', err);
        alert('Please allow microphone access to use voice chat');
      });
  }, []);

  const startRecording = () => {
    audioChunksRef.current = [];
    mediaRecorderRef.current.start();
    setIsRecording(true);
    setTranscript('');
    setAiResponse('');
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const handleRecordingStop = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    
    setIsProcessing(true);
    
    try {
      const response = await saathiApi.sendVoiceMessage(userId, audioBlob);
      
      // Extract metadata from headers
      const transcriptB64 = response.headers['x-transcribed-text'];
      const responseB64 = response.headers['x-ai-response-text'];
      const detectedMood = response.headers['x-mood-detected'];
      const crisisLevel = response.headers['x-crisis-level'];
      
      // Decode base64
      if (transcriptB64) {
        setTranscript(atob(transcriptB64));
      }
      if (responseB64) {
        setAiResponse(atob(responseB64));
      }
      if (detectedMood) {
        setMood(detectedMood);
      }
      
      // Play audio response
      const audioUrl = URL.createObjectURL(response.data);
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      
      // Handle crisis alert
      if (crisisLevel === 'high' || crisisLevel === 'medium') {
        console.warn('Crisis detected:', crisisLevel);
        // Show crisis resources UI
      }
      
    } catch (error) {
      console.error('Voice message failed:', error);
      alert('Failed to process voice message. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="voice-chat">
      <div className="status">
        {isRecording && <p className="recording">🔴 Recording...</p>}
        {isProcessing && <p className="processing">⏳ Processing...</p>}
      </div>
      
      <button 
        className={`record-btn ${isRecording ? 'recording' : ''}`}
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        disabled={isProcessing}
      >
        {isRecording ? '🎙️ Release to Send' : '🎙️ Hold to Talk'}
      </button>
      
      {transcript && (
        <div className="transcript">
          <strong>You said:</strong> {transcript}
        </div>
      )}
      
      {aiResponse && (
        <div className="ai-response">
          <strong>Response:</strong> {aiResponse}
          {mood && <span className="mood-badge">{mood}</span>}
        </div>
      )}
    </div>
  );
}

export default VoiceChat;
```

### Role Selection Component

```jsx
// components/RoleSelector.jsx
import React, { useState, useEffect } from 'react';
import saathiApi from '../services/saathiApi';

function RoleSelector({ userId, onRoleSelected }) {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await saathiApi.getRoles();
      setRoles(response.data.roles);
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = async (role) => {
    try {
      await saathiApi.selectRole(userId, role.id);
      setSelectedRole(role);
      onRoleSelected(role);
    } catch (error) {
      console.error('Failed to select role:', error);
      alert('Failed to select role');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="role-selector">
      <h2>Aaj aap kis se baat karna chahenge?</h2>
      <p className="subtitle">Who would you like to talk to today?</p>
      
      <div className="role-grid">
        {roles.map(role => (
          <button
            key={role.id}
            className={`role-card ${selectedRole?.id === role.id ? 'selected' : ''}`}
            onClick={() => handleSelectRole(role)}
          >
            <div className="role-icon">{getRoleIcon(role.id)}</div>
            <div className="role-name">{getRoleDisplayName(role.id)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Helper functions
function getRoleIcon(roleId) {
  const icons = {
    daughter: '👧',
    son: '👦',
    mother: '👩',
    father: '👨',
    husband: '🤵',
    wife: '👰',
    friend: '🤝',
    grandfather: '👴',
    grandmother: '👵',
  };
  return icons[roleId] || '👤';
}

function getRoleDisplayName(roleId) {
  const names = {
    daughter: 'Beti / Daughter',
    son: 'Beta / Son',
    mother: 'Mummy / Mother',
    father: 'Papa / Father',
    husband: 'Husband',
    wife: 'Wife',
    friend: 'Friend / Dost',
    grandfather: 'Dada/Nana',
    grandmother: 'Dadi/Nani',
  };
  return names[roleId] || roleId;
}

export default RoleSelector;
```

### Main App Component

```jsx
// App.jsx
import React, { useState, useEffect } from 'react';
import RoleSelector from './components/RoleSelector';
import VoiceChat from './components/VoiceChat';
import saathiApi from './services/saathiApi';
import './App.css';

function App() {
  const [userId, setUserId] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const [showRoleSelector, setShowRoleSelector] = useState(true);

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    // Get or create user ID (use localStorage or your auth system)
    let storedUserId = localStorage.getItem('saathi_user_id');
    
    if (!storedUserId) {
      storedUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      try {
        await saathiApi.createUser({
          userId: storedUserId,
          name: 'User', // Get from form or auth
        });
        localStorage.setItem('saathi_user_id', storedUserId);
      } catch (error) {
        console.error('Failed to create user:', error);
      }
    }
    
    setUserId(storedUserId);
  };

  const handleRoleSelected = (role) => {
    setCurrentRole(role);
    setShowRoleSelector(false);
  };

  const handleChangeRole = () => {
    setShowRoleSelector(true);
  };

  if (!userId) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <header>
        <h1>Saathi Voice 🎙️</h1>
        {currentRole && !showRoleSelector && (
          <button className="change-role-btn" onClick={handleChangeRole}>
            Change Role
          </button>
        )}
      </header>

      <main>
        {showRoleSelector ? (
          <RoleSelector 
            userId={userId} 
            onRoleSelected={handleRoleSelected} 
          />
        ) : (
          <VoiceChat 
            userId={userId} 
            selectedRole={currentRole} 
          />
        )}
      </main>
    </div>
  );
}

export default App;
```

---

## React Native Mobile App Example

### Voice Recording Hook

```javascript
// hooks/useVoiceRecording.js
import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export default function useVoiceRecording() {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const soundRef = useRef(null);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    return uri;
  };

  const playAudio = async (audioUri) => {
    const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
    soundRef.current = sound;
    await sound.playAsync();
  };

  return {
    isRecording,
    startRecording,
    stopRecording,
    playAudio,
  };
}
```

### Voice Chat Screen

```javascript
// screens/VoiceChatScreen.js
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import useVoiceRecording from '../hooks/useVoiceRecording';
import saathiApi from '../services/saathiApi';

export default function VoiceChatScreen({ userId, selectedRole }) {
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { isRecording, startRecording, stopRecording, playAudio } = useVoiceRecording();

  const handlePressIn = () => {
    startRecording();
  };

  const handlePressOut = async () => {
    const audioUri = await stopRecording();
    await sendVoiceMessage(audioUri);
  };

  const sendVoiceMessage = async (audioUri) => {
    setIsProcessing(true);
    
    try {
      // Convert file to blob
      const audioBlob = await fetch(audioUri).then(r => r.blob());
      
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('audio', audioBlob, 'audio.m4a');
      
      const response = await fetch(`${API_BASE_URL}/api/conversation/voice`, {
        method: 'POST',
        body: formData,
      });
      
      // Get metadata from headers
      const transcriptB64 = response.headers.get('x-transcribed-text');
      const responseB64 = response.headers.get('x-ai-response-text');
      
      if (transcriptB64) setTranscript(atob(transcriptB64));
      if (responseB64) setResponse(atob(responseB64));
      
      // Save and play audio response
      const audioBlob = await response.blob();
      const fileUri = FileSystem.documentDirectory + 'response.mp3';
      
      // Note: In React Native, you'd need to convert blob to base64 first
      // or use a library like react-native-blob-util
      
      await playAudio(fileUri);
      
    } catch (error) {
      console.error('Voice message failed:', error);
      Alert.alert('Error', 'Failed to send voice message');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.messagesContainer}>
        {transcript && (
          <View style={styles.userMessage}>
            <Text style={styles.messageText}>{transcript}</Text>
          </View>
        )}
        
        {response && (
          <View style={styles.aiMessage}>
            <Text style={styles.messageText}>{response}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.recordButton, isRecording && styles.recordingButton]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isProcessing}
      >
        <Text style={styles.buttonText}>
          {isRecording ? '🔴 Recording...' : '🎙️ Hold to Talk'}
        </Text>
      </TouchableOpacity>
      
      {isProcessing && (
        <Text style={styles.processingText}>Processing...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 20,
  },
  userMessage: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  aiMessage: {
    backgroundColor: '#E5E5EA',
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  recordButton: {
    backgroundColor: '#34C759',
    padding: 20,
    borderRadius: 50,
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  processingText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
  },
});
```

---

## Error Handling

### API Error Handler

```javascript
// utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    console.error('API Error:', error.response.data);
    
    switch (error.response.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 404:
        return 'User not found. Please sign up.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return error.response.data.error || 'Something went wrong';
    }
  } else if (error.request) {
    // No response received
    return 'Network error. Please check your connection.';
  } else {
    return 'Unexpected error occurred';
  }
};

// Usage
try {
  await saathiApi.sendTextMessage(userId, message);
} catch (error) {
  const errorMessage = handleApiError(error);
  alert(errorMessage);
}
```

---

## Performance Optimization

### 1. Audio Compression Before Upload

```javascript
// utils/audioCompression.js
export const compressAudio = async (audioBlob) => {
  // Use Web Audio API to compress
  const audioContext = new AudioContext();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // Downsample to 16kHz mono (good for speech)
  const offlineContext = new OfflineAudioContext(
    1, // mono
    audioBuffer.duration * 16000, // 16kHz sample rate
    16000
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start();
  
  const renderedBuffer = await offlineContext.startRendering();
  
  // Convert to WAV
  const wav = audioBufferToWav(renderedBuffer);
  return new Blob([wav], { type: 'audio/wav' });
};
```

### 2. Caching Common Responses

```javascript
// services/cacheService.js
const responseCache = new Map();

export const getCachedResponse = (message) => {
  const normalized = message.toLowerCase().trim();
  return responseCache.get(normalized);
};

export const cacheResponse = (message, response) => {
  const normalized = message.toLowerCase().trim();
  responseCache.set(normalized, response);
  
  // Limit cache size
  if (responseCache.size > 100) {
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }
};
```

---

## Testing Your Integration

### 1. Unit Tests (Jest)

```javascript
// __tests__/saathiApi.test.js
import saathiApi from '../services/saathiApi';

describe('Saathi API', () => {
  it('should create a user', async () => {
    const user = await saathiApi.createUser({
      userId: 'test-123',
      name: 'Test User',
    });
    
    expect(user.data.user.user_id).toBe('test-123');
  });
  
  it('should get available roles', async () => {
    const roles = await saathiApi.getRoles();
    expect(roles.data.roles).toHaveLength(9);
  });
});
```

### 2. End-to-End Test (Cypress)

```javascript
// cypress/e2e/voice-chat.cy.js
describe('Voice Chat', () => {
  it('allows user to select role and chat', () => {
    cy.visit('/');
    
    // Select role
    cy.contains('Daughter').click();
    
    // Should show voice chat
    cy.contains('Hold to Talk').should('be.visible');
    
    // Test text fallback
    cy.get('[data-testid="text-input"]').type('Hello');
    cy.get('[data-testid="send-btn"]').click();
    
    // Should receive response
    cy.contains('response').should('be.visible');
  });
});
```

---

## Additional Resources

- **API Documentation**: See README.md for full endpoint reference
- **Deployment Guide**: See DEPLOYMENT.md for production setup
- **Example Apps**: Check `/examples` folder (if available)

---

**Need help? Open an issue on GitHub!**
