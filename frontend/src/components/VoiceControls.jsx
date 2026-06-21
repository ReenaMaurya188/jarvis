import React from 'react';
import './VoiceControls.css';

export default function VoiceControls({ 
  isListening, 
  isRecording,
  isSpeaking, 
  wakeWordDebug,
  onStartListening, 
  onStartRecording,
  onStopListening,
  onStopSpeaking,
  speechEnabled,
  onToggleSpeech
}) {
  let micText = '🎙️ Tap or Say "Jarvis"';
  let micClass = '';
  if (isRecording) {
    micText = '🔴 Recording...';
    micClass = 'recording';
  } else if (isListening) {
    micText = '🔵 Listening for Wake Word...';
    micClass = 'listening';
  }

  return (
    <div className="voice-controls">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button 
          className={`mic-button ${micClass}`}
          onClick={isRecording ? onStopListening : onStartRecording}
          title={isRecording ? "Stop recording" : "Manually start recording"}
        >
          {micText}
        </button>
        {isListening && !isRecording && wakeWordDebug && (
          <div style={{ fontSize: '10px', color: '#888', paddingLeft: '8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Heard: "{wakeWordDebug}"
          </div>
        )}
      </div>

      <button 
        className={`speech-toggle ${speechEnabled ? 'enabled' : 'disabled'}`}
        onClick={onToggleSpeech}
        title={speechEnabled ? "Disable TTS" : "Enable TTS"}
      >
        {speechEnabled ? '🔊 Voice On' : '🔇 Voice Off'}
      </button>

      {isSpeaking && (
        <button className="stop-speaking" onClick={onStopSpeaking}>
          ⏹️ Stop JARVIS
        </button>
      )}
    </div>
  );
}
