// components/AccessibleChat/ChatContainer.tsx (Updated)
import React, { useRef, useEffect, type ReactNode } from 'react';
import { useChatContext } from 'stream-chat-react';
import type { Event } from 'stream-chat';
import { useScreenReader } from '../../utils/screenReader';
import type { AccessibleMessage } from '../../types/stream';

interface AccessibleChatContainerProps {
  children: ReactNode;
}

const AccessibleChatContainer: React.FC<AccessibleChatContainerProps> = ({ children }) => {
  const { client } = useChatContext();
  const { announce } = useScreenReader();
  const chatRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!client) return;

    const handleNewMessage = (event: Event) => {
      const { message } = event as { message: AccessibleMessage };
      
      // Announce new messages to screen readers
      if (message.user.id !== client.user?.id) {
        announce(`New message from ${message.user.name}: ${message.text}`);
      }
    };

    client.on('message.new', handleNewMessage);
    return () => client.off('message.new', handleNewMessage);
  }, [client, announce]);

  return (
    <div 
      className="accessible-chat-container"
      role="main"
      aria-label="Chat Application"
    >
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

export default AccessibleChatContainer;