// utils/constants.ts
export const DEVICE_ENABLE_DELAY = 500;
export const ERROR_RESET_DELAY = 3000;
export const ANNOUNCEMENT_CLEANUP_DELAY = 1000;
export const MAX_TRANSCRIPTS = 10;

export const DEFAULT_MAX_MESSAGE_LENGTH = 1000;
export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const DEFAULT_ALLOWED_FILE_TYPES = [
  'image/*',
  'video/*',
  'audio/*',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx'
];

export const EMOJI_MAP: Record<string, string> = {
  '😀': 'grinning face',
  '😂': 'face with tears of joy',
  '❤️': 'red heart',
  '👍': 'thumbs up',
  '👎': 'thumbs down',
  '🎉': 'party popper',
  '🔥': 'fire',
  '💯': 'hundred points symbol'
};