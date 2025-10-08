// hooks/useStreamConnection.ts
import { useState, useCallback } from 'react';
import { StreamChat } from 'stream-chat';
import { StreamVideoClient } from '@stream-io/video-react-sdk';
import type { StreamUser, AuthResponse } from '../types';

interface UseStreamConnectionReturn {
  connect: (id: string, name?: string) => Promise<AuthResponse & { 
    chatClient: StreamChat; 
    videoClient: StreamVideoClient 
  }>;
  isConnecting: boolean;
  error: string | null;
}

export const useStreamConnection = (baseUrl: string): UseStreamConnectionReturn => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async (id: string, name?: string) => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const res = await fetch(`${baseUrl}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name }),
      });
      
      if (!res.ok) throw new Error('Authentication failed');
      
      const data: AuthResponse = await res.json();

      const chatClient = StreamChat.getInstance(data.apiKey);
      await chatClient.connectUser(data.user, data.token);

      const videoClient = StreamVideoClient.getOrCreateInstance({ 
        apiKey: data.apiKey, 
        user: data.user, 
        token: data.token 
      });

      return { ...data, chatClient, videoClient };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMsg);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [baseUrl]);

  return { connect, isConnecting, error };
};