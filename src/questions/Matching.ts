import type { AnswerWidget, Question } from './types';

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export class Matching implements AnswerWidget {
  element = document.createElement('div');
  private listeners: Array<() => void> = [];
  private selects: HTMLSelectElement[] = [];

  constructor(question: Question) {
    this.element.className = 'match-list';
    const targets = shuffled((question.pairs ?? []).map((p) => p.right));
    (question.pairs ?? []).forEach((pair) => {
      const row = document.createElement('div');
      row.className = 'match-row';
      const left = document.createElement('div');
      left.className = 'match-left';
      left.textContent = pair.left;
      const select = document.createElement('select');
      select.innerHTML = `<option value="">Pilih pasangan…</option>${targets.map((x) => `<option value="${x.replace(/"/g, '&quot;')}">${x}</option>`).join('')}`;
      select.addEventListener('change', () => this.listeners.forEach((fn) => fn()));
      this.selects.push(select);
      row.append(left, select);
      this.element.appendChild(row);
    });
  }

  canSubmit() { return this.selects.every((x) => x.value.length > 0); }
  getValue() { return this.selects.map((x) => x.value); }
  lock() { this.selects.forEach((x) => x.disabled = true); }
  onChange(callback: () => void) { this.listeners.push(callback); }
}
