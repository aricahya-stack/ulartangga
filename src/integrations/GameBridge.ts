import type { GameManager } from '../game/GameManager';
import type { GameScene } from '../scene/GameScene';
import type { QuestionEngine } from '../questions/QuestionEngine';
import type { Question, AnswerOutcome } from '../questions/types';
import { db } from '../portal/client';

type Hook = (question: Question, answer: AnswerOutcome, playerIndex: number) => void;
export class GameBridge {
  onAnswer: Hook | null = null;
  onStart: (() => void) | null = null;
  onWin: (() => void) | null = null;
  sessionId: string | null = null;
  readonly startedAt = new Date();
  userId: string | null = null;
  mode: 'local'|'online' = 'local';
  roomId: string | null = null;
  ownPlayerIndex = 0;
  constructor(readonly game: GameManager, readonly scene: GameScene, readonly questions: QuestionEngine) {
    const originalStart = game.start.bind(game);
    game.start = (a,b) => { originalStart(a,b); void this.createSession(); this.onStart?.(); };
    const originalAsk = questions.ask.bind(questions);
    questions.ask = async (q,label,context) => {
      const index = this.turnIndex();
      const outcome = await originalAsk(q,label,context);
      this.onAnswer?.(q,outcome,index);
      void this.saveAnswer(q,outcome,index);
      return outcome;
    };
    new MutationObserver(() => {
      if (!document.querySelector('#win-overlay:not(.hidden)')) return;
      this.onWin?.();
      void this.finish();
    }).observe(document.querySelector('#win-overlay')!, {attributes:true,attributeFilter:['class']});
  }
  turnIndex(): number { return (this.game as unknown as {turns:{current:number}}).turns.current; }
  async createSession() {
    if (!db || !this.userId) return;
    this.sessionId=null;
    const {data,error}=await db.from('game_sessions').insert({user_id:this.userId, mode:this.mode, room_id:this.roomId}).select('id').single();
    if (error) { this.notice(`Gagal membuat sesi: ${error.message}`); return; }
    this.sessionId=data.id;
  }
  async saveAnswer(q: Question,outcome:AnswerOutcome,index:number) {
    if (!db || !this.userId || index!==this.ownPlayerIndex) return;
    if (!this.sessionId) { await new Promise(resolve=>setTimeout(resolve,450)); }
    if (!this.sessionId) return;
    const {error}=await db.from('answer_logs').insert({game_session_id:this.sessionId,user_id:this.userId,
      question_id:q.id,zone:q.competency,question_type:q.type,is_correct:outcome.fullCorrect,points:outcome.points});
    if (error) this.notice(`Jawaban belum tersimpan: ${error.message}`);
    await this.saveProgress();
  }
  async saveProgress() {
    if (!db || !this.sessionId) return;
    const p=this.game.players[this.ownPlayerIndex];
    const {error}=await db.from('game_sessions').update({final_tile:p.position,score:p.score,
      correct_answers:p.correct,total_answers:p.answered}).eq('id',this.sessionId);
    if (error) this.notice(`Progres belum tersimpan: ${error.message}`);
  }
  async finish() {
    if (!db || !this.sessionId) return;
    await new Promise(resolve=>setTimeout(resolve,150));
    const p=this.game.players[this.ownPlayerIndex];
    const won=p.position===50;
    const {error}=await db.from('game_sessions').update({status:'finished',finished_at:new Date().toISOString(),
      final_tile:p.position,score:p.score,correct_answers:p.correct,total_answers:p.answered,
      winner_name: won ? p.name : null}).eq('id',this.sessionId);
    if(error) this.notice(`Hasil akhir belum tersimpan: ${error.message}`);
    else this.notice('Hasil permainan tersimpan.');
  }
  notice(s:string) { const target=document.querySelector('#portal-status'); if(target) target.textContent=s; }
}
