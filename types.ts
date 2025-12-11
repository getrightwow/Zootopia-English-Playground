export interface WordData {
  word: string;
  translation: string;
  example: string;
  phonetic?: string;
}

export enum AppMode {
  FLASHCARD = 'FLASHCARD',
  SPELLING = 'SPELLING',
  SPEAKING = 'SPEAKING',
}

export enum TtsAccent {
  US = 'US',
  UK = 'UK',
}

export interface Topic {
  id: string;
  label: string;
  emoji: string;
}