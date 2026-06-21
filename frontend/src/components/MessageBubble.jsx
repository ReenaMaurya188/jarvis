import React from 'react';
import './MessageBubble.css';

export default function MessageBubble({ role, content }) {
  return (
    <div className={`message-wrapper ${role === 'user' ? 'right' : 'left'}`}>
      <div className={`message-bubble ${role}`}>
        {content}
      </div>
    </div>
  );
}
