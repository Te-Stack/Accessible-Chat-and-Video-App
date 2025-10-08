// utils/mediaHelpers.ts
import type { Call } from '@stream-io/video-react-sdk';

export const cleanupMediaTracks = (call: Call): void => {
  try {
    const localParticipant = call.state.localParticipant;
    
    localParticipant?.videoStream?.getTracks().forEach(track => {
      console.log('Stopping video track:', track.kind);
      track.stop();
    });
    
    localParticipant?.audioStream?.getTracks().forEach(track => {
      console.log('Stopping audio track:', track.kind);
      track.stop();
    });
  } catch (error) {
    console.warn('Error stopping media tracks:', error);
  }
};

export const disableCallDevices = async (call: Call): Promise<void> => {
  try {
    if (call.camera?.enabled) {
      await call.camera.disable();
    }
    if (call.microphone?.enabled) {
      await call.microphone.disable();
    }
  } catch (error) {
    console.warn('Error disabling devices:', error);
  }
};

export const enableCallDevices = async (call: Call): Promise<void> => {
  try {
    await call.camera?.enable();
    await call.microphone?.enable();
  } catch (error) {
    console.warn('Could not enable devices:', error);
    throw error;
  }
};