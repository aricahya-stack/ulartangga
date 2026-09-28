import type { Question } from '../questions/types';
import original from '../data/questions.json';
export const defaultBank=original as Question[];
const zones=['Pedagogik','Profesional','Kepribadian','Sosial','Integratif'];
export function validateBank(input:unknown): asserts input is Question[]{
  if(!Array.isArray(input)||input.length!==50||new Set(input.map(q=>q?.id)).size!==50)throw Error('Bank harus memuat 50 soal dengan ID unik.');
  for(const zone of zones){
    for(const [kind,total] of Object.entries({mcq:4,tf:2,match:2,multi:2})){
      const group=input.filter(q=>q.competency===zone&&q.type===kind);
      if(group.length!==total)throw Error(`Zona ${zone} harus berisi ${total} soal jenis ${kind}.`);
      for(const q of group){
        if(typeof q.title!=='string'||typeof q.stimulus!=='string'||typeof q.prompt!=='string'||typeof q.explanation!=='string'||!q.prompt.trim())throw Error(`${q.id}: teks soal belum lengkap.`);
        if(kind==='mcq'&&(!Array.isArray(q.options)||q.options.length!==4||!Number.isInteger(q.answer)||q.answer<0||q.answer>3))throw Error(`${q.id}: kunci/opsi pilihan ganda tidak valid.`);
        if(kind==='tf'&&typeof q.answer!=='boolean')throw Error(`${q.id}: kunci benar/salah tidak valid.`);
        if(kind==='multi'&&(!Array.isArray(q.options)||!Array.isArray(q.answer)||!q.answer.length||q.answer.some((i:number)=>!Number.isInteger(i)||i<0||i>=q.options.length)))throw Error(`${q.id}: kunci multi tidak valid.`);
        if(kind==='match'&&(!Array.isArray(q.pairs)||!q.pairs.length||q.pairs.some((p:{left:string;right:string})=>!p.left||!p.right)||new Set(q.pairs.map((p:{left:string;right:string})=>p.right)).size!==q.pairs.length))throw Error(`${q.id}: pasangan tidak valid.`);
      }
    }
  }
}
