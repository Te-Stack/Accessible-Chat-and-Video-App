// components/AccessibleChat/AttachmentComponent.tsx
import React, { useState, useCallback, memo } from 'react';
import type { AccessibleAttachment } from '../../types';
import { formatFileSize } from '../../utils';

interface AttachmentComponentProps {
  attachment: AccessibleAttachment;
  messageId: string;
}

export const AttachmentComponent: React.FC<AttachmentComponentProps> = memo(({ 
  attachment, 
  messageId 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const getAttachmentDescription = useCallback((): string => {
    switch (attachment.type) {
      case 'image':
        return attachment.alt_text || `Image: ${attachment.title || 'Untitled'}`;
      case 'video':
        return `Video: ${attachment.title || 'Untitled'}`;
      case 'audio':
        return `Audio: ${attachment.title || 'Untitled'}`;
      case 'file':
        const sizeText = attachment.file_size ? ` (${formatFileSize(attachment.file_size)})` : '';
        return `File: ${attachment.title || 'Untitled'}${sizeText}`;
      default:
        return attachment.title || 'Attachment';
    }
  }, [attachment]);

  const handleInteraction = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    if ('key' in e && e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (attachment.url) {
      window.open(attachment.url, '_blank', 'noopener,noreferrer');
    }
  }, [attachment.url]);

  if (attachment.type === 'image' && attachment.url) {
    return (
      <div className="message-attachment image-attachment">
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
          {getAttachmentDescription()}
        </div>
      </div>
    );
  }

  const getAttachmentIcon = (): string => {
    switch (attachment.type) {
      case 'video': return '🎥';
      case 'audio': return '🎵';
      default: return '📎';
    }
  };

  return (
    <div 
      className="message-attachment file-attachment"
      role="button"
      tabIndex={0}
      aria-label={`Download ${getAttachmentDescription()}`}
      onKeyDown={handleInteraction}
      onClick={handleInteraction}
    >
      <div className="attachment-icon" aria-hidden="true">
        {getAttachmentIcon()}
      </div>
      <div className="attachment-info">
        <div className="attachment-title">
          {attachment.title || 'Untitled'}
        </div>
        {attachment.file_size && (
          <div className="attachment-meta">
            {formatFileSize(attachment.file_size)}
          </div>
        )}
      </div>
    </div>
  );
});

AttachmentComponent.displayName = 'AttachmentComponent';