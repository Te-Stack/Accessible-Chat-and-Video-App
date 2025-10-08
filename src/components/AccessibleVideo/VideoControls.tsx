// Clean VideoControls.tsx with Web Speech API integration
import React, { useState, useRef, useEffect } from 'react';
import { useCallStateHooks, type Call } from '@stream-io/video-react-sdk';

interface VideoControlsProps {
  call: Call;
  onToggleFullscreen: () => void;
  onLeaveCall: () => Promise<void>;
  onToggleCaptions: () => void;
  captionsEnabled: boolean;
  captionsSupported: boolean;
}

export const AccessibleVideoControls: React.FC<VideoControlsProps> = ({ 
  call, 
  onToggleFullscreen,
  onLeaveCall,
  onToggleCaptions,
  captionsEnabled,
  captionsSupported
}) => {
  const {
    useCameraState,
    useMicrophoneState,
    useScreenShareState
  } = useCallStateHooks();
  
  const { camera, isMute: isCameraMuted } = useCameraState();
  const { microphone, isMute: isMicMuted } = useMicrophoneState();
  const { screenShare, isMute: isScreenShareMuted } = useScreenShareState();
  
  const [isToggling, setIsToggling] = useState<{ 
    mic: boolean; 
    camera: boolean; 
    screen: boolean;
  }>({
    mic: false,
    camera: false,
    screen: false
  });
  
  const controlsRef = useRef<HTMLDivElement>(null);

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!controlsRef.current?.contains(document.activeElement)) return;

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
          event.preventDefault();
          navigateControls(event.key === 'ArrowLeft' ? -1 : 1);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          (document.activeElement as HTMLButtonElement)?.click();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigateControls = (direction: number) => {
    const buttons = controlsRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
    if (!buttons) return;

    const currentIndex = Array.from(buttons).findIndex(btn => btn === document.activeElement);
    const nextIndex = Math.max(0, Math.min(buttons.length - 1, currentIndex + direction));
    buttons[nextIndex]?.focus();
  };

  const handleToggleMicrophone = async (): Promise<void> => {
    if (isToggling.mic) return;
    
    try {
      setIsToggling(prev => ({ ...prev, mic: true }));
      await microphone.toggle();
      
      announceToScreenReader(
        isMicMuted ? 'Microphone turned on' : 'Microphone turned off'
      );
    } catch (error) {
      announceToScreenReader('Failed to toggle microphone');
      console.error('Failed to toggle microphone:', error);
    } finally {
      setIsToggling(prev => ({ ...prev, mic: false }));
    }
  };

  const handleToggleCamera = async (): Promise<void> => {
    if (isToggling.camera) return;
    
    try {
      setIsToggling(prev => ({ ...prev, camera: true }));
      await camera.toggle();
      
      announceToScreenReader(
        isCameraMuted ? 'Camera turned on' : 'Camera turned off'
      );
    } catch (error) {
      announceToScreenReader('Failed to toggle camera');
      console.error('Failed to toggle camera:', error);
    } finally {
      setIsToggling(prev => ({ ...prev, camera: false }));
    }
  };

  const handleToggleScreenShare = async (): Promise<void> => {
    if (isToggling.screen) return;
    
    try {
      setIsToggling(prev => ({ ...prev, screen: true }));
      await screenShare.toggle();
      
      announceToScreenReader(
        isScreenShareMuted ? 'Screen sharing started' : 'Screen sharing stopped'
      );
    } catch (error) {
      announceToScreenReader('Failed to toggle screen share');
      console.error('Failed to toggle screen share:', error);
    } finally {
      setIsToggling(prev => ({ ...prev, screen: false }));
    }
  };

  const handleLeaveCall = async (): Promise<void> => {
    const confirmed = window.confirm('Are you sure you want to leave this call?');
    if (confirmed) {
      try {
        announceToScreenReader('Leaving the call...');
        await onLeaveCall();
      } catch (error) {
        console.error('Error in leave call handler:', error);
        announceToScreenReader('Error leaving call');
      }
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

  return (
    <div 
      ref={controlsRef}
      className="video-controls"
      role="toolbar"
      aria-label="Video call controls. Use arrow keys to navigate, Enter to activate."
    >
      <div className="primary-controls">
        <button
          className={`control-button mic-control ${isMicMuted ? 'muted' : 'active'}`}
          onClick={handleToggleMicrophone}
          aria-label={isMicMuted ? 'Turn on microphone' : 'Turn off microphone'}
          aria-pressed={!isMicMuted}
          disabled={isToggling.mic}
          type="button"
        >
          <span aria-hidden="true">
            {isToggling.mic ? '⏳' : (isMicMuted ? '🔇' : '🎤')}
          </span>
          <span className="control-text">
            {isToggling.mic ? 'Toggling...' : (isMicMuted ? 'Mic Off' : 'Mic On')}
          </span>
        </button>

        <button
          className={`control-button camera-control ${isCameraMuted ? 'muted' : 'active'}`}
          onClick={handleToggleCamera}
          aria-label={isCameraMuted ? 'Turn on camera' : 'Turn off camera'}
          aria-pressed={!isCameraMuted}
          disabled={isToggling.camera}
          type="button"
        >
          <span aria-hidden="true">
            {isToggling.camera ? '⏳' : (isCameraMuted ? '📹' : '📷')}
          </span>
          <span className="control-text">
            {isToggling.camera ? 'Toggling...' : (isCameraMuted ? 'Camera Off' : 'Camera On')}
          </span>
        </button>

        <button
          className={`control-button screen-share-control ${!isScreenShareMuted ? 'active' : ''}`}
          onClick={handleToggleScreenShare}
          aria-label={isScreenShareMuted ? 'Start screen sharing' : 'Stop screen sharing'}
          aria-pressed={!isScreenShareMuted}
          disabled={isToggling.screen}
          type="button"
        >
          <span aria-hidden="true">
            {isToggling.screen ? '⏳' : '🖥️'}
          </span>
          <span className="control-text">
            {isToggling.screen ? 'Toggling...' : (isScreenShareMuted ? 'Share Screen' : 'Stop Sharing')}
          </span>
        </button>

        <button
          className="control-button end-call"
          onClick={handleLeaveCall}
          aria-label="Leave call"
          type="button"
        >
          <span aria-hidden="true">📞</span>
          <span className="control-text">Leave</span>
        </button>
      </div>

      <div className="secondary-controls">
        <button
          className="control-button fullscreen-button"
          onClick={onToggleFullscreen}
          aria-label="Toggle fullscreen"
          type="button"
        >
          <span aria-hidden="true">⛶</span>
          <span className="control-text">Fullscreen</span>
        </button>

        <button
          className={`control-button captions-button ${captionsEnabled ? 'active' : ''}`}
          onClick={onToggleCaptions}
          aria-label={
            !captionsSupported 
              ? 'Live captions not supported' 
              : captionsEnabled 
                ? 'Turn off live captions' 
                : 'Turn on live captions'
          }
          aria-pressed={captionsEnabled}
          disabled={!captionsSupported}
          type="button"
        >
          <span aria-hidden="true">
            {!captionsSupported ? '📝❌' : '📝'}
          </span>
          <span className="control-text">
            {!captionsSupported 
              ? 'N/A' 
              : captionsEnabled 
                ? 'Captions On' 
                : 'Captions'
            }
          </span>
        </button>
      </div>
    </div>
  );
};

