// components/Chat/ChatView.tsx
import React, { useState, useCallback } from 'react';
import { Chat } from 'stream-chat-react';
import type { StreamChat } from 'stream-chat';
import { AccessibleChatContainer, AccessibleMessageList, AccessibleMessageInput } from '../AccessibleChat';
import type { AccessibleMessage } from '../../types';
import { DEFAULT_MAX_MESSAGE_LENGTH, DEFAULT_MAX_FILE_SIZE, DEFAULT_ALLOWED_FILE_TYPES } from '../../utils/constants';

interface ChatViewProps {
  chatClient: StreamChat;
  channel: any;
  messages: AccessibleMessage[];
  onSubmit: (message: string, attachments?: File[]) => Promise<void>;
  onBack: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  chatClient,
  channel,
  messages,
  onSubmit,
  onBack
}) => {
  return (
    <section className="chat-section" aria-label="Chat">
      <Chat client={chatClient}>
        <AccessibleChatContainer>
          <AccessibleMessageList 
            messages={messages} 
            client={chatClient} 
          />
          <AccessibleMessageInput 
            onSubmit={onSubmit}
            maxLength={DEFAULT_MAX_MESSAGE_LENGTH}
            maxFileSize={DEFAULT_MAX_FILE_SIZE}
            allowedFileTypes={DEFAULT_ALLOWED_FILE_TYPES}
          />
        </AccessibleChatContainer>
      </Chat>
      <div className="panel-actions">
        <button className="button" onClick={onBack} type="button">
          Back
        </button>
      </div>
    </section>
  );
};