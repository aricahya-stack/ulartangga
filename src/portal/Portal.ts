import { db, clean, need, type Profile } from './client';
import { Multiplayer } from '../integrations/Multiplayer';
import type { GameBridge } from '../integrations/GameBridge';
import { defaultBank, validateBank } from './questionBank';
import type { Question } from '../questions/types';

type Session = {id:string;user_id:string;mode:string;score:number;final_tile:number;correct_answers:number;total_answers:number;started_at:string;status:string};
export class Portal {
  private root=document.querySelector<HTMLElement>('#account-portal') ?? document.createElement('div');
  private profile:Profile|null=null;
  private multiplayer:Multiplayer|null=null;
  private bankVersion:number|null=null;
  constructor(private bridge:GameBridge){
    this.root.id='account-portal';if(!this.root.isConnected)document.body.appendChild(this.root);
    this.renderLogin();
    void this.load();
  }
  private message(msg:string){const el=this.root.querySelector('#account-message');if(el)el.textContent=msg;this.bridge.notice(msg);}
  private async load(){
    if(!db){
      this.message('Koneksi akun belum tersedia. Hubungkan proyek Supabase ke Vercel, pastikan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY tersedia, lalu Redeploy.');
      this.root.querySelectorAll<HTMLButtonElement>('#auth-form button, #forgot-btn').forEach(button=>button.disabled=true);
      return;
    }
    const {data}=await db.auth.getUser();
    if(data.user)await this.enter(data.user.id);
    db.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'){this.bridge.userId=null;this.profile=null;this.renderLogin();}else if(event==='PASSWORD_RECOVERY'){this.renderPasswordReset();}else if(event==='SIGNED_IN'&&session?.user)void this.enter(session.user.id);});
  }
  private renderLogin(){
    this.root.classList.remove('hidden','login-loading');
    this.root.innerHTML=`<main class="login-shell"><section class="login-brand" aria-label="Ular Tangga Bahasa Arab">
      <div class="login-logo"><i class="bi bi-dice-5-fill" aria-hidden="true"></i><span>ULAR TANGGA <strong>BAHASA ARAB</strong></span></div>
      <div class="login-brand-content"><span class="login-badge"><i class="bi bi-stars" aria-hidden="true"></i> BELAJAR SAMBIL BERMAIN</span>
      <div class="login-arabic" lang="ar" dir="rtl">هَيَّا نَتَعَلَّمْ</div><h1>Petualangan belajar<br><em>dimulai di sini.</em></h1>
      <p>Jelajahi papan permainan, jawab tantangan Bahasa Arab, dan raih prestasi bersama teman.</p>
      <div class="login-highlights"><span><i class="bi bi-controller" aria-hidden="true"></i> Bermain</span><span><i class="bi bi-book-half" aria-hidden="true"></i> Belajar</span><span><i class="bi bi-trophy-fill" aria-hidden="true"></i> Berprestasi</span></div></div>
      <span class="login-brand-footer">Belajar terasa lebih seru, selangkah demi selangkah.</span>
    </section><section class="login-panel" aria-labelledby="login-title"><div class="login-panel-inner">
      <div class="login-mobile-logo"><i class="bi bi-dice-5-fill" aria-hidden="true"></i> ULAR TANGGA BAHASA ARAB</div>
      <span class="login-eyebrow"><i class="bi bi-person-circle" aria-hidden="true"></i> AKUN PEMAIN</span>
      <h2 id="login-title">Selamat datang!</h2><p class="login-intro">Masuk ke akunmu untuk melanjutkan petualangan.</p>
      <form id="auth-form"><label for="login-email">Alamat email</label><div class="login-input-wrap"><i class="bi bi-envelope" aria-hidden="true"></i><input id="login-email" name="email" type="email" placeholder="nama@email.com" required autocomplete="username" autofocus></div>
      <label for="login-password">Kata sandi</label><div class="login-input-wrap"><i class="bi bi-lock" aria-hidden="true"></i><input id="login-password" name="password" type="password" placeholder="Masukkan kata sandi" required autocomplete="current-password"><button id="password-visibility" type="button" aria-label="Tampilkan kata sandi" aria-pressed="false"><i class="bi bi-eye" aria-hidden="true"></i></button></div>
      <div class="login-help"><button id="forgot-btn" type="button">Lupa kata sandi?</button></div>
      <button class="login-submit" type="submit">Masuk ke permainan <i class="bi bi-arrow-right" aria-hidden="true"></i></button></form>
      <p id="account-message" class="login-message" role="status" aria-live="polite"></p>
      <div class="login-footnote"><i class="bi bi-shield-lock" aria-hidden="true"></i> Akun diberikan oleh admin sekolah.</div>
    </div></section></main>`;
    this.root.querySelector<HTMLFormElement>('#auth-form')!.addEventListener('submit',e=>void this.authenticate(e));
    this.root.querySelector<HTMLButtonElement>('#password-visibility')?.addEventListener('click',()=>{
      const input=this.root.querySelector<HTMLInputElement>('#login-password')!;
      const button=this.root.querySelector<HTMLButtonElement>('#password-visibility')!;
      const visible=input.type==='password';input.type=visible?'text':'password';
      button.setAttribute('aria-label',visible?'Sembunyikan kata sandi':'Tampilkan kata sandi');
      button.setAttribute('aria-pressed',String(visible));
      button.querySelector('i')!.className=visible?'bi bi-eye-slash':'bi bi-eye';
    });
    this.root.querySelector('#forgot-btn')?.addEventListener('click',async()=>{
      if(!db)return;
      const email=this.root.querySelector<HTMLInputElement>('input[name=email]')?.value.trim();
      if(!email){this.message('Isi email terlebih dahulu.');return;}
      const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:location.origin});
      this.message(error?.message||'Jika email terdaftar, tautan pemulihan telah dikirim.');
    });
  }
  private renderPasswordReset(){
    this.root.classList.remove('hidden');
    this.root.innerHTML='<section class="account-card"><h2>Atur kata sandi baru</h2><form id="password-form"><input type="password" required minlength="6" placeholder="Kata sandi baru"><button class="primary">Simpan kata sandi</button></form><p id="account-message" role="status"></p></section>';
    this.root.querySelector('#password-form')?.addEventListener('submit',async e=>{
      e.preventDefault();if(!db)return;
      const password=this.root.querySelector<HTMLInputElement>('#password-form input')!.value;
      const {error}=await db.auth.updateUser({password});
      if(error)this.message(error.message);else {
        const {data}=await db.auth.getUser();
        if(data.user)await this.enter(data.user.id);
      }
    });
  }
  private async authenticate(event:SubmitEvent){
    event.preventDefault();if(!db)return;
    const form=event.currentTarget as HTMLFormElement;
    const input=new FormData(form);
    const email=String(input.get('email')||'');const password=String(input.get('password')||'');
    const button=form.querySelector<HTMLButtonElement>('.login-submit')!;
    button.disabled=true;this.message('Sedang masuk…');
    try{
      const {error}=await db.auth.signInWithPassword({email,password});if(error)throw error;
    }catch(e){this.message(e instanceof Error?e.message:String(e));}
    finally{button.disabled=false;}
  }
  private async enter(id:string){
    if(!db)return;
    const {data,error}=await db.from('profiles').select('*').eq('id',id).single();
    if(error){this.message(`Profil belum tersedia: ${error.message}`);return;}
    this.profile=data as Profile;this.bridge.userId=id;
    await this.loadBank();
    await this.dashboard();
  }
  private async loadBank(){
    if(!db)return;
    const {data,error}=await db.from('question_banks').select('payload,version').eq('key','arabic').maybeSingle();
    if(error){this.message(`Bank soal Supabase tidak terbaca: ${error.message}`);return;}
    if(data){
      try{validateBank(data.payload);this.bridge.questions.setBank(data.payload);this.bankVersion=data.version;}
      catch(e){this.message(`Bank soal invalid: ${String(e)}`);}
    }else{this.bridge.questions.setBank(defaultBank);this.bankVersion=null;}
  }
  private async dashboard(){
    if(!db||!this.profile)return;
    this.root.classList.remove('hidden');
    const p=this.profile;
    const {data:history,error}=await db.from('game_sessions').select('*').eq('user_id',p.id).order('started_at',{ascending:false}).limit(15);
    const {data:badges}=await db.from('badges').select('badge_key').eq('user_id',p.id);
    const badgeNames:Record<string,string>={first_game:'🎲 Permainan pertama',first_win:'🏆 Kemenangan pertama',ten_correct:'📚 10 jawaban benar',five_games:'⭐ 5 permainan'};
    this.root.innerHTML=`<section class="account-card wide"><div class="portal-head"><div><span class="portal-kicker">🐍 ULAR TANGGA BAHASA ARAB</span><h2>Assalamu’alaikum, ${clean(p.full_name||'Pemain')}</h2><p>Peran: ${clean(p.role)}</p></div><button id="logout-btn">Keluar</button></div>
    <div class="portal-actions"><button id="play-btn" class="primary">🎲 Main lokal</button><button id="create-room">🌐 Buat ruang online</button><input id="room-code" placeholder="Kode ruang" maxlength="8" aria-label="Kode ruang"><button id="join-room">Gabung</button></div>
    <p id="account-message" role="status">Undang teman dengan kode ruang untuk pertandingan dua perangkat.</p>
    <div class="portal-grid"><section><h3>Riwayat saya</h3>${error?`<p>${clean(error.message)}</p>`:(history||[]).length?`<div class="scroll-list">${(history as Session[]).map(s=>`<article>${new Date(s.started_at).toLocaleDateString('id-ID')} · ${clean(s.mode||'local')} · ${clean(s.status)} <b>${s.score} poin</b> · ${s.correct_answers}/${s.total_answers} benar</article>`).join('')}</div>`:'<p>Belum ada permainan.</p>'}</section>
    <section><h3>Badge</h3>${(badges||[]).length?(badges||[]).map(b=>`<p>${clean(badgeNames[b.badge_key]||b.badge_key)}</p>`).join(''):'<p>Badge muncul setelah menyelesaikan permainan.</p>'}<h3>Leaderboard</h3><div id="ranking">Pilih kelas untuk melihat peringkat.</div></section></div>
    ${p.role!=='student'?'<section id="staff-area"><h3>Data kelas</h3><div id="staff-content">Memuat…</div></section>':''}
    </section>`;
    this.root.querySelector('#logout-btn')?.addEventListener('click',()=>void db!.auth.signOut());
    this.root.querySelector('#play-btn')?.addEventListener('click',()=>{
      (document.querySelector<HTMLInputElement>('#name-a')!).value=p.full_name||'Pemain A';
      this.root.classList.add('hidden');
    });
    this.root.querySelector('#create-room')?.addEventListener('click',()=>void this.roomAction('create'));
    this.root.querySelector('#join-room')?.addEventListener('click',()=>void this.roomAction('join'));
    void this.ranking();
    if(p.role!=='student')void this.staff();
  }
  private async roomAction(mode:'create'|'join'){
    if(!this.profile)return;
    try{
      if(this.multiplayer)throw Error('Satu ruang aktif per halaman. Muat ulang untuk berganti ruang.');
      await this.loadBank();
      const mp=new Multiplayer(this.bridge,this.profile.id);
      const report=(msg:string)=>{this.message(msg);if(msg.includes('aktif. Anda Pemain'))this.root.classList.add('hidden');};
      if(mode==='create')await mp.create(report);
      else await mp.join((this.root.querySelector<HTMLInputElement>('#room-code')?.value||'').trim(),report);
      this.multiplayer=mp;
    }catch(e){this.message(e instanceof Error?e.message:String(e));}
  }
  private async ranking(){
    if(!db||!this.profile)return;
    const el=this.root.querySelector('#ranking');if(!el)return;
    const {data:members}=await db.from('class_members').select('class_id').eq('student_id',this.profile.id);
    const {data:classes}=await db.from('classes').select('id,name,academic_year');
    const assigned=(classes||[]).filter(c=>this.profile?.role!=='student'||(members||[]).some(m=>m.class_id===c.id));
    if(!assigned.length){el.textContent='Belum terdaftar dalam kelas.';return;}
    el.innerHTML=`<select id="ranking-class" aria-label="Pilih kelas">${assigned.map(c=>`<option value="${c.id}">${clean(c.name)} · ${clean(c.academic_year)}</option>`).join('')}</select><div id="ranking-list"></div>`;
    const show=async()=>{
      const classId=el.querySelector<HTMLSelectElement>('#ranking-class')!.value;
      const {data:people,error}=await db!.rpc('class_leaderboard',{p_class:classId});
      if(error){el.querySelector('#ranking-list')!.textContent=error.message;return;}
      el.querySelector('#ranking-list')!.innerHTML=(people||[]).length?(people||[]).map((x:{full_name:string;best_score:number},i:number)=>`<p>${i+1}. ${clean(x.full_name)} — <b>${x.best_score}</b></p>`).join(''):'Kelas belum memiliki siswa.';
    };
    el.querySelector('#ranking-class')!.addEventListener('change',()=>void show());await show();
  }
  private async staff(){
    if(!db||!this.profile)return;
    const el=this.root.querySelector('#staff-content');if(!el)return;
    const {data:classes}=await db.from('classes').select('id,name,academic_year,teacher_id');
    const {data:profiles}=await db.from('profiles').select('id,full_name,role');
    const {data:members}=await db.from('class_members').select('class_id,student_id');
    const visible=(classes||[]).filter(c=>this.profile?.role==='admin'||c.teacher_id===this.profile?.id);
    const ids=[...new Set((members||[]).filter(m=>visible.some(c=>c.id===m.class_id)).map(m=>m.student_id))];
    let results:Session[]=[];
    if(ids.length){const {data}=await db.from('game_sessions').select('*').in('user_id',ids).order('started_at',{ascending:false}).limit(500);results=(data||[]) as Session[];}
    const {data:answerData}=ids.length?await db.from('answer_logs').select('user_id,zone,is_correct').in('user_id',ids).limit(1000):{data:[]};
    const zoneMap:Record<string,string>={Pedagogik:'Mufradat',Profesional:'Profesi',Kepribadian:'Qawaid',Sosial:'Muhadatsah',Integratif:'Qira’ah'};
    const zoneStats=Object.entries(zoneMap).map(([key,label])=>{
      const items=(answerData||[]).filter(x=>x.zone===key);
      const pct=items.length?`${Math.round(100*items.filter(x=>x.is_correct).length/items.length)}%`:'—';
      return `${label}: ${pct} (${items.length} jawaban)`;
    }).join(' · ');
    el.innerHTML=`<p>${visible.length} kelas · ${ids.length} siswa · ${results.length} hasil terbaru</p>
    <p><b>Akurasi per materi:</b> ${zoneStats}</p>
    ${visible.map(c=>`<article><b>${clean(c.name)} · ${clean(c.academic_year)}</b><br>${(members||[]).filter(m=>m.class_id===c.id).map(m=>{
      const student=(profiles||[]).find(p=>p.id===m.student_id);const scores=results.filter(s=>s.user_id===m.student_id);
      return `${clean(student?.full_name||m.student_id)} (${scores.length} kali; terbaik ${Math.max(0,...scores.map(x=>x.score))})`;}).join(' · ')||'Belum ada siswa'}</article>`).join('')}
    <button id="export-results">Unduh CSV nilai</button>
    <h3>Kelola soal Bahasa Arab</h3><p>Pilih satu soal, ubah isinya, lalu simpan. Perubahan berlaku untuk semua kelas pada permainan baru.</p>
    <form id="edit-question"><select name="questionId" id="select-question">${this.bridge.questions.getBank().map(q=>`<option value="${clean(q.id)}">${clean(q.id)} · ${clean(q.title)}</option>`).join('')}</select><input name="title" placeholder="Judul" required><textarea name="stimulus" placeholder="Stimulus" required></textarea><textarea name="prompt" placeholder="Pertanyaan" required></textarea><textarea name="options" placeholder="Pilihan, satu per baris (MCQ/multi)"></textarea><textarea name="pairs" placeholder="Pasangan: kiri | kanan, satu per baris (match)"></textarea><input name="answer" placeholder="Kunci JSON: 0 / true / [0,2]" required><textarea name="explanation" placeholder="Pembahasan" required></textarea><button>Simpan soal</button></form>
    ${this.profile.role==='admin'?`<h3>Admin</h3><form id="create-account"><input name="name" placeholder="Nama lengkap" required><input name="email" type="email" placeholder="Email" required><input name="password" type="password" placeholder="Kata sandi sementara" required minlength="6"><select name="role"><option value="student">Siswa</option><option value="teacher">Guru</option><option value="admin">Admin</option></select><button>Buat akun</button></form>
    <form id="create-class"><input name="name" placeholder="Kelas, mis. VIII A" required><input name="year" placeholder="2026/2027" required><select name="teacher"><option value="">Pilih guru</option>${(profiles||[]).filter(p=>p.role==='teacher').map(p=>`<option value="${p.id}">${clean(p.full_name)}</option>`).join('')}</select><button>Buat kelas</button></form>
    <form id="add-member"><select name="class">${visible.map(c=>`<option value="${c.id}">${clean(c.name)} ${clean(c.academic_year)}</option>`).join('')}</select><select name="student">${(profiles||[]).filter(p=>p.role==='student').map(p=>`<option value="${p.id}">${clean(p.full_name)}</option>`).join('')}</select><button>Masukkan siswa</button></form>
    <form id="reset-account"><select name="userId">${(profiles||[]).map(p=>`<option value="${p.id}">${clean(p.full_name)} (${clean(p.role)})</option>`).join('')}</select><input name="password" type="password" minlength="6" required placeholder="Kata sandi baru"><button>Reset kata sandi</button></form>`:''}`;
    el.querySelector('#export-results')?.addEventListener('click',()=>{
      const rows=['tanggal,siswa,skor,benar,total,petak,status',...results.map(s=>{
        const name=(profiles||[]).find(p=>p.id===s.user_id)?.full_name||s.user_id;
        return [s.started_at,name,s.score,s.correct_answers,s.total_answers,s.final_tile,s.status].map(x=>`"${String(x).replaceAll('"','""')}"`).join(',');})];
      const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\uFEFF'+rows.join('\n')],{type:'text/csv;charset=utf-8'}));a.download='nilai-ular-tangga.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);
    });
    el.querySelector('#select-question')?.addEventListener('change',()=>this.fillQuestion());
    el.querySelector('#edit-question')?.addEventListener('submit',e=>void this.saveQuestion(e));
    this.fillQuestion();
    el.querySelector('#create-account')?.addEventListener('submit',e=>void this.adminAccount(e));
    el.querySelector('#reset-account')?.addEventListener('submit',e=>void this.adminAccount(e));
    el.querySelector('#create-class')?.addEventListener('submit',e=>void this.adminForm(e,'classes'));
    el.querySelector('#add-member')?.addEventListener('submit',e=>void this.adminForm(e,'class_members'));
  }
  private fillQuestion(){
    const form=this.root.querySelector<HTMLFormElement>('#edit-question');if(!form)return;
    const id=form.querySelector<HTMLSelectElement>('#select-question')?.value;
    const q=this.bridge.questions.getBank().find(x=>x.id===id);if(!q)return;
    const field=(name:string)=>form.elements.namedItem(name) as HTMLInputElement|HTMLTextAreaElement;
    field('title').value=q.title;field('stimulus').value=q.stimulus;field('prompt').value=q.prompt;
    field('options').value=(q.options||[]).join('\n');field('pairs').value=(q.pairs||[]).map(x=>`${x.left} | ${x.right}`).join('\n');
    field('answer').value=JSON.stringify(q.answer);field('explanation').value=q.explanation;
  }
  private async saveQuestion(event:Event){
    event.preventDefault();if(!db||!this.profile)return;
    try{
      const f=new FormData(event.currentTarget as HTMLFormElement);
      const id=String(f.get('questionId'));
      const bank=this.bridge.questions.getBank().map(x=>({...x}));
      const i=bank.findIndex(x=>x.id===id);if(i<0)throw Error('Soal tidak ditemukan.');
      const q:Question=bank[i];
      q.title=String(f.get('title')||'').trim();q.stimulus=String(f.get('stimulus')||'').trim();
      q.prompt=String(f.get('prompt')||'').trim();q.explanation=String(f.get('explanation')||'').trim();
      q.answer=JSON.parse(String(f.get('answer')||'null'));
      if(q.type==='mcq'||q.type==='multi')q.options=String(f.get('options')||'').split('\n').map(s=>s.trim()).filter(Boolean);
      if(q.type==='match')q.pairs=String(f.get('pairs')||'').split('\n').filter(Boolean).map(line=>{
        const parts=line.split('|');return {left:parts[0]?.trim(),right:parts.slice(1).join('|').trim()};
      });
      validateBank(bank);
      const payload={key:'arabic',payload:bank,updated_by:this.profile.id};
      const {data,error}=this.bankVersion===null
        ?await db.from('question_banks').insert(payload).select('version').single()
        :await db.from('question_banks').update(payload).eq('key','arabic').eq('version',this.bankVersion).select('version').maybeSingle();
      if(error)throw error;if(!data)throw Error('Bank berubah di perangkat lain. Muat ulang halaman sebelum menyimpan.');
      this.bankVersion=data.version;this.bridge.questions.setBank(bank);
      this.message(`Soal ${id} tersimpan, versi bank ${data.version}.`);
      await this.staff();
    }catch(e){this.message(e instanceof Error?e.message:String(e));}
  }
  private async adminAccount(event:Event){
    event.preventDefault();if(!db)return;
    const f=new FormData(event.currentTarget as HTMLFormElement);
    const {data}=await db.auth.getSession();
    const reset=(event.currentTarget as HTMLFormElement).id==='reset-account';
    try{
      const response=await fetch('/api/admin-users',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${data.session?.access_token||''}`},body:JSON.stringify(reset?{action:'reset_password',userId:f.get('userId'),password:f.get('password')}:{name:f.get('name'),email:f.get('email'),password:f.get('password'),role:f.get('role')})});
      const body=await response.json();if(!response.ok)throw Error(body.error||'Gagal membuat akun');
      this.message(reset?'Kata sandi diperbarui. Beritahukan sandi baru langsung ke pemilik akun.':'Akun berhasil dibuat.');await this.staff();
    }catch(e){this.message(e instanceof Error?e.message:String(e));}
  }
  private async adminForm(event:Event,table:'classes'|'class_members'){
    event.preventDefault();if(!db)return;
    const f=new FormData(event.currentTarget as HTMLFormElement);
    const {error}=table==='classes'
      ? await db.from('classes').insert({name:f.get('name'),academic_year:f.get('year'),teacher_id:f.get('teacher')||null})
      : await db.from('class_members').insert({class_id:f.get('class'),student_id:f.get('student')});
    if(error)this.message(error.message);else{this.message('Data tersimpan.');await this.staff();}
  }
}
