import type { GameBridge } from './GameBridge';
import { db, need } from '../portal/client';
import type { Question } from '../questions/types';

type Room = {id:string;code:string;player_a:string;player_b:string|null;status:string;turn_no:number;phase:string};
type Action = {id:number;turn_no:number;kind:'roll'|'answer'|'skip';payload:{value?:number;selection?:number|boolean|number[]|string[]}};
const waitFor=async(selector:string,timeout=45000):Promise<HTMLElement>=>{
  const end=Date.now()+timeout;
  while(Date.now()<end){const el=document.querySelector<HTMLElement>(selector);if(el) return el;await new Promise(r=>setTimeout(r,120));}
  throw Error(`Menunggu ${selector} terlalu lama`);
};
export class Multiplayer {
  room:Room|null=null;
  private index=0;
  private lastId=0;
  private polling=false;
  private applying=false;
  private started=false;
  private liveTimer=0;
  private onState:(s:string)=>void=()=>{};
  constructor(private bridge:GameBridge,private userId:string) {
    const originalRoll=bridge.scene.dice.roll.bind(bridge.scene.dice);
    let forced=0;
    bridge.scene.dice.roll=()=>{
      if (!forced) return originalRoll();
      const value=forced;forced=0;
      const random=Math.random;let first=true;
      Math.random=()=>{if(first){first=false;return (value-0.5)/6;}return random();};
      try{return originalRoll();}finally{Math.random=random;}
    };
    this.forceDice=(value:number)=>{forced=value;};
    const originalDraw=bridge.questions.draw.bind(bridge.questions);
    bridge.questions.draw=(competency)=>{
      const random=Math.random;
      const seed=`${this.room?.id}-${this.currentTurn}-${competency}`;
      let hash=2166136261;
      for(const ch of seed) hash=Math.imul(hash^ch.charCodeAt(0),16777619);
      Math.random=()=>((hash>>>0)%1000000)/1000000;
      try{return originalDraw(competency);}finally{Math.random=random;}
    };
    document.querySelector('#roll-btn')?.addEventListener('click',(event)=>{
      if(!this.room || this.applying) return;
      event.preventDefault();event.stopImmediatePropagation();
      if(this.bridge.turnIndex()!==this.index){this.onState('Tunggu giliran lawan.');return;}
      void this.send('roll',{});
    },true);
    document.addEventListener('click',(event)=>{
      const target=event.target as Element;
      if(!this.room || this.applying || !target.closest('.lock-answer-btn')) return;
      event.preventDefault();event.stopImmediatePropagation();
      if(this.bridge.turnIndex()!==this.index) return;
      const card=document.querySelector('#question-card')!;
      let selection:number|boolean|number[]|string[];
      if(card.classList.contains('qtype-match')) selection=[...card.querySelectorAll<HTMLSelectElement>('.match-row select')].map(x=>x.value);
      else if(card.classList.contains('qtype-multi')) selection=[...card.querySelectorAll<HTMLInputElement>('input:checked')].map(x=>Number(x.value));
      else {const options=[...card.querySelectorAll('.answer-option')];const i=options.findIndex(x=>x.classList.contains('selected'));
        selection=card.classList.contains('qtype-tf') ? i===0 : i;}
      void this.send('answer',{selection});
    },true);
  }
  private forceDice:(n:number)=>void=()=>{};
  private currentTurn=0;
  private async send(kind:'roll'|'answer'|'skip',payload:object){
    if(!db || !this.room) return;
    const {error}=await db.rpc('post_room_action',{p_room:this.room.id,p_kind:kind,p_payload:payload});
    if(error) this.onState(`Aksi gagal: ${error.message}`); else await this.poll();
  }
  async create(onState:(s:string)=>void){
    if(!db) return;
    this.onState=onState;
    const {data,error}=await db.rpc('create_room');this.room=need(data as Room|null,error);
    this.configure();this.onState(`Kode ruang: ${this.room.code}. Kirim kode ini ke lawan.`);
  }
  async join(code:string,onState:(s:string)=>void){
    if(!db) return;
    this.onState=onState;
    const {data,error}=await db.rpc('join_room',{invite_code:code});this.room=need(data as Room|null,error);
    this.configure();this.onState(`Bergabung ke ruang ${this.room.code}.`);await this.poll();
  }
  private configure(){
    if(!this.room || !db)return;
    this.index=this.room.player_a===this.userId?0:1;
    this.bridge.ownPlayerIndex=this.index;
    this.bridge.mode='online';this.bridge.roomId=this.room.id;
    const roomId=this.room.id;
    db.channel(`room:${roomId}`).on('postgres_changes',{event:'*',schema:'public',table:'rooms',filter:`id=eq.${roomId}`},()=>void this.poll())
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'room_actions',filter:`room_id=eq.${roomId}`},()=>void this.poll()).subscribe();
    this.liveTimer=window.setInterval(()=>void this.poll(),1800);
    void this.poll();
  }
  async poll(){
    if(!db || !this.room || this.polling)return;
    this.polling=true;
    try{
      const {data:room,error}=await db.from('rooms').select('*').eq('id',this.room.id).single();
      this.room=need(room as Room|null,error);
      if(this.room.status==='waiting'){this.onState(`Menunggu lawan. Kode: ${this.room.code}`);return;}
      if(!this.started){
        this.started=true;
        (document.querySelector<HTMLInputElement>('#name-a')!).value='Pemain A';
        (document.querySelector<HTMLInputElement>('#name-b')!).value='Pemain B';
        document.querySelector<HTMLButtonElement>('#start-btn')!.click();
        this.onState(`Ruang ${this.room.code} aktif. Anda Pemain ${this.index===0?'A':'B'}.`);
      }
      const {data:actions,error:actionsError}=await db.from('room_actions').select('*')
        .eq('room_id',this.room.id).gt('id',this.lastId).order('id').limit(30);
      if(actionsError) throw actionsError;
      for(const action of actions as Action[]){
        await this.apply(action);this.lastId=action.id;
      }
    }catch(e){this.onState(`Sinkronisasi: ${e instanceof Error?e.message:String(e)}`);}
    finally{this.polling=false;}
  }
  private async apply(action:Action){
    this.currentTurn=action.turn_no;
    if(action.kind==='roll'){
      while(this.bridge.turnIndex()!==action.turn_no%2 || document.querySelector<HTMLButtonElement>('#roll-btn')?.disabled){
        // Tunggu UI siap setelah jawaban sebelumnya.
        await new Promise(r=>setTimeout(r,160));
      }
      this.forceDice(action.payload.value!);
      this.applying=true;document.querySelector<HTMLButtonElement>('#roll-btn')!.click();this.applying=false;
      if(action.turn_no%2===this.index) void this.checkSkippedTurn(action.turn_no);
      return;
    }
    if(action.kind==='skip') return;
    const card=await waitFor('#question-overlay:not(.hidden) .lock-answer-btn');
    const value=action.payload.selection;
    this.applying=true;
    const body=card.closest('#question-card')!;
    if(body.classList.contains('qtype-match')){
      [...body.querySelectorAll<HTMLSelectElement>('.match-row select')].forEach((el,i)=>{
        el.value=(value as string[])[i];el.dispatchEvent(new Event('change',{bubbles:true}));
      });
    }else if(body.classList.contains('qtype-multi')){
      body.querySelectorAll<HTMLInputElement>('.check-option input').forEach((el,i)=>{
        el.checked=(value as number[]).includes(i);el.dispatchEvent(new Event('change',{bubbles:true}));
      });
    }else{
      const i=body.classList.contains('qtype-tf') ? (value===true?0:1) : Number(value);
      body.querySelectorAll<HTMLButtonElement>('.answer-option')[i]?.click();
    }
    (card as HTMLButtonElement).click();
    this.applying=false;
    if(action.turn_no%2!==this.index){
      const cont=await waitFor('#question-overlay:not(.hidden) .continue-game-btn');
      cont.click();
    }
  }
  private async checkSkippedTurn(turnNo:number){
    const previous=turnNo%2;
    for(let i=0;i<240;i++){
      if(this.bridge.turnIndex()!==previous){
        if(!document.querySelector('#question-overlay:not(.hidden)'))await this.send('skip',{});
        return;
      }
      if(document.querySelector('#question-overlay:not(.hidden)'))return;
      await new Promise(r=>setTimeout(r,150));
    }
  }
  close(){if(this.liveTimer)clearInterval(this.liveTimer);}
}
