// Enhanced AccessibleChat components with full accessibility features

// components/AccessibleChat/MessageList.tsx - Enhanced version
import React, { useRef, useCallback, memo, useEffect, useState } from 'react';
import type { AccessibleMessage } from '../../types/stream';
import type { AccessibleAttachment } from '../../types/accessibility';
import './ChatStyles.css';

interface AccessibleMessageListProps {
  messages: AccessibleMessage[];
  client?: any;
  typingUsers?: string[];
  readReceipts?: Record<string, string[]>;
}

interface MessageItemProps {
  message: AccessibleMessage;
  client?: any;
  isSelected?: boolean;
  onSelect?: () => void;
}

interface AccessibleAttachmentProps {
  attachment: AccessibleAttachment;
  messageId: string;
}

const AccessibleMessageList: React.FC<AccessibleMessageListProps> = ({ 
  messages, 
  client,
  typingUsers = [],
  readReceipts = {},
  ...props 
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedMessageIndex, setSelectedMessageIndex] = useState<number>(-1);
  const [skipToEndButton, setSkipToEndButton] = useState<boolean>(false);
  const lastMessageRef = useRef<string>('');

  // Announce new messages with aria-live
  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (latestMessage && latestMessage.id !== lastMessageRef.current) {
      lastMessageRef.current = latestMessage.id || '';
      
      // Don't announce own messages
      if (latestMessage.user.id !== client?.user?.id) {
        announceToScreenReader(
          `New message from ${latestMessage.user.name}: ${latestMessage.text}`
        );
      }
    }
  }, [messages, client]);

  // Announce typing indicators
  useEffect(() => {
    if (typingUsers.length > 0) {
      const typingText = typingUsers.length === 1 
        ? `${typingUsers[0]} is typing`
        : `${typingUsers.join(', ')} are typing`;
      announceToScreenReader(typingText, 'polite');
    }
  }, [typingUsers]);

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'assertive') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  };

  // Enhanced keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const messageElements = listRef.current?.querySelectorAll<HTMLDivElement>('.message-item');
    if (!messageElements) return;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        setSelectedMessageIndex(prev => {
          const newIndex = Math.max(0, prev - 1);
          messageElements[newIndex]?.focus();
          messageElements[newIndex]?.scrollIntoView({ block: 'nearest' });
          return newIndex;
        });
        break;
        
      case 'ArrowDown':
        event.preventDefault();
        setSelectedMessageIndex(prev => {
          const newIndex = Math.min(messageElements.length - 1, prev + 1);
          messageElements[newIndex]?.focus();
          messageElements[newIndex]?.scrollIntoView({ block: 'nearest' });
          return newIndex;
        });
        break;
        
      case 'Home':
        event.preventDefault();
        setSelectedMessageIndex(0);
        messageElements[0]?.focus();
        messageElements[0]?.scrollIntoView({ block: 'start' });
        break;
        
      case 'End':
        event.preventDefault();
        const lastIndex = messageElements.length - 1;
        setSelectedMessageIndex(lastIndex);
        messageElements[lastIndex]?.focus();
        messageElements[lastIndex]?.scrollIntoView({ block: 'end' });
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        // Handle message interaction (e.g., reply, react)
        if (selectedMessageIndex >= 0) {
          announceToScreenReader(`Selected message from ${messages[selectedMessageIndex]?.user.name}`);
        }
        break;
    }
  }, [selectedMessageIndex, messages]);

  const scrollToEnd = useCallback(() => {
    const lastMessage = listRef.current?.lastElementChild as HTMLElement;
    lastMessage?.scrollIntoView({ behavior: 'smooth' });
    setSkipToEndButton(false);
  }, []);

  // Enhanced Message Item with full accessibility
  const MessageItem: React.FC<MessageItemProps> = memo(({ message, client, isSelected, onSelect }) => {
    const messageRef = useRef<HTMLDivElement>(null);
    const isOwn = message.user.id === client?.user?.id;
    const createdAt = message.created_at ? new Date(message.created_at) : null;
    const messageReadBy = readReceipts[message.id || ''] || [];

    return (
      <div
        ref={messageRef}
        className={`message-item ${isOwn ? 'own-message' : 'other-message'} ${isSelected ? 'selected' : ''}`}
        role="article"
        aria-labelledby={`message-${message.id}-author`}
        aria-describedby={`message-${message.id}-content message-${message.id}-time message-${message.id}-status`}
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect?.();
          }
        }}
      >
        <div 
          id={`message-${message.id}-author`}
          className="message-author"
          aria-label={`Message from ${message.user.name}`}
        >
          <img 
            src={message.user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${message.user.name}`}
            alt=""
            className="user-avatar"
            aria-hidden="true"
          />
          {message.user.name}
        </div>
        
        <div 
          id={`message-${message.id}-content`}
          className="message-content"
        >
          {message.text && (
            <div className="message-text">
              {enhanceTextWithEmoji(message.text, message.id || '')}
            </div>
          )}
          
          {message.attachments?.map((attachment: AccessibleAttachment) => (
            <AccessibleAttachmentComponent 
              key={attachment.id} 
              attachment={attachment}
              messageId={message.id || ''}
            />
          ))}
        </div>
        
        <div className="message-footer">
          <time 
            id={`message-${message.id}-time`}
            className="message-timestamp"
            dateTime={createdAt ? createdAt.toISOString() : ''}
            aria-label={`Sent at ${createdAt ? createdAt.toLocaleString() : 'Unknown time'}`}
          >
            {createdAt ? createdAt.toLocaleTimeString() : ''}
          </time>
          
          {/* Read receipts */}
          <div 
            id={`message-${message.id}-status`}
            className="message-status"
            aria-label={messageReadBy.length > 0 ? `Read by ${messageReadBy.join(', ')}` : 'Sent'}
          >
            {isOwn && (
              <span className="read-status" aria-hidden="true">
                {messageReadBy.length > 0 ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  });

  // Enhanced text processing for emoji alt text
  const enhanceTextWithEmoji = (text: string, messageId: string): React.ReactNode => {
    const emojiMap: Record<string, string> = {
      '😀': 'grinning face',
      '😂': 'face with tears of joy',
      '❤️': 'red heart',
      '👍': 'thumbs up',
      '👎': 'thumbs down',
      '🎉': 'party popper',
      '🔥': 'fire',
      '💯': 'hundred points symbol'
    };

    const parts = text.split(/([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u);
    
    return parts.map((part, index) => {
      if (emojiMap[part]) {
        return (
          <span key={`${messageId}-emoji-${index}`} role="img" aria-label={emojiMap[part]}>
            {part}
          </span>
        );
      }
      return <span key={`${messageId}-text-${index}`}>{part}</span>;
    });
  };

  return (
    <div className="accessible-message-list">
      {/* Live region for announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="false"
        className="sr-only"
        id="message-announcements"
      />
      
      {skipToEndButton && (
        <button
          className="skip-to-end-button"
          onClick={scrollToEnd}
          aria-label="Skip to most recent message"
        >
          Jump to latest message ({messages.length - selectedMessageIndex - 1} new)
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
            key={message.id} 
            message={message} 
            client={client}
            isSelected={index === selectedMessageIndex}
            onSelect={() => setSelectedMessageIndex(index)}
          />
        ))}
        
        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="typing-indicator" aria-live="polite">
            <div className="typing-animation">
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

// Enhanced Accessible attachment component
const AccessibleAttachmentComponent: React.FC<AccessibleAttachmentProps> = ({ 
  attachment, 
  messageId 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const getAttachmentDescription = (attachment: AccessibleAttachment): string => {
    switch (attachment.type) {
      case 'image':
        return attachment.alt_text || `Image: ${attachment.title || 'Untitled'}`;
      case 'video':
        return `Video: ${attachment.title || 'Untitled'}`;
      case 'file':
        const sizeText = attachment.file_size ? ` (${formatFileSize(attachment.file_size)})` : '';
        return `File: ${attachment.title || 'Untitled'}${sizeText}`;
      case 'audio':
        return `Audio: ${attachment.title || 'Untitled'}`;
      default:
        return attachment.title || 'Attachment';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Handle attachment download/view
      window.open(attachment.url, '_blank');
    }
  };

  if (attachment.type === 'image') {
    return (
      <div 
        className="message-attachment image-attachment"
        key={`${messageId}-${attachment.title || 'image'}-${attachment.url}`}>
        <img
          src={attachment.url}
          alt={attachment.alt_text || ''}
          className="message-image"
          loading="lazy"
          role={attachment.alt_text ? 'img' : 'presentation'}
          aria-describedby={`${messageId}-image-desc`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(false)}
        />
        {!imageLoaded && (
          <div className="image-placeholder" aria-hidden="true">
            Loading image...
          </div>
        )}
        <div id={`${messageId}-image-desc`} className="sr-only">
          {getAttachmentDescription(attachment)}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="message-attachment file-attachment"
      role="button"
      tabIndex={0}
      aria-label={`Download ${getAttachmentDescription(attachment)}`}
      onKeyDown={handleKeyDown}
      onClick={() => window.open(attachment.url, '_blank')}
      key={`${messageId}-${attachment.title || 'file'}-${attachment.url}`}
    >
      <div className="attachment-icon" aria-hidden="true">
        {attachment.type === 'video' ? '🎥' : 
         attachment.type === 'audio' ? '🎵' : '📎'}
      </div>
      <div className="attachment-info">
        <div className="attachment-title">
          {attachment.title || 'Untitled'}
        </div>
        <div className="attachment-meta">
          {attachment.file_size && formatFileSize(attachment.file_size)}
        </div>
      </div>
    </div>
  );
};

export default AccessibleMessageList;