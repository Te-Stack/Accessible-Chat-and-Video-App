// MessageInput.tsx - Cleaned and improved version
import React, { useState, useRef, useCallback } from 'react';
import { useScreenReader } from '../../utils/screenReader';
import './ChatStyles.css';
import { DEFAULT_ALLOWED_FILE_TYPES,DEFAULT_MAX_MESSAGE_LENGTH,DEFAULT_MAX_FILE_SIZE} from "../../utils"
interface AccessibleMessageInputProps {
  onSubmit: (message: string, attachments?: File[]) => Promise<void>;
  maxLength?: number;
  maxFileSize?: number;
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


const MessageInput: React.FC<AccessibleMessageInputProps> = ({ 
  onSubmit, 
  maxLength = DEFAULT_MAX_MESSAGE_LENGTH,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  allowedFileTypes = DEFAULT_ALLOWED_FILE_TYPES
}) => {
  const [message, setMessage] = useState<string>('');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<AttachmentUpload[]>([]);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { announce } = useScreenReader();

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors([]);

    if (!message.trim() && attachments.length === 0) {
      const error = { field: 'message', message: 'Message or attachment required' };
      setErrors([error]);
      inputRef.current?.focus();
      announce('Message or attachment required', 'assertive');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(message, attachments.map(a => a.file));
      setMessage('');
      setAttachments([]);
      announce('Message sent successfully', 'polite');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      setErrors([{ field: 'message', message: errorMessage }]);
      announce(errorMessage, 'assertive');
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  }, [message, attachments, onSubmit, announce]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const form = event.currentTarget.closest('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    }
    
    if (event.key === 'Escape') {
      setMessage('');
      setErrors([]);
      announce('Message cleared', 'polite');
    }
  }, [announce]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
    if (errors.length > 0) {
      setErrors([]);
    }
  }, [errors.length]);

  const validateFile = useCallback((file: File): boolean => {
    if (file.size > maxFileSize) {
      announce(
        `File ${file.name} exceeds maximum size of ${maxFileSize / 1024 / 1024}MB`,
        'assertive'
      );
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
      announce(`File type ${fileType} is not allowed`, 'assertive');
      return false;
    }

    return true;
  }, [maxFileSize, allowedFileTypes, announce]);

  const getFileType = (file: File): AttachmentUpload['type'] => {
    const mimeType = file.type.split('/')[0];
    if (['image', 'video', 'audio'].includes(mimeType)) {
      return mimeType as AttachmentUpload['type'];
    }
    return 'file';
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    const validFiles = files.filter(validateFile);

    if (validFiles.length === 0) return;

    const newAttachments = validFiles.map(file => ({
      file,
      type: getFileType(file)
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
    announce(
      `Added ${validFiles.length} attachment${validFiles.length !== 1 ? 's' : ''}`,
      'polite'
    );
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [validateFile, announce]);

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => {
      const newAttachments = [...prev];
      const removed = newAttachments.splice(index, 1)[0];
      announce(`Removed attachment ${removed.file.name}`, 'polite');
      return newAttachments;
    });
  }, [announce]);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

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
            <div key={`${error.field}-${index}`} className="error-message">
              {error.message}
            </div>
          ))}
        </div>
      )}

      {attachments.length > 0 && (
        <div 
          className="attachment-preview" 
          role="list" 
          aria-label={`${attachments.length} selected attachment${attachments.length !== 1 ? 's' : ''}`}
        >
          {attachments.map((attachment, index) => (
            <div 
              key={`${attachment.file.name}-${index}`}
              className="attachment-item"
              role="listitem"
            >
              <span className="attachment-info">
                <span className="attachment-name">{attachment.file.name}</span>
                <span className="attachment-size" aria-label={`Size: ${formatFileSize(attachment.file.size)}`}>
                  ({formatFileSize(attachment.file.size)})
                </span>
              </span>
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
          disabled={(!message.trim() && attachments.length === 0) || isSubmitting || isOverLimit}
          aria-label={isSubmitting ? "Sending message..." : "Send message"}
        >
          {isSubmitting ? 'Sending...' : 'Send'}
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


export const AccessibleMessageInput = React.memo(MessageInput);