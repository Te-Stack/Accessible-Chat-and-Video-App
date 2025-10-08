// components/AccessibleChat/ChatContainer.tsx
import React, { useRef, useEffect, useCallback, type ReactNode } from 'react';
import { useChatContext } from 'stream-chat-react';
import type { Event } from 'stream-chat';
import { useScreenReader } from '../../utils/screenReader';

import './ChatStyles.css';

interface AccessibleChatContainerProps {
  children: ReactNode;
}


export const AccessibleChatContainer: React.FC<AccessibleChatContainerProps> = ({ children }) => {
  const { client } = useChatContext();
  const { announce } = useScreenReader();
  const chatRegionRef = useRef<HTMLDivElement>(null);

  const handleNewMessage = useCallback((event: Event) => {
    // Access the message directly from the event
    const message = event.message;
    
    if (!message || !client?.user) return;
    
    // Check if it's not from the current user
    if (message.user?.id !== client.user.id) {
      const userName = message.user?.name || message.user?.id || 'Unknown user';
      const messageText = message.text || 'sent an attachment';
      announce(`New message from ${userName}: ${messageText}`, 'polite');
    }
  }, [client?.user, announce]);

  useEffect(() => {
    if (!client) return;

    client.on('message.new', handleNewMessage);
    
    return () => {
      client.off('message.new', handleNewMessage);
    };
  }, [client, handleNewMessage]);

  return (
    <div className="accessible-chat-wrapper">
      <div 
        ref={chatRegionRef}
        className="chat-region"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        aria-relevant="additions"
      >
        {children}
      </div>
    </div>
  );
};

export default React.memo(AccessibleChatContainer);