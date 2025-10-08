// components/AccessibleVideo/TranscriptDisplay.tsx
import React, { useRef, useEffect } from 'react';

export interface TranscriptData {
  sessionId: string;
  text: string;
  userId?: string;
  timestamp: number;
  isFinal: boolean;
  speaker?: string;
}

interface TranscriptDisplayProps {
  transcripts: TranscriptData[];
  enabled: boolean;
  status: 'idle' | 'starting' | 'active' | 'error';
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  transcripts,
  enabled,
  status
}) => {
  const captionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (captionsRef.current && transcripts.length > 0) {
      captionsRef.current.scrollTop = captionsRef.current.scrollHeight;
    }
  }, [transcripts]);

  const getStatusMessage = (): string => {
    switch (status) {
      case 'starting':
        return 'Starting live captions...';
      case 'active':
        return 'Listening for speech... Powered by Stream Video closed captions.';
      case 'error':
        return 'Caption error. Try toggling captions off and on again.';
      default:
        return 'Click the captions button to enable live closed captions.';
    }
  };

  if (!enabled) return null;

  return (
    <div 
      className="live-captions-container"
      role="complementary"
      aria-label="Live captions"
      aria-live="polite"
      aria-atomic="false"
    >
      <div 
        ref={captionsRef}
        className="captions-content"
      >
        {transcripts.length > 0 ? (
          transcripts.map((transcript) => (
            <div 
              key={`${transcript.sessionId}-${transcript.timestamp}`}
              className={`caption-item ${transcript.isFinal ? 'final' : 'interim'}`}
              aria-label={`${transcript.speaker} said: ${transcript.text}`}
            >
              <strong className="caption-speaker" aria-hidden="true">
                {transcript.speaker}:
              </strong>
              <span className="caption-text">
                {' '}{transcript.text}
              </span>
            </div>
          ))
        ) : (
          <div className="caption-placeholder">
            <span className="caption-text">
              {getStatusMessage()}
            </span>
          </div>
        )}
      </div>
      
      <div className="captions-status" aria-live="polite">
        <span className="sr-only">
          Stream captions status: {status}
        </span>
      </div>
    </div>
  );
};