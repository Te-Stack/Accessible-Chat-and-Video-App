// types/app.ts - Application-specific types
import type { StreamChat } from 'stream-chat';
import type { StreamVideoClient, Call } from '@stream-io/video-react-sdk';
import type { StreamUser } from './stream';

export type View = 'hub' | 'chat-select' | 'chat' | 'meeting';
export type AuthMode = 'signup' | 'signin';

export interface AppState {
  chatClient: StreamChat | null;
  videoClient: StreamVideoClient | null;
  channel: any;
  call: Call | null;
  user: StreamUser | null;
  loading: boolean;
  error: string | null;
}

export interface MeetingState {
  id: string;
  call: Call | null;
}

export interface Credentials {
  id: string;
  name: string;
}

export interface AuthResponse {
  apiKey: string;
  user: StreamUser;
  token: string;
}