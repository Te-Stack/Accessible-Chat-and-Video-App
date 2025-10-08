// components/Hub/HubView.tsx
import React from 'react';
import type { View } from '../../types';

interface HubViewProps {
  onNavigate: (view: View) => void;
  transcriptionAvailable: boolean;
}

export const HubView: React.FC<HubViewProps> = ({ 
  onNavigate, 
  transcriptionAvailable 
}) => {
  return (
    <nav className="hub" role="navigation" aria-label="Main actions">
      

      <div className="hub-grid">
        <button 
          className="button primary" 
          onClick={() => onNavigate('chat-select')} 
          aria-label="Chat with user"
          type="button"
        >
          <span className="button-icon" aria-hidden="true">💬</span>
          <span>Chat with user</span>
        </button>

        <button 
          className="button secondary" 
          onClick={() => onNavigate('meeting')} 
          aria-label="Start or join meeting"
          type="button"
        >
          <span className="button-icon" aria-hidden="true">📹</span>
          <span>Start / Join meeting</span>
          {transcriptionAvailable && (
            <span className="feature-hint">with live captions</span>
          )}
        </button>
      </div>
    </nav>
  );
};