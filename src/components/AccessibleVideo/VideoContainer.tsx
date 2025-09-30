// VideoContainer.tsx with Stream's native transcription - FIXED
import React, { useRef, useState, useEffect } from 'react';
import { 
  StreamCall, 
  ParticipantView, 
  VideoPreview 
} from '@stream-io/video-react-sdk';
import type { Call, StreamVideoParticipant } from '@stream-io/video-react-sdk';
import AccessibleVideoControls from './VideoControls';
import './VideoContainer.css';

interface TranscriptData {
  sessionId: string;
  text: string;
  userId?: string;
  timestamp: number;
  isFinal: boolean;
  speaker?: string;
}

interface AccessibleVideoContainerProps {
  call: Call | null;
  onLeaveMeeting?: () => Promise<void>;
  showPreview?: boolean;
}

const AccessibleVideoContainer: React.FC<AccessibleVideoContainerProps> = ({ 
  call,
  onLeaveMeeting = async () => {},
  showPreview = true
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [participants, setParticipants] = useState<StreamVideoParticipant[]>([]);
  const [captionsEnabled, setCaptionsEnabled] = useState<boolean>(false);
  const [transcripts, setTranscripts] = useState<TranscriptData[]>([]);
  const [transcriptionSupported, setTranscriptionSupported] = useState<boolean>(true);
  const [transcriptionStatus, setTranscriptionStatus] = useState<'idle' | 'starting' | 'active' | 'error'>('idle');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const captionsRef = useRef<HTMLDivElement>(null);

  // Track participants
  useEffect(() => {
    if (!call) return;

    const updateParticipants = () => {
      const allParticipants = [
        ...(call.state.localParticipant ? [call.state.localParticipant] : []),
        ...Array.from(call.state.remoteParticipants.values())
      ];
      setParticipants(allParticipants);
    };

    updateParticipants();

    const unsubscribeFunctions = [
      call.on('participantJoined', updateParticipants),
      call.on('participantLeft', updateParticipants),
      call.on('participantUpdated', updateParticipants)
    ];

    return () => {
      unsubscribeFunctions.forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, [call]);

  // Stream native transcription event handling
  useEffect(() => {
    if (!call) return;

    const handleClosedCaptionsStarted = (event: any) => {
      console.log('Stream closed captions started:', event);
      setCaptionsEnabled(true);
      setTranscriptionStatus('active');
      setTranscripts([]);
      announceToScreenReader('Live captions started');
    };

    const handleClosedCaptionsStopped = (event: any) => {
      console.log('Stream closed captions stopped:', event);
      setCaptionsEnabled(false);
      setTranscriptionStatus('idle');
      announceToScreenReader('Live captions stopped');
    };

    // This is the key event for receiving actual caption text
    const handleClosedCaption = (event: any) => {
      console.log('Stream closed caption received:', event);
      
      // Extract caption data from Stream's event structure
      // Based on console logs, the data is in event.closed_caption
      const closedCaption = event.closed_caption || {};
      const captionText = closedCaption.text || event.text || '';
      const speakerId = closedCaption.speaker_id || closedCaption.user?.id || event.user_id || '';
      const isFinal = true; // Stream captions are typically final
      
      if (captionText && captionText.trim()) {
        // Find the participant who spoke
        const participant = participants.find(p => p.userId === speakerId) || 
                          participants.find(p => p.sessionId === speakerId) ||
                          participants.find(p => p.name === closedCaption.user?.name);
        
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
          isFinal,
          speaker: speakerName
        };

        console.log('Adding transcript:', newTranscript); // Debug log

        setTranscripts(prev => {
          let updated = [...prev];
          
          // If this is an interim result, replace any existing interim with same speaker
          if (!isFinal) {
            updated = updated.filter(t => t.isFinal || t.userId !== newTranscript.userId);
          }
          
          updated.push(newTranscript);
          
          // Keep last 10 transcripts for performance
          return updated.slice(-10);
        });

        // Announce final transcripts to screen readers
        if (isFinal) {
          announceToScreenReader(`Caption from ${speakerName}: ${captionText}`);
        }
      } else {
        console.log('No caption text found in event:', event);
      }
    };

    const handleTranscriptionFailed = (event: any) => {
      console.error('Stream transcription/captions failed:', event);
      setTranscriptionStatus('error');
      setTranscriptionSupported(false);
      announceToScreenReader('Live captions failed - feature may not be available');
    };

    // Subscribe to the correct Stream events based on documentation
    const eventHandlers = [
      { event: 'call.closed_captions_started', handler: handleClosedCaptionsStarted },
      { event: 'call.closed_captions_stopped', handler: handleClosedCaptionsStopped },
      { event: 'call.closed_caption', handler: handleClosedCaption }, // This is the key event
      { event: 'call.closed_captions_failed', handler: handleTranscriptionFailed },
      { event: 'call.transcription_failed', handler: handleTranscriptionFailed }
    ];

    // Subscribe to events
    eventHandlers.forEach(({ event, handler }) => {
      try {
        call.on(event, handler);
        console.log(`Subscribed to ${event}`);
      } catch (error) {
        console.warn(`Could not subscribe to ${event}:`, error);
      }
    });

    // Check current state
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
  }, [call, participants]);

  // Auto-scroll captions
  useEffect(() => {
    if (captionsRef.current && transcripts.length > 0) {
      captionsRef.current.scrollTop = captionsRef.current.scrollHeight;
    }
  }, [transcripts]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
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
  };

  const toggleCaptions = async () => {
    if (!transcriptionSupported) {
      announceToScreenReader('Live captions not supported');
      return;
    }

    if (!call) {
      announceToScreenReader('No active call for captions');
      return;
    }

    try {
      setTranscriptionStatus('starting');

      if (captionsEnabled) {
        // Use Stream's direct API to stop closed captions
        await call.stopClosedCaptions();
        announceToScreenReader('Stopping live captions...');
      } else {
        // Use Stream's direct API to start closed captions with English language
        await call.startClosedCaptions({ language: 'en' });
        announceToScreenReader('Starting live captions...');
      }
    } catch (error) {
      console.error('Closed captions toggle error:', error);
      setTranscriptionStatus('error');
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle captions';
      announceToScreenReader(errorMessage);
      
      // Reset status after error
      setTimeout(() => {
        setTranscriptionStatus(captionsEnabled ? 'active' : 'idle');
      }, 3000);
    }
  };

  const getStatusMessage = () => {
    switch (transcriptionStatus) {
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

  const announceToScreenReader = (message: string): void => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    announcement.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  };

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
          <div 
            className="participants-container"
            aria-label={`Video call with ${participants.length} participant${participants.length !== 1 ? 's' : ''}`}
          >
            {participants.length > 0 ? (
              participants.map((participant) => (
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
              ))
            ) : (
              <div className="no-participants" aria-live="polite">
                <p>Waiting for participants to join...</p>
              </div>
            )}
          </div>
          
          {/* FIXED: Changed class name to match CSS and show captions */}
          {captionsEnabled && (
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
                  transcripts.map((transcript, index) => (
                    <div 
                      key={`${transcript.sessionId}-${transcript.timestamp}`}
                      className={`caption-item ${transcript.isFinal ? 'final' : 'interim'}`}
                      aria-label={`${transcript.speaker} said: ${transcript.text}`}
                    >
                      <strong className="caption-speaker" aria-hidden="true">
                        {transcript.speaker}:
                      </strong>
                      <span className="caption-text">
                        {transcript.text}
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
                  Stream captions status: {transcriptionStatus}
                </span>
              </div>
            </div>
          )}
          
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

export default AccessibleVideoContainer;