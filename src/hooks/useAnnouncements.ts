// hooks/useAnnouncements.ts
import { useState, useCallback } from 'react';
import type { Announcement } from '../types/accessibility';

interface AnnouncementHook {
  announcements: Announcement[];
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  clearAnnouncements: () => void;
}

export const useAnnouncements = (): AnnouncementHook => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
    const id = Date.now().toString();
    const newAnnouncement: Announcement = {
      id,
      text: message,
      priority,
      timestamp: new Date()
    };
    
    setAnnouncements(prev => [...prev, newAnnouncement]);

    // Remove announcement after it's been read
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 1000);
  }, []);

  const clearAnnouncements = useCallback((): void => {
    setAnnouncements([]);
  }, []);

  return {
    announcements,
    announce,
    clearAnnouncements
  };
};