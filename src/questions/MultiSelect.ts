import type { AnswerWidget, Question } from './types';

export class MultiSelect implements AnswerWidget {
  element = document.createElement('div');
  private listeners: Array<() => void> = [];

  constructor(question: Question) {
    this.element.className = 'answer-list';
    (question.options ?? []).forEach((text, index) => {
      const label = document.createElement('label');
      label.className = 'check-option';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = String(index);
      input.addEventListener('change', () => this.listeners.forEach((fn) => fn()));
      const span = document.createElement('span');
      span.textContent = `${String.fromCharCode(65 + index)}. ${text}`;
      label.append(input, span);
      this.element.appendChild(label);
    });
  }

  canSubmit() { return this.element.querySelectorAll('input:checked').length > 0; }
  getValue() { return [...this.element.querySelectorAll<HTMLInputElement>('input:checked')].map((x) => Number(x.value)); }
  lock() { this.element.querySelectorAll('input').forEach((x) => (x as HTMLInputElement).disabled = true); }
  onChange(callback: () => void) { this.listeners.push(callback); }
}
