import type { AnswerWidget, Question } from './types';

export class SingleChoice implements AnswerWidget {
  element = document.createElement('div');
  private selected: number | null = null;
  private listeners: Array<() => void> = [];

  constructor(question: Question) {
    this.element.className = 'answer-list';
    (question.options ?? []).forEach((text, index) => {
      const button = document.createElement('button');
      button.className = 'answer-option';
      button.textContent = `${String.fromCharCode(65 + index)}. ${text}`;
      button.addEventListener('click', () => {
        this.selected = index;
        this.element.querySelectorAll('.answer-option').forEach((el) => el.classList.remove('selected'));
        button.classList.add('selected');
        this.listeners.forEach((fn) => fn());
      });
      this.element.appendChild(button);
    });
  }

  canSubmit() { return this.selected !== null; }
  getValue() { return this.selected; }
  lock() { this.element.querySelectorAll('button').forEach((b) => (b as HTMLButtonElement).disabled = true); }
  onChange(callback: () => void) { this.listeners.push(callback); }
}
