// hooks/useAccessibilitySettings.ts
import { useState, useEffect, useCallback } from 'react';
import type { AccessibilitySettings } from '../types/accessibility';

interface AccessibilityHook {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ) => void;
}

export const useAccessibilitySettings = (): AccessibilityHook => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    reducedMotion: false,
    highContrast: false,
    screenReaderEnabled: false,
    keyboardNavigation: false
  });

  useEffect(() => {
    // Detect user preferences
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
    };

    const updateSettings = (): void => {
      setSettings(prev => ({
        ...prev,
        reducedMotion: mediaQueries.reducedMotion.matches,
        highContrast: mediaQueries.highContrast.matches,
        screenReaderEnabled: !!navigator.userAgent.match(/NVDA|JAWS|VoiceOver|TalkBack/i),
        keyboardNavigation: !window.matchMedia('(pointer: fine)').matches
      }));
    };

    updateSettings();

    // Listen for changes
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updateSettings);
    });

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updateSettings);
      });
    };
  }, []);

  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ): void => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  return { settings, updateSetting };
};