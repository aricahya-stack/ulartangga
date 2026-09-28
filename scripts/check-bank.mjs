import fs from 'node:fs';
const questions=JSON.parse(fs.readFileSync(new URL('../src/data/questions.json',import.meta.url)));
const zones=['Pedagogik','Profesional','Kepribadian','Sosial','Integratif'];
const expected={mcq:4,tf:2,match:2,multi:2};
if(questions.length!==50||new Set(questions.map(q=>q.id)).size!==50)throw Error('Harus ada 50 soal dengan ID unik');
for(const zone of zones){
 for(const [type,count] of Object.entries(expected)){
  const group=questions.filter(q=>q.competency===zone&&q.type===type);
  if(group.length!==count)throw Error(`${zone}: ${type} harus ${count}, ditemukan ${group.length}`);
  for(const q of group){
   if(!q.stimulus||!q.prompt||!q.explanation)throw Error(`${q.id}: bagian soal belum lengkap`);
   if(type==='mcq'&&(q.options?.length!==4||!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.options.length))throw Error(`${q.id}: opsi/kunci MCQ tidak valid`);
   if(type==='tf'&&typeof q.answer!=='boolean')throw Error(`${q.id}: kunci benar/salah tidak valid`);
   if(type==='multi'&&(!Array.isArray(q.answer)||q.answer.length<1||q.answer.some(i=>!Number.isInteger(i)||i<0||i>=q.options?.length)))throw Error(`${q.id}: kunci multi tidak valid`);
   if(type==='match'&&(!q.pairs?.length||q.pairs.some(pair=>!pair.left||!pair.right)||new Set(q.pairs.map(pair=>pair.right)).size!==q.pairs.length))throw Error(`${q.id}: pasangan tidak valid`);
  }
 }
}
console.log('OK: 50 soal unik, 5 zona × (4 MCQ + 2 TF + 2 match + 2 multi), kunci valid.');
