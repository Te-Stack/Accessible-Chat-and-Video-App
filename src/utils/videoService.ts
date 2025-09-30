// videoService.ts
import type { Call } from '@stream-io/video-react-sdk';

interface CreateCallResponse {
  call: {
    id: string;
    type: string;
    settings: any;
  };
}

export const createVideoCall = async (
  userId: string,
  callId: string,
  callType: string = 'default'
): Promise<CreateCallResponse> => {
  const response = await fetch('http://localhost:4000/video/call', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      callId,
      callType,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create video call');
  }

  return response.json();
};

export const joinVideoCall = async (
  client: any,
  callId: string,
  callType: string = 'default'
): Promise<Call> => {
  try {
    const call = client.call(callType, callId);
    await call.getOrCreate();
    return call;
  } catch (error) {
    console.error('Error joining call:', error);
    throw error;
  }
};