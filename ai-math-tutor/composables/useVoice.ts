// Voice interface composable using Web Speech API
// Provides speech-to-text and text-to-speech capabilities

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

export const useVoice = () => {
  // State
  const isListening = ref(false)
  const isSpeaking = ref(false)
  const ttsEnabled = ref(false)
  const recognitionError = ref<string | null>(null)
  
  // Speech Recognition instance
  let recognition: SpeechRecognition | null = null
  let currentTranscript = ref('')
  
  // Speech Synthesis
  let currentUtterance: SpeechSynthesisUtterance | null = null
  
  // Browser compatibility check
  const isSupported = computed(() => {
    if (process.server) return false
    
    const hasRecognition = 
      typeof window !== 'undefined' && 
      (window.SpeechRecognition || (window as any).webkitSpeechRecognition)
    
    const hasSynthesis = 
      typeof window !== 'undefined' && 
      'speechSynthesis' in window
    
    return hasRecognition && hasSynthesis
  })
  
  // Initialize Speech Recognition
  const initRecognition = (): SpeechRecognition | null => {
    if (process.server || !isSupported.value) return null
    
    try {
      const SpeechRecognitionClass = 
        window.SpeechRecognition || 
        (window as any).webkitSpeechRecognition
      
      if (!SpeechRecognitionClass) return null
      
      const rec = new SpeechRecognitionClass() as SpeechRecognition
      rec.continuous = true
      rec.interimResults = true
      rec.lang = 'en-US'
      
      rec.onstart = () => {
        isListening.value = true
        recognitionError.value = null
      }
      
      rec.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = ''
        let finalTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }
        
        currentTranscript.value = finalTranscript + interimTranscript
      }
      
      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        isListening.value = false
        
        let errorMessage = 'Speech recognition error'
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.'
            break
          case 'audio-capture':
            errorMessage = 'Microphone not found. Please check your microphone.'
            break
          case 'not-allowed':
            errorMessage = 'Microphone permission denied. Please allow microphone access.'
            break
          case 'network':
            errorMessage = 'Network error. Please check your connection.'
            break
          case 'aborted':
            // User or system aborted - this is fine, don't show error
            return
          default:
            errorMessage = `Recognition error: ${event.error}`
        }
        
        recognitionError.value = errorMessage
      }
      
      rec.onend = () => {
        isListening.value = false
      }
      
      return rec
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error)
      return null
    }
  }
  
  // Start listening
  const startListening = async (): Promise<boolean> => {
    if (!isSupported.value) {
      recognitionError.value = 'Speech recognition not supported in this browser'
      return false
    }
    
    if (isListening.value) {
      return true
    }
    
    try {
      // Request microphone permission
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true })
        } catch (permissionError: any) {
          if (permissionError.name === 'NotAllowedError') {
            recognitionError.value = 'Microphone permission denied. Please allow microphone access in your browser settings.'
            return false
          }
          throw permissionError
        }
      }
      
      if (!recognition) {
        recognition = initRecognition()
        if (!recognition) {
          recognitionError.value = 'Failed to initialize speech recognition'
          return false
        }
      }
      
      currentTranscript.value = ''
      recognition.start()
      return true
    } catch (error: any) {
      console.error('Error starting speech recognition:', error)
      recognitionError.value = error.message || 'Failed to start speech recognition'
      isListening.value = false
      return false
    }
  }
  
  // Stop listening
  const stopListening = () => {
    if (recognition && isListening.value) {
      try {
        recognition.stop()
      } catch (error) {
        console.error('Error stopping recognition:', error)
      }
    }
    isListening.value = false
    return currentTranscript.value
  }
  
  // Get current transcript
  const getTranscript = () => {
    return currentTranscript.value
  }
  
  // Clear transcript
  const clearTranscript = () => {
    currentTranscript.value = ''
  }
  
  // Toggle TTS
  const toggleTTS = () => {
    ttsEnabled.value = !ttsEnabled.value
    if (!ttsEnabled.value && isSpeaking.value) {
      stopSpeaking()
    }
  }
  
  // Speak text
  const speak = (text: string) => {
    if (!ttsEnabled.value || process.server) return
    
    try {
      // Stop any current speech
      stopSpeaking()
      
      // Clean text - strip HTML, markdown, and LaTeX
      const cleanText = text
        .replace(/<[^>]*>/g, ' ') // Remove HTML tags
        .replace(/\$+.*?\$+/g, '') // Remove LaTeX (between $)
        .replace(/\\\[.*?\\\]/g, '') // Remove LaTeX blocks
        .replace(/\\\(.*?\\\)/g, '') // Remove LaTeX inline
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*([^*]+)\*/g, '$1') // Remove italic markdown
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove markdown links
        .replace(/#{1,6}\s+/g, '') // Remove markdown headers
        .replace(/`([^`]+)`/g, '$1') // Remove code blocks
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
      
      if (!cleanText) return
      
      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.lang = 'en-US'
      utterance.rate = 0.9 // Slightly slower for clarity
      utterance.pitch = 1
      utterance.volume = 1
      
      utterance.onstart = () => {
        isSpeaking.value = true
      }
      
      utterance.onend = () => {
        isSpeaking.value = false
        currentUtterance = null
      }
      
      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error)
        isSpeaking.value = false
        currentUtterance = null
        // Silently fail - don't break chat flow
      }
      
      currentUtterance = utterance
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      console.error('Error speaking text:', error)
      // Silently fail - don't break chat flow
    }
  }
  
  // Stop speaking
  const stopSpeaking = () => {
    if (process.server) return
    
    try {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel()
      }
      isSpeaking.value = false
      currentUtterance = null
    } catch (error) {
      console.error('Error stopping speech:', error)
    }
  }
  
  // Pause speaking
  const pauseSpeaking = () => {
    if (process.server) return
    
    try {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause()
      }
    } catch (error) {
      console.error('Error pausing speech:', error)
    }
  }
  
  // Resume speaking
  const resumeSpeaking = () => {
    if (process.server) return
    
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }
    } catch (error) {
      console.error('Error resuming speech:', error)
    }
  }
  
  // Cleanup on unmount
  const cleanup = () => {
    stopListening()
    stopSpeaking()
    
    if (recognition) {
      try {
        recognition.abort()
      } catch (error) {
        console.error('Error aborting recognition:', error)
      }
      recognition = null
    }
    
    currentTranscript.value = ''
    recognitionError.value = null
  }
  
  // Cleanup on component unmount
  if (process.client) {
    onUnmounted(() => {
      cleanup()
    })
  }
  
  return {
    // State
    isListening: readonly(isListening),
    isSpeaking: readonly(isSpeaking),
    ttsEnabled: readonly(ttsEnabled),
    isSupported,
    recognitionError: readonly(recognitionError),
    currentTranscript: readonly(currentTranscript),
    
    // Methods
    startListening,
    stopListening,
    getTranscript,
    clearTranscript,
    toggleTTS,
    speak,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    cleanup
  }
}

