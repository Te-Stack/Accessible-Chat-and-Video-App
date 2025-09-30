// types/stream.ts
import { type User, type Message } from 'stream-chat';
import { Call, type StreamVideoParticipant } from '@stream-io/video-react-sdk';
import type { AccessibleAttachment } from './accessibility';

export interface StreamUser extends User {
  id: string;
  name: string;
  image?: string;
}

export interface AccessibleMessage extends Message {
  user: StreamUser;
  attachments?: AccessibleAttachment[];
  created_at?: string | Date;
}

export interface StreamConfig {
  apiKey: string;
  options: {
    timeout: number;
    logger: (logLevel: string, message: string, extraData?: any) => void;
  };
}

export interface AccessibleParticipantProps {
  participant: StreamVideoParticipant;
  isLocal: boolean;
  onFocus: () => void;
}

export interface VideoControlsProps {
  call: Call;
  onToggleFullscreen: () => void;
}