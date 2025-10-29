import { useState, useCallback, useEffect, useRef } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

/**
 * Transcribe audio using Chrome Prompt API
 */
async function transcribeAudioWithPromptAPI(audioBlob: Blob): Promise<string> {
  try {
    // Create a session with audio input support
    const session = await chrome.aiOriginTrial.languageModel.create({
      systemPrompt: "You are a speech-to-text transcription assistant. Transcribe the audio accurately. Return ONLY the transcribed text with no explanations, formatting, or additional commentary.",
      expectedInputs: [{ type: "audio" }]
    });

    try {
      // Send audio for transcription
      const result = await session.prompt([{
        role: "user",
        content: [
          { type: "audio", value: audioBlob }
        ]
      }]);
      
      return result.trim();
    } finally {
      session.destroy();
    }
  } catch (error) {
    console.error('Prompt API transcription error:', error);
    throw error;
  }
}

/**
 * Check if Prompt API audio transcription is available
 */
async function checkPromptAPIAudioSupport(): Promise<boolean> {
  try {
    if (!chrome.aiOriginTrial?.languageModel) {
      return false;
    }
    
    const availability = await chrome.aiOriginTrial.languageModel.availability({
      expectedInputs: [{ type: "audio" }]
    });
    
    return availability !== "unavailable";
  } catch (e) {
    console.debug('Prompt API audio check failed:', e);
    return false;
  }
}

export function useVoiceInput(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [usePromptAPI, setUsePromptAPI] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check support on mount
    const checkSupport = async () => {
      // Check for basic microphone/speech support
      const hasMediaRecorder = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
      
      // Check if we can use Prompt API
      const hasPromptAPI = await checkPromptAPIAudioSupport();
      const canUsePromptAPI = hasPromptAPI && hasMediaRecorder;
      
      // Button shows only if at least one method will work
      const atLeastOneMethodWorks = canUsePromptAPI || hasSpeechRecognition;
      setIsSupported(atLeastOneMethodWorks);
      setUsePromptAPI(canUsePromptAPI);
      
      console.log('🎤 Voice input support check:', {
        hasMediaRecorder,
        hasSpeechRecognition,
        hasPromptAPI,
        canUsePromptAPI,
        atLeastOneMethodWorks,
        buttonWillShow: atLeastOneMethodWorks
      });
    };
    
    checkSupport();
  }, []);

  const startListening = useCallback(async () => {
    console.log('🎤 Microphone button clicked', { isSupported, usePromptAPI });
    
    if (!isSupported) {
      console.warn('⚠️ Voice input not supported');
      setInterimText('Voice input not supported');
      setTimeout(() => setInterimText(''), 3000);
      return;
    }

    try {
      // Use Prompt API if available, otherwise fall back to Web Speech API
      if (usePromptAPI) {
        // Prompt API with MediaRecorder approach
        console.log('🎙️ Using Prompt API for transcription');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000,
          } 
        });
        
        streamRef.current = stream;
        
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm'
        });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          
          setInterimText('Transcribing with AI...');
          try {
            const transcription = await transcribeAudioWithPromptAPI(audioBlob);
            setInterimText('');
            if (transcription) {
              onResult(transcription);
            }
          } catch (error) {
            console.error('Transcription error:', error);
            setInterimText('Transcription failed');
            setTimeout(() => setInterimText(''), 2000);
          }
          
          setIsListening(false);
        };

        mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error:', event);
          setIsListening(false);
          setInterimText('Recording failed');
          setTimeout(() => setInterimText(''), 2000);
        };

        mediaRecorder.start();
        setIsListening(true);
        setInterimText('Listening...');
        console.log('✅ Recording started with Prompt API');
        
        setTimeout(() => {
          if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        }, 10000);
        
      } else {
        // Fallback to Web Speech API
        console.log('🗣️ Using Web Speech API for transcription');
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
          console.error('❌ Neither Prompt API nor Web Speech API available');
          setInterimText('Voice input not available in this browser');
          setTimeout(() => setInterimText(''), 3000);
          return;
        }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        if (interim) {
          setInterimText(interim);
        }

        if (final) {
          setInterimText('');
          onResult(final);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setInterimText('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

        recognition.start();
        setIsListening(true);
        console.log('✅ Recording started with Web Speech API');
      }
    } catch (error) {
      console.error('❌ Voice input error:', error);
      setIsListening(false);
      setInterimText(`Voice input failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setInterimText(''), 3000);
    }
  }, [isSupported, usePromptAPI, onResult]);

  const stopListening = useCallback(() => {
    // Stop MediaRecorder if using Prompt API
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Stop Web Speech Recognition if using fallback
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      recognitionRef.current = null;
    }
    
    setIsListening(false);
    setInterimText('');
  }, []);

  return {
    isListening,
    isSupported,
    interimText,
    startListening,
    stopListening,
  };
}

