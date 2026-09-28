import type { AnswerWidget, Question } from './types';

export class TrueFalse implements AnswerWidget {
  element = document.createElement('div');
  private selected: boolean | null = null;
  private listeners: Array<() => void> = [];

  constructor(_question: Question) {
    this.element.className = 'answer-list two-col';
    [['✓ Benar', true], ['✕ Salah', false]].forEach(([label, value]) => {
      const button = document.createElement('button');
      button.className = 'answer-option';
      button.textContent = String(label);
      button.addEventListener('click', () => {
        this.selected = Boolean(value);
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
