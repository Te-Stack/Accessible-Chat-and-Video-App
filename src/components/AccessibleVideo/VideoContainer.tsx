// components/AccessibleVideo/VideoContainer.tsx - Refactored version
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { StreamCall, VideoPreview } from '@stream-io/video-react-sdk';
import type { Call, StreamVideoParticipant } from '@stream-io/video-react-sdk';
import {AccessibleVideoControls} from './VideoControls';
import { TranscriptDisplay, type TranscriptData } from './TranscriptDisplay';
import { ParticipantGrid } from './ParticipantGrid';
import { useScreenReader } from '../../utils';
import { MAX_TRANSCRIPTS } from '../../utils/constants';
import './VideoContainer.css';

interface AccessibleVideoContainerProps {
  call: Call | null;
  onLeaveMeeting?: () => Promise<void>;
  showPreview?: boolean;
}

interface ClosedCaptionEvent {
  closed_caption?: {
    text?: string;
    speaker_id?: string;
    user?: { id?: string; name?: string; };
  };
  text?: string;
  user_id?: string;
}

type TranscriptionStatus = 'idle' | 'starting' | 'active' | 'error';

export const AccessibleVideoContainer: React.FC<AccessibleVideoContainerProps> = ({ 
  call,
  onLeaveMeeting = async () => {},
  showPreview = true
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [participants, setParticipants] = useState<StreamVideoParticipant[]>([]);
  const [captionsEnabled, setCaptionsEnabled] = useState<boolean>(false);
  const [transcripts, setTranscripts] = useState<TranscriptData[]>([]);
  const [transcriptionSupported, setTranscriptionSupported] = useState<boolean>(true);
  const [transcriptionStatus, setTranscriptionStatus] = useState<TranscriptionStatus>('idle');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { announce } = useScreenReader();

  // Update participants list
  const updateParticipants = useCallback(() => {
    if (!call) return;
    
    const allParticipants = [
      ...(call.state.localParticipant ? [call.state.localParticipant] : []),
      ...Array.from(call.state.remoteParticipants.values())
    ];
    setParticipants(allParticipants);
  }, [call]);

  // Track participants
  useEffect(() => {
    if (!call) return;

    updateParticipants();

    const unsubscribe = [
      call.on('participantJoined', updateParticipants),
      call.on('participantLeft', updateParticipants),
      call.on('participantUpdated', updateParticipants)
    ];

    return () => {
      unsubscribe.forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, [call, updateParticipants]);

  // Handle closed captions events
  const handleClosedCaptionsStarted = useCallback(() => {
    setCaptionsEnabled(true);
    setTranscriptionStatus('active');
    setTranscripts([]);
    announce('Live captions started', 'polite');
  }, [announce]);

  const handleClosedCaptionsStopped = useCallback(() => {
    setCaptionsEnabled(false);
    setTranscriptionStatus('idle');
    announce('Live captions stopped', 'polite');
  }, [announce]);

  const handleClosedCaption = useCallback((event: ClosedCaptionEvent) => {
    const closedCaption = event.closed_caption || {};
    const captionText = closedCaption.text || event.text || '';
    const speakerId = closedCaption.speaker_id || closedCaption.user?.id || event.user_id || '';
    
    if (!captionText.trim()) return;

    const participant = participants.find(p => 
      p.userId === speakerId || 
      p.sessionId === speakerId ||
      p.name === closedCaption.user?.name
    );
    
    const speakerName = participant?.name || 
                       closedCaption.user?.name || 
                       participant?.userId || 
                       speakerId || 
                       'Participant';
    
    const newTranscript: TranscriptData = {
      sessionId: speakerId || `session-${Date.now()}`,
      text: captionText.trim(),
      userId: speakerId,
      timestamp: Date.now(),
      isFinal: true,
      speaker: speakerName
    };

    setTranscripts(prev => {
      const updated = prev.filter(t => t.isFinal || t.userId !== newTranscript.userId);
      return [...updated, newTranscript].slice(-MAX_TRANSCRIPTS);
    });

    announce(`${speakerName}: ${captionText}`, 'polite');
  }, [participants, announce]);

  const handleTranscriptionFailed = useCallback(() => {
    setTranscriptionStatus('error');
    setTranscriptionSupported(false);
    announce('Live captions failed - feature may not be available', 'assertive');
  }, [announce]);

  // Subscribe to Stream events
  useEffect(() => {
    if (!call) return;

    const eventHandlers = [
      { event: 'call.closed_captions_started', handler: handleClosedCaptionsStarted },
      { event: 'call.closed_captions_stopped', handler: handleClosedCaptionsStopped },
      { event: 'call.closed_caption', handler: handleClosedCaption },
      { event: 'call.closed_captions_failed', handler: handleTranscriptionFailed },
      { event: 'call.transcription_failed', handler: handleTranscriptionFailed }
    ];

    eventHandlers.forEach(({ event, handler }) => {
      try {
        call.on(event, handler);
      } catch (error) {
        console.warn(`Could not subscribe to ${event}:`, error);
      }
    });

    if (call.state.transcribing) {
      setCaptionsEnabled(true);
      setTranscriptionStatus('active');
    }

    return () => {
      eventHandlers.forEach(({ event, handler }) => {
        try {
          call.off(event, handler);
        } catch (error) {
          // Ignore cleanup errors
        }
      });
    };
  }, [call, handleClosedCaptionsStarted, handleClosedCaptionsStopped, handleClosedCaption, handleTranscriptionFailed]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    
    try {
      if (!isFullscreen && !document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.warn('Fullscreen toggle failed:', error);
    }
  }, [isFullscreen]);

  const toggleCaptions = useCallback(async () => {
    if (!transcriptionSupported) {
      announce('Live captions not supported', 'assertive');
      return;
    }

    if (!call) {
      announce('No active call for captions', 'assertive');
      return;
    }

    try {
      setTranscriptionStatus('starting');

      if (captionsEnabled) {
        await call.stopClosedCaptions();
        announce('Stopping live captions...', 'polite');
      } else {
        await call.startClosedCaptions({ language: 'en' });
        announce('Starting live captions...', 'polite');
      }
    } catch (error) {
      console.error('Captions toggle error:', error);
      setTranscriptionStatus('error');
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle captions';
      announce(errorMessage, 'assertive');
      
      setTimeout(() => {
        setTranscriptionStatus(captionsEnabled ? 'active' : 'idle');
      }, 3000);
    }
  }, [call, captionsEnabled, transcriptionSupported, announce]);

  // Render preview if no call
  if (!call && showPreview) {
    return (
      <div 
        ref={containerRef}
        className="video-container"
        role="main"
        aria-label="Video preview"
      >
        <div className="preview-container">
          <VideoPreview />
          <div className="preview-message">
            <p>Video preview - Start or join a meeting to connect with others</p>
          </div>
        </div>
      </div>
    );
  }

  if (!call) return null;

  return (
    <div 
      ref={containerRef}
      className={`video-container ${isFullscreen ? 'fullscreen' : ''}`}
      role="main"
      aria-label="Video call interface"
    >
      <StreamCall call={call}>
        <div className="video-grid">
          <ParticipantGrid participants={participants} />
          
          <TranscriptDisplay
            transcripts={transcripts}
            enabled={captionsEnabled}
            status={transcriptionStatus}
          />
          
          <AccessibleVideoControls
            call={call}
            onToggleFullscreen={toggleFullscreen}
            onLeaveCall={onLeaveMeeting}
            onToggleCaptions={toggleCaptions}
            captionsEnabled={captionsEnabled}
            captionsSupported={transcriptionSupported}
          />
        </div>
      </StreamCall>
    </div>
  );
};