import React from 'react';
import './HUD.css';

export default function HUD({ status }) {
  // status can be: 'idle', 'listening', 'thinking', 'speaking'
  
  return (
    <div className={`hud-container ${status}`}>
      <div className="hud-indicator">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>
      <div className="hud-text">
        {status === 'idle' && 'Online'}
        {status === 'listening' && 'Listening...'}
        {status === 'thinking' && 'Thinking...'}
        {status === 'speaking' && 'Speaking...'}
      </div>
    </div>
  );
}
