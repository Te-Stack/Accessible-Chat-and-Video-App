// components/Meeting/MeetingView.tsx
import React, { useState } from 'react';
import { StreamVideo } from '@stream-io/video-react-sdk';
import type { StreamVideoClient, Call } from '@stream-io/video-react-sdk';
import  {AccessibleVideoContainer} from '../AccessibleVideo';
import { useScreenReader } from '../../utils';

interface MeetingViewProps {
  videoClient: StreamVideoClient;
  currentCall: Call | null;
  onJoinMeeting: (meetingId: string) => Promise<void>;
  onLeaveMeeting: () => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
  transcriptionAvailable: boolean;
}

export const MeetingView: React.FC<MeetingViewProps> = ({
  videoClient,
  currentCall,
  onJoinMeeting,
  onLeaveMeeting,
  onBack,
  isLoading,
  error,
  transcriptionAvailable
}) => {
  const [meetingId, setMeetingId] = useState('');
  const { announce } = useScreenReader();

  const handleGenerateId = () => {
    const id = `meeting-${Math.random().toString(36).slice(2, 7)}`;
    setMeetingId(id);
    announce(`Generated meeting ID: ${id}`, 'polite');
  };

  if (currentCall) {
    return (
      <div className="video-wrapper">
        <StreamVideo client={videoClient}>
          <AccessibleVideoContainer
            call={currentCall}
            onLeaveMeeting={onLeaveMeeting}
            showPreview={false}
          />
        </StreamVideo>
      </div>
    );
  }

  return (
    <section className="panel" aria-label="Start or join a meeting">
      <h2 className="panel-title">Start or join a meeting</h2>
      
      {transcriptionAvailable && (
        <div className="feature-notice" role="note">
          This meeting will support live captions powered by Stream Video closed captions.
        </div>
      )}

      <div className="meeting-form">
        <label className="field">
          <span>Meeting ID</span>
          <input
            className="input"
            placeholder="Enter meeting ID (or generate one)"
            value={meetingId}
            onChange={e => setMeetingId(e.target.value)}
            aria-label="Meeting ID"
            disabled={isLoading}
          />
        </label>

        <div className="buttons-row">
          <button
            className="button primary"
            onClick={() => meetingId ? onJoinMeeting(meetingId) : handleGenerateId()}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? 'Starting...' : (meetingId ? 'Start Meeting' : 'Generate ID')}
          </button>

          <button
            className="button secondary"
            onClick={() => onJoinMeeting(meetingId)}
            disabled={!meetingId || isLoading}
            type="button"
          >
            {isLoading ? 'Joining...' : 'Join Meeting'}
          </button>

          <button 
            className="button"
            onClick={onBack}
            disabled={isLoading}
            type="button"
          >
            Back
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="error-text">
          {error}
        </div>
      )}
    </section>
  );
};