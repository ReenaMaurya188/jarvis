import { useState, useEffect, useCallback, useRef } from 'react';

export default function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false); // Idle Wake-Word mode
  const [isRecording, setIsRecording] = useState(false); // Active Whisper mode
  const [transcript, setTranscript] = useState('');
  const [wakeWordDebug, setWakeWordDebug] = useState('');
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const silenceTimerRef = useRef(null);

  // Play a soft beep
  const playWakeSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.error("Audio beep failed", e);
    }
  };

  const startRecording = useCallback(async () => {
    // 1. Stop Wake Word listener
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // Prevent it from auto-restarting
      recognitionRef.current.abort();
    }
    
    setIsListening(false);
    setIsRecording(true);
    playWakeSound();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up AudioContext for silence detection
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.1;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Hard timeout: stop recording after 10 seconds maximum
      const maxRecordTimer = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          console.log("Max recording time reached, stopping.");
          mediaRecorderRef.current.stop();
        }
      }, 10000);

      const detectSilence = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // If average volume is low (raised threshold to 35 for background noise), consider it silence
        if (average < 35) {
          if (!silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                console.log("Silence detected, stopping recording.");
                mediaRecorderRef.current.stop();
              }
            }, 1500); // 1.5 seconds of silence
          }
        } else {
          // Voice detected, reset silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          requestAnimationFrame(detectSilence);
        }
      };

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        clearTimeout(maxRecordTimer);
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop()); // Release mic
        if (audioContextRef.current) audioContextRef.current.close();
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        // Send to backend
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'command.webm');

        try {
          const res = await fetch('http://localhost:8000/chat/audio', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (data.text) {
            setTranscript(data.text);
          }
        } catch (err) {
          console.error("Transcription failed", err);
        }

        // Restart wake word listener after a short delay
        setTimeout(startListening, 500);
      };

      mediaRecorder.start(250);
      detectSilence();

    } catch (err) {
      console.error('Failed to start recording', err);
      setIsRecording(false);
      startListening(); // Revert back to wake word
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // Indian English tuned specifically for your accent

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i][0].transcript.toLowerCase();
        console.log("Wake word engine heard:", result);
        setWakeWordDebug(result);
        
        // Wake Word Detection
        const triggerWords = ['jarvis', 'hey jarvis', 'java', 'service', 'travis', 'garbage', 'jerry', 'jayesh', 'javesh', 'chavez', 'jharkhand', 'charvis'];
        const triggered = triggerWords.some(word => result.includes(word));
        
        if (triggered) {
          console.log("Wake word detected!");
          setWakeWordDebug(''); // Clear on successful trigger
          
          // Extract the command after the wake word
          let command = result;
          triggerWords.forEach(w => {
            command = command.replace(w, '').trim();
          });
          
          if (command.length > 3) {
            // The user spoke the entire command in one breath! 
            // Bypass Whisper entirely because the recording would miss it anyway.
            console.log("Fast-track command detected:", command);
            
            // Abort current listener so we don't hear our own TTS
            if (recognitionRef.current) {
               recognitionRef.current.onend = null;
               recognitionRef.current.abort();
            }
            setIsListening(false);
            
            setTranscript(command);
          } else {
            // The user just said "Jarvis" and paused. Start the high-quality Whisper recorder!
            startRecording();
          }
          
          break;
        }
      }
    };

    recognition.onerror = (event) => {
      // Ignore no-speech errors, just restart
      if (event.error !== 'no-speech') {
        console.error('Speech recognition error', event.error);
        setError(event.error);
      }
    };

    recognition.onend = () => {
      // Automatically restart listening if we are still supposed to be in 'idle' mode
      // and not currently recording
      if (isListening && !isRecording) {
        try { recognition.start(); } catch(e){}
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening, isRecording, startRecording]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.abort();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.onend = null;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  return { isListening, isRecording, transcript, wakeWordDebug, startListening, stopListening, startRecording, resetTranscript, error };
}
