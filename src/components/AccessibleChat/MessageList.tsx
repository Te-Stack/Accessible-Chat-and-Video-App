// MessageList.tsx - Cleaned and improved version
import React, { useRef, useCallback, memo, useEffect, useState, useMemo } from 'react';
import { useScreenReader } from '../../utils';
import type { AccessibleMessage } from '../../types';
import { MessageItem } from './MessageItem';

import './ChatStyles.css';

interface AccessibleMessageListProps {
  messages: AccessibleMessage[];
  client?: any;
  typingUsers?: string[];
  readReceipts?: Record<string, string[]>;
}


const MessageList: React.FC<AccessibleMessageListProps> = ({ 
  messages, 
  client,
  typingUsers = [],
  readReceipts = {}
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedMessageIndex, setSelectedMessageIndex] = useState<number>(-1);
  const [showSkipButton, setShowSkipButton] = useState<boolean>(false);
  const lastMessageIdRef = useRef<string>('');
  const { announce } = useScreenReader();

  // Announce new messages
  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.id === lastMessageIdRef.current) return;
    
    lastMessageIdRef.current = latestMessage.id || '';
    
    // Don't announce own messages
    if (latestMessage.user.id !== client?.user?.id) {
      const userName = latestMessage.user.name || 'Unknown user';
      const messageText = latestMessage.text || 'sent an attachment';
      announce(`New message from ${userName}: ${messageText}`, 'polite');
    }
  }, [messages, client, announce]);

  // Announce typing indicators
  useEffect(() => {
    if (typingUsers.length === 0) return;
    
    const typingText = typingUsers.length === 1 
      ? `${typingUsers[0]} is typing`
      : `${typingUsers.join(', ')} are typing`;
    announce(typingText, 'polite');
  }, [typingUsers, announce]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const messageElements = listRef.current?.querySelectorAll<HTMLDivElement>('.message-item');
    if (!messageElements || messageElements.length === 0) return;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        setSelectedMessageIndex(prev => {
          const newIndex = Math.max(0, prev === -1 ? messageElements.length - 1 : prev - 1);
          messageElements[newIndex]?.focus();
          messageElements[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          return newIndex;
        });
        break;
        
      case 'ArrowDown':
        event.preventDefault();
        setSelectedMessageIndex(prev => {
          const newIndex = prev === -1 ? 0 : Math.min(messageElements.length - 1, prev + 1);
          messageElements[newIndex]?.focus();
          messageElements[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          return newIndex;
        });
        break;
        
      case 'Home':
        event.preventDefault();
        setSelectedMessageIndex(0);
        messageElements[0]?.focus();
        messageElements[0]?.scrollIntoView({ block: 'start', behavior: 'smooth' });
        break;
        
      case 'End':
        event.preventDefault();
        const lastIndex = messageElements.length - 1;
        setSelectedMessageIndex(lastIndex);
        messageElements[lastIndex]?.focus();
        messageElements[lastIndex]?.scrollIntoView({ block: 'end', behavior: 'smooth' });
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (selectedMessageIndex >= 0 && messages[selectedMessageIndex]) {
          announce(`Selected message from ${messages[selectedMessageIndex].user.name}`, 'polite');
        }
        break;
    }
  }, [selectedMessageIndex, messages, announce]);

  const scrollToEnd = useCallback(() => {
    const lastMessage = listRef.current?.lastElementChild as HTMLElement;
    lastMessage?.scrollIntoView({ behavior: 'smooth' });
    setShowSkipButton(false);
  }, []);

  // Monitor scroll position to show/hide skip button
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowSkipButton(!isNearBottom && messages.length > 0);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages.length]);

  return (
    <div className="accessible-message-list">
      <div 
        aria-live="polite" 
        aria-atomic="false"
        className="sr-only"
        id="message-announcements"
      />
      
      {showSkipButton && (
        <button
          className="skip-to-end-button"
          onClick={scrollToEnd}
          aria-label="Skip to most recent message"
          type="button"
        >
          Jump to latest message
        </button>
      )}
      
      <div
        ref={listRef}
        className="message-list-container"
        role="log"
        aria-label={`Chat messages, ${messages.length} total. Use arrow keys to navigate.`}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-describedby="navigation-help"
      >
        <div id="navigation-help" className="sr-only">
          Use arrow keys to navigate messages, Enter to select, Home and End to jump to first or last message
        </div>
        
        {messages.map((message, index) => (
          <MessageItem 
            key={message.id || `message-${index}`}
            message={message} 
            client={client}
            isSelected={index === selectedMessageIndex}
            onSelect={() => setSelectedMessageIndex(index)}
            readBy={readReceipts[message.id || ''] || []}
          />
        ))}
        
        {typingUsers.length > 0 && (
          <div className="typing-indicator" aria-live="polite" role="status">
            <div className="typing-animation" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="typing-text">
              {typingUsers.length === 1 
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.join(', ')} are typing...`
              }
            </span>
          </div>
        )}
      </div>
    </div>
  );
};






export const AccessibleMessageList = React.memo(MessageList);