import React, { useEffect, useState } from 'react';
import './AudioVisualizer.css';

export default function AudioVisualizer({ isSpeaking }) {
  const NUM_BARS = 36;
  const [bars, setBars] = useState(Array(NUM_BARS).fill(10));

  useEffect(() => {
    let interval;
    if (isSpeaking) {
      interval = setInterval(() => {
        // Generate random heights for the bars when speaking to simulate waveform
        setBars(prev => prev.map(() => 10 + Math.random() * 50));
      }, 80);
    } else {
      // Return to idle state
      setBars(Array(NUM_BARS).fill(4));
    }

    return () => clearInterval(interval);
  }, [isSpeaking]);

  return (
    <div className="audio-visualizer-circular">
      {bars.map((height, i) => {
        const rotation = (360 / NUM_BARS) * i;
        return (
          <div 
            key={i} 
            className="visualizer-bar"
            style={{
              height: `${height}px`,
              transform: `rotate(${rotation}deg) translateY(-120px)`,
              background: isSpeaking ? 'var(--color-primary)' : 'rgba(64, 196, 255, 0.2)',
              boxShadow: isSpeaking ? '0 0 10px var(--color-primary)' : 'none'
            }}
          />
        );
      })}
    </div>
  );
}
