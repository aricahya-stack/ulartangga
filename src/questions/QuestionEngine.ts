import rawQuestions from '../data/questions.json';
import type { Competency } from '../game/Board';
import { Matching } from './Matching';
import { MultiSelect } from './MultiSelect';
import { SingleChoice } from './SingleChoice';
import { TrueFalse } from './TrueFalse';
import type { AnswerOutcome, AnswerWidget, Question } from './types';
import { zoneName } from '../portal/zone';

const questions = rawQuestions as Question[];

interface QuestionContext {
  playerName: string;
  tile: number;
}

function sameNumbers(a: number[], b: number[]): boolean {
  const aa = [...a].sort((x, y) => x - y);
  const bb = [...b].sort((x, y) => x - y);
  return aa.length === bb.length && aa.every((value, index) => value === bb[index]);
}

export class QuestionEngine {
  private used = new Set<string>();
  private bank: Question[] = [...questions];

  constructor(private readonly overlay: HTMLElement, private readonly card: HTMLElement) {}

  reset() {
    this.used.clear();
  }

  get usedCount() { return this.used.size; }
  setBank(bank: Question[]) { this.bank = bank; this.reset(); }
  getBank() { return [...this.bank]; }

  draw(competency: Competency): Question {
    const all = this.bank.filter((q) => q.competency === competency);
    let candidates = all.filter((q) => !this.used.has(q.id));
    if (!candidates.length) {
      all.forEach((q) => this.used.delete(q.id));
      candidates = [...all];
    }
    const question = candidates[Math.floor(Math.random() * candidates.length)];
    this.used.add(question.id);
    return question;
  }

  async ask(question: Question, eventLabel: string, context: QuestionContext): Promise<AnswerOutcome> {
    const eventKind = this.eventKind(eventLabel);
    const zoneClass = question.competency.toLowerCase();
    const zoneQuestions = this.bank.filter((q) => q.competency === question.competency);
    const zoneUsed = zoneQuestions.filter((q) => this.used.has(q.id)).length;
    const progress = Math.max(10, Math.round((zoneUsed / Math.max(1, zoneQuestions.length)) * 100));

    this.card.className = `question-card modern-question qtype-${question.type} event-${eventKind} zone-card-${zoneClass}`;
    this.card.innerHTML = '';

    const top = document.createElement('div');
    top.className = 'question-modern-top';
    top.innerHTML = `
      <div class="event-emblem" aria-hidden="true">${this.eventIcon(eventKind)}</div>
      <div class="question-title-group">
        <div class="question-kicker">${this.escape(eventLabel)} · PETAK ${context.tile}</div>
        <h2>${this.escape(question.title)}</h2>
        <div class="question-meta-row">
          <span class="meta-chip player-chip">👤 ${this.escape(context.playerName)}</span>
          <span class="meta-chip zone-chip">${this.escape(zoneName[question.competency])}</span>
          <span class="meta-chip type-chip">${this.typeIcon(question.type)} ${this.typeLabel(question.type)}</span>
        </div>
      </div>`;

    const progressWrap = document.createElement('div');
    progressWrap.className = 'question-progress-wrap';
    progressWrap.innerHTML = `
      <div class="question-progress-copy"><span>Bank ${this.escape(zoneName[question.competency])}</span><b>${zoneUsed}/10</b></div>
      <div class="question-progress-track"><span style="width:${progress}%"></span></div>`;

    const stimulus = document.createElement('section');
    stimulus.className = 'stimulus modern-stimulus';
    stimulus.innerHTML = `<div class="section-label">📖 Stimulus Kasus</div><div class="stimulus-copy"></div>`;
    const stimulusCopy = stimulus.querySelector<HTMLElement>('.stimulus-copy')!;
    stimulusCopy.textContent = question.stimulus;

    const prompt = document.createElement('section');
    prompt.className = 'prompt modern-prompt';
    const promptLabel = document.createElement('div');
    promptLabel.className = 'section-label';
    promptLabel.textContent = '🎯 Tantangan';
    const promptText = document.createElement('div');
    promptText.className = 'prompt-copy';
    promptText.textContent = question.prompt;
    prompt.append(promptLabel, promptText);

    const widget = this.createWidget(question);
    widget.element.classList.add('modern-answer-widget');

    const actions = document.createElement('div');
    actions.className = 'question-actions modern-actions';
    const helper = document.createElement('div');
    helper.className = 'answer-helper';
    helper.textContent = this.answerHint(question.type);
    const lockButton = document.createElement('button');
    lockButton.className = 'primary lock-answer-btn';
    lockButton.innerHTML = '<span>🔒</span> Kunci Jawaban';
    lockButton.disabled = true;
    actions.append(helper, lockButton);

    const result = document.createElement('div');
    result.className = 'answer-result modern-result hidden';

    this.card.append(top, progressWrap, stimulus, prompt, widget.element, actions, result);
    this.overlay.classList.remove('hidden');
    this.overlay.classList.add('question-active');
    requestAnimationFrame(() => this.card.classList.add('question-entered'));

    widget.onChange(() => {
      lockButton.disabled = !widget.canSubmit();
      helper.textContent = widget.canSubmit() ? 'Jawaban siap dikunci.' : this.answerHint(question.type);
    });

    const outcome = await new Promise<AnswerOutcome>((resolve) => {
      lockButton.addEventListener('click', () => {
        widget.lock();
        const evaluated = this.evaluate(question, widget.getValue());
        lockButton.remove();
        helper.remove();

        result.className = `answer-result modern-result ${evaluated.fullCorrect ? 'correct' : 'wrong'}`;
        result.innerHTML = `
          <div class="result-hero">
            <span class="result-icon">${evaluated.fullCorrect ? '✓' : '!'}</span>
            <div><strong>${evaluated.fullCorrect ? 'Jawaban Tepat' : 'Belum Sepenuhnya Tepat'}</strong><span>+${evaluated.points} poin</span></div>
          </div>
          <div class="explanation-grid">
            <div class="explanation-panel answer-key-panel"><span class="section-label">🔑 Jawaban</span><p>${this.escape(evaluated.answerText)}</p></div>
            <div class="explanation-panel"><span class="section-label">💡 Pembahasan</span><p>${this.escape(evaluated.explanation)}</p></div>
          </div>`;

        const continueButton = document.createElement('button');
        continueButton.className = 'primary continue-game-btn';
        continueButton.innerHTML = '<span>▶</span> Lanjutkan Permainan';
        actions.appendChild(continueButton);
        result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        continueButton.addEventListener('click', () => {
          this.card.classList.remove('question-entered');
          this.overlay.classList.remove('question-active');
          this.overlay.classList.add('hidden');
          resolve(evaluated);
        }, { once: true });
      }, { once: true });
    });
    return outcome;
  }

  private createWidget(question: Question): AnswerWidget {
    switch (question.type) {
      case 'mcq': return new SingleChoice(question);
      case 'tf': return new TrueFalse(question);
      case 'match': return new Matching(question);
      case 'multi': return new MultiSelect(question);
    }
  }

  private evaluate(question: Question, value: unknown): AnswerOutcome {
    if (question.type === 'mcq') {
      const correct = value === question.answer;
      return { fullCorrect: correct, points: correct ? 100 : 0, answerText: (question.options ?? [])[Number(question.answer)] ?? '', explanation: question.explanation };
    }
    if (question.type === 'tf') {
      const correct = value === question.answer;
      return { fullCorrect: correct, points: correct ? 100 : 0, answerText: question.answer ? 'Benar' : 'Salah', explanation: question.explanation };
    }
    if (question.type === 'multi') {
      const selected = value as number[];
      const correctIndices = question.answer as number[];
      const fullCorrect = sameNumbers(selected, correctIndices);
      const correctPicked = selected.filter((index) => correctIndices.includes(index)).length;
      const wrongPicked = selected.filter((index) => !correctIndices.includes(index)).length;
      const points = fullCorrect ? 150 : Math.max(0, Math.min(120, correctPicked * 40 - wrongPicked * 25));
      return {
        fullCorrect,
        points,
        answerText: correctIndices.map((index) => (question.options ?? [])[index]).join('; '),
        explanation: question.explanation
      };
    }
    const selected = value as string[];
    const pairs = question.pairs ?? [];
    const correctCount = selected.filter((item, index) => item === pairs[index]?.right).length;
    const fullCorrect = correctCount === pairs.length;
    return {
      fullCorrect,
      points: fullCorrect ? 150 : correctCount * 30,
      answerText: pairs.map((p) => `${p.left} → ${p.right}`).join('; '),
      explanation: question.explanation
    };
  }

  private typeLabel(type: Question['type']) {
    return ({ mcq: 'Pilihan Ganda', tf: 'Benar / Salah', match: 'Menjodohkan', multi: 'Jawaban Lebih dari 1' })[type];
  }

  private typeIcon(type: Question['type']) {
    return ({ mcq: '◉', tf: '✓✕', match: '↔', multi: '☑' })[type];
  }

  private answerHint(type: Question['type']) {
    return ({
      mcq: 'Pilih satu jawaban yang paling tepat.',
      tf: 'Tentukan apakah pernyataan benar atau salah.',
      match: 'Pasangkan seluruh bagian sebelum mengunci.',
      multi: 'Pilih semua jawaban yang menurut Anda benar.'
    })[type];
  }

  private eventKind(label: string) {
    const value = label.toLowerCase();
    if (value.includes('ladder')) return 'ladder';
    if (value.includes('snake')) return 'snake';
    if (value.includes('bonus')) return 'bonus';
    if (value.includes('final')) return 'final';
    return 'normal';
  }

  private eventIcon(kind: string) {
    return ({ ladder: '🪜', snake: '🐍', bonus: '⭐', final: '🏆', normal: '❓' } as Record<string, string>)[kind] ?? '❓';
  }

  private escape(value: string) {
    return String(value).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c] ?? c));
  }
}
