import type { Competency } from '../game/Board';

export type QuestionType = 'mcq' | 'tf' | 'match' | 'multi';
export interface MatchPair { left: string; right: string; }

export interface Question {
  id: string;
  competency: Competency;
  type: QuestionType;
  title: string;
  stimulus: string;
  prompt: string;
  options?: string[];
  answer: number | boolean | number[];
  pairs?: MatchPair[];
  explanation: string;
}

export interface AnswerWidget {
  element: HTMLElement;
  canSubmit(): boolean;
  getValue(): unknown;
  lock(): void;
  onChange(callback: () => void): void;
}

export interface AnswerOutcome {
  fullCorrect: boolean;
  points: number;
  answerText: string;
  explanation: string;
}
