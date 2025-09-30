// types/accessibility.ts
export interface Announcement {
    id: string;
    text: string;
    priority: 'polite' | 'assertive';
    timestamp: Date;
  }
  
  export interface AccessibilitySettings {
    reducedMotion: boolean;
    highContrast: boolean;
    screenReaderEnabled: boolean;
    keyboardNavigation: boolean;
  }
  
  export interface FocusManager {
    saveFocus: () => void;
    restoreFocus: () => void;
    manageFocus: (element: HTMLElement | null) => void;
    trapFocus: (container: HTMLElement | null) => (() => void) | void;
  }
  
  export interface MediaState {
    hasAudio: boolean;
    hasVideo: boolean;
    isLocal: boolean;
  }
  
  export interface AccessibleAttachment {
    id?: string;
    asset_url?: string;
    file_size?: number;
    mime_type?: string;
    title?: string;
    type: 'image' | 'video' | 'audio' | 'file';
    url?: string;
    alt_text?: string;
  }