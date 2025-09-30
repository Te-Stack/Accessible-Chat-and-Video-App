// components/AccessibleChat/MessageInput.tsx
import React, { useState, useRef, useCallback } from 'react';
import './ChatStyles.css';

interface AccessibleMessageInputProps {
  onSubmit: (message: string, attachments?: File[]) => Promise<void>;
  maxLength?: number;
  maxFileSize?: number; // in bytes
  allowedFileTypes?: string[];
}

interface ValidationError {
  field: string;
  message: string;
}

interface AttachmentUpload {
  file: File;
  type: 'image' | 'video' | 'audio' | 'file';
}

const AccessibleMessageInput: React.FC<AccessibleMessageInputProps> = ({ 
  onSubmit, 
  maxLength = 1000,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  allowedFileTypes = ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx', '.xls', '.xlsx']
}) => {
  const [message, setMessage] = useState<string>('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<AttachmentUpload[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors([]);

    if (!message.trim() && attachments.length === 0) {
      setErrors([{ field: 'message', message: 'Message or attachment required' }]);
      inputRef.current?.focus();
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(message, attachments.map(a => a.file));
      setMessage('');
      setAttachments([]);
      // Announce successful send to screen readers
      announceToScreenReader('Message sent successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      setErrors([{ field: 'message', message: errorMessage }]);
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const announceToScreenReader = (message: string): void => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle keyboard shortcuts
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const form = event.currentTarget.closest('form');
      if (form) {
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
      }
    }
    
    // Handle escape to clear message
    if (event.key === 'Escape') {
      setMessage('');
      setErrors([]);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > maxFileSize) {
        announceToScreenReader(`File ${file.name} exceeds maximum size of ${maxFileSize / 1024 / 1024}MB`);
        return false;
      }
      
      const fileType = file.type || '';
      const isAllowed = allowedFileTypes.some(type => {
        if (type.endsWith('/*')) {
          return fileType.startsWith(type.replace('/*', ''));
        }
        return file.name.toLowerCase().endsWith(type);
      });

      if (!isAllowed) {
        announceToScreenReader(`File type ${fileType} is not allowed`);
        return false;
      }

      return true;
    });

    // Add valid files to attachments
    const newAttachments = validFiles.map(file => ({
      file,
      type: file.type.split('/')[0] as AttachmentUpload['type']
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
    announceToScreenReader(`Added ${validFiles.length} attachment${validFiles.length !== 1 ? 's' : ''}`);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [maxFileSize, allowedFileTypes]);

  // Add this function to remove attachments
  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const newAttachments = [...prev];
      const removed = newAttachments.splice(index, 1)[0];
      announceToScreenReader(`Removed attachment ${removed.file.name}`);
      return newAttachments;
    });
  };

  const characterCount = message.length;
  const isOverLimit = characterCount > maxLength;
  const isNearLimit = characterCount > maxLength * 0.9;

  return (
    <form 
      className="accessible-message-input" 
      onSubmit={handleSubmit}
      role="form"
      aria-label="Send message"
    >
      {errors.length > 0 && (
        <div 
          className="error-messages"
          role="alert"
          aria-live="assertive"
        >
          {errors.map((error, index) => (
            <div key={index} className="error-message">
              {error.message}
            </div>
          ))}
        </div>
      )}

      {/* Add attachment preview */}
      {attachments.length > 0 && (
        <div className="attachment-preview" role="list" aria-label="Selected attachments">
          {attachments.map((attachment, index) => (
            <div 
              key={`${attachment.file.name}-${index}`}
              className="attachment-item"
              role="listitem"
            >
              <span>{attachment.file.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                aria-label={`Remove ${attachment.file.name}`}
                className="remove-attachment"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="input-container">
        <label htmlFor="message-input" className="sr-only">
          Type your message
        </label>
        
        <textarea
          id="message-input"
          ref={inputRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
          className={`message-textarea ${isOverLimit ? 'over-limit' : ''}`}
          aria-describedby="message-input-help character-count"
          aria-invalid={errors.length > 0}
          maxLength={maxLength}
          rows={1}
          disabled={isSubmitting}
        />
        
        <div id="message-input-help" className="sr-only">
          Enter to send message, Shift+Enter for new line, Escape to clear
        </div>
      </div>

      <div className="input-actions">
        <button
          type="submit"
          className="send-button"
          disabled={!message.trim() || isSubmitting || isOverLimit}
          aria-label={isSubmitting ? "Sending message..." : "Send message"}
        >
          {isSubmitting ? (
            <span aria-hidden="true">Sending...</span>
          ) : (
            <span aria-hidden="true">Send</span>
          )}
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedFileTypes.join(',')}
          onChange={handleFileSelect}
          className="sr-only"
          aria-label="Add attachment"
          tabIndex={-1}
          id="file-input"
        />
        
        <button
          type="button"
          className="attachment-button"
          aria-label="Add attachment"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSubmitting}
        >
          <span aria-hidden="true">📎</span>
          <span className="sr-only">Add attachment</span>
        </button>
      </div>

      <div className="message-info">
        <div 
          id="character-count"
          className={`character-count ${isNearLimit ? 'warning' : ''} ${isOverLimit ? 'error' : ''}`} 
          aria-live="polite"
          aria-label={`${characterCount} of ${maxLength} characters used`}
        >
          {characterCount}/{maxLength}
        </div>
      </div>
    </form>
  );
};

export default AccessibleMessageInput;