// components/AccessibleVideo/ParticipantGrid.tsx
import React from 'react';
import { ParticipantView } from '@stream-io/video-react-sdk';
import type { StreamVideoParticipant } from '@stream-io/video-react-sdk';

interface ParticipantGridProps {
  participants: StreamVideoParticipant[];
}

export const ParticipantGrid: React.FC<ParticipantGridProps> = ({ participants }) => {
  if (participants.length === 0) {
    return (
      <div className="no-participants" aria-live="polite">
        <p>Waiting for participants to join...</p>
      </div>
    );
  }

  return (
    <div 
      className="participants-container"
      aria-label={`Video call with ${participants.length} participant${participants.length !== 1 ? 's' : ''}`}
    >
      {participants.map((participant) => (
        <div
          key={participant.sessionId}
          className={`participant-video ${
            participant.isLocalParticipant ? 'local' : 'remote'
          }`}
          aria-label={`${participant.name || participant.userId || 'Participant'} ${
            participant.isLocalParticipant ? '(You)' : ''
          }`}
        >
          <ParticipantView 
            participant={participant}
            trackType="videoTrack"
          />
          <div className="participant-info">
            <span className="participant-name">
              {participant.name || participant.userId || 'Participant'}
              {participant.isLocalParticipant && ' (You)'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};