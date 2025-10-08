// hooks/useCallManagement.ts
import { useState, useCallback } from 'react';
import type { StreamVideoClient, Call } from '@stream-io/video-react-sdk';
import { cleanupMediaTracks, disableCallDevices, enableCallDevices } from '../utils';
import { DEVICE_ENABLE_DELAY } from '../utils/constants';

interface UseCallManagementProps {
  videoClient: StreamVideoClient | null;
  userId: string | null;
  onSuccess?: (call: Call) => void;
  onError?: (error: Error) => void;
}

interface UseCallManagementReturn {
  joinMeeting: (meetingId: string) => Promise<Call | null>;
  leaveMeeting: (call: Call) => Promise<void>;
  isJoining: boolean;
  isLeaving: boolean;
  transcriptionAvailable: boolean;
}

export const useCallManagement = ({
  videoClient,
  userId,
  onSuccess,
  onError
}: UseCallManagementProps): UseCallManagementReturn => {
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [transcriptionAvailable, setTranscriptionAvailable] = useState(true);

  const joinMeeting = useCallback(async (meetingId: string): Promise<Call | null> => {
    if (!videoClient || !userId) {
      const error = new Error('Cannot join meeting without video client or user ID');
      onError?.(error);
      return null;
    }
    
    setIsJoining(true);
    
    try {
      const call = videoClient.call('default', meetingId);
      
      // Try to enable transcription
      try {
        await call.getOrCreate({
          data: {
            custom: { createdById: userId },
            settings_override: {
              transcription: {
                mode: 'available',
                closed_caption_mode: 'available',
                language: 'en'
              }
            }
          }
        });
        setTranscriptionAvailable(true);
      } catch (transcriptionError) {
        console.warn('Could not enable transcription:', transcriptionError);
        await call.getOrCreate({
          data: { custom: { createdById: userId } }
        });
        setTranscriptionAvailable(false);
      }
      
      await call.join();
      
      // Enable devices with delay
      setTimeout(async () => {
        try {
          await enableCallDevices(call);
        } catch (error) {
          console.warn('Device enable error:', error);
        }
      }, DEVICE_ENABLE_DELAY);
      
      onSuccess?.(call);
      return call;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to join meeting');
      onError?.(err);
      return null;
    } finally {
      setIsJoining(false);
    }
  }, [videoClient, userId, onSuccess, onError]);

  const leaveMeeting = useCallback(async (call: Call): Promise<void> => {
    setIsLeaving(true);
    
    try {
      // Stop closed captions if active
      try {
        if (call.state.transcribing) {
          await call.stopClosedCaptions();
        }
      } catch (error) {
        console.warn('Could not stop closed captions:', error);
      }

      cleanupMediaTracks(call);
      await disableCallDevices(call);
      await call.leave();
    } catch (error) {
      console.error('Error leaving meeting:', error);
      throw error;
    } finally {
      setIsLeaving(false);
    }
  }, []);

  return {
    joinMeeting,
    leaveMeeting,
    isJoining,
    isLeaving,
    transcriptionAvailable
  };
};