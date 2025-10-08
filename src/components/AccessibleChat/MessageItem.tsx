// components/AccessibleChat/MessageItem.tsx
import React, { useRef, useCallback, useMemo, memo } from 'react';
import type { AccessibleMessage } from '../../types';
import { AttachmentComponent } from './AttachmentComponent';
import { EnhancedText } from './EnhancedText';

interface MessageItemProps {
  message: AccessibleMessage;
  client?: any;
  isSelected?: boolean;
  onSelect?: () => void;
  readBy?: string[];
}

export const MessageItem: React.FC<MessageItemProps> = memo(({ 
  message, 
  client, 
  isSelected, 
  onSelect,
  readBy = []
}) => {
  const messageRef = useRef<HTMLDivElement>(null);
  const isOwn = message.user.id === client?.user?.id;
  
  const createdAt = useMemo(() => 
    message.created_at ? new Date(message.created_at) : null,
    [message.created_at]
  );

  const avatarUrl = useMemo(() => 
    message.user.image || 
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(message.user.name || message.user.id)}`,
    [message.user.image, message.user.name, message.user.id]
  );

  const handleInteraction = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    if ('key' in e && e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    onSelect?.();
  }, [onSelect]);

  return (
    <div
      ref={messageRef}
      className={`message-item ${isOwn ? 'own-message' : 'other-message'} ${isSelected ? 'selected' : ''}`}
      role="article"
      aria-labelledby={`message-${message.id}-author`}
      aria-describedby={`message-${message.id}-content message-${message.id}-time`}
      tabIndex={0}
      onClick={handleInteraction}
      onKeyDown={handleInteraction}
    >
      <div 
        id={`message-${message.id}-author`}
        className="message-author"
        aria-label={`Message from ${message.user.name || message.user.id}`}
      >
        <img 
          src={avatarUrl}
          alt=""
          className="user-avatar"
          aria-hidden="true"
          width="32"
          height="32"
        />
        <span>{message.user.name || message.user.id}</span>
      </div>
      
      <div 
        id={`message-${message.id}-content`}
        className="message-content"
      >
        {message.text && (
          <div className="message-text">
            <EnhancedText text={message.text} messageId={message.id || ''} />
          </div>
        )}
        
        {message.attachments?.map((attachment, index) => (
          <AttachmentComponent 
            key={`${message.id}-attachment-${index}`}
            attachment={attachment}
            messageId={message.id || ''}
          />
        ))}
      </div>
      
      <div className="message-footer">
        <time 
          id={`message-${message.id}-time`}
          className="message-timestamp"
          dateTime={createdAt?.toISOString() || ''}
          aria-label={`Sent at ${createdAt?.toLocaleString() || 'Unknown time'}`}
        >
          {createdAt?.toLocaleTimeString() || ''}
        </time>
        
        {isOwn && (
          <div 
            className="message-status"
            aria-label={readBy.length > 0 ? `Read by ${readBy.join(', ')}` : 'Sent'}
          >
            <span className="read-status" aria-hidden="true">
              {readBy.length > 0 ? '✓✓' : '✓'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';