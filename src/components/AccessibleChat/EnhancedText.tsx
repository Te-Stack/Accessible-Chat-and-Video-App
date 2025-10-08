// components/AccessibleChat/EnhancedText.tsx
import React, { useMemo, memo } from 'react';
import { EMOJI_MAP } from '../../utils/constants';

interface EnhancedTextProps {
  text: string;
  messageId: string;
}

export const EnhancedText: React.FC<EnhancedTextProps> = memo(({ text, messageId }) => {
  const parts = useMemo(() => {
    return text.split(/([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u);
  }, [text]);
  
  return (
    <>
      {parts.map((part, index) => {
        if (EMOJI_MAP[part]) {
          return (
            <span key={`${messageId}-emoji-${index}`} role="img" aria-label={EMOJI_MAP[part]}>
              {part}
            </span>
          );
        }
        return <span key={`${messageId}-text-${index}`}>{part}</span>;
      })}
    </>
  );
});

EnhancedText.displayName = 'EnhancedText';