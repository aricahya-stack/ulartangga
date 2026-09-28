import { createClient } from '@supabase/supabase-js';
export default async function handler(req:any,res:any){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const url=process.env.SUPABASE_URL;
  const publishable=process.env.SUPABASE_PUBLISHABLE_KEY;
  const secret=process.env.SUPABASE_SECRET_KEY;
  if(!url||!publishable||!secret)return res.status(503).json({error:'Konfigurasi server belum lengkap'});
  const token=String(req.headers.authorization||'').replace(/^Bearer /,'');
  if(!token)return res.status(401).json({error:'Login diperlukan'});
  const browser=createClient(url,publishable,{auth:{persistSession:false},global:{headers:{Authorization:`Bearer ${token}`}}});
  const {data:{user},error:authError}=await browser.auth.getUser(token);
  if(authError||!user)return res.status(401).json({error:'Sesi tidak sah'});
  const {data:profile,error:roleError}=await browser.from('profiles').select('role').eq('id',user.id).single();
  if(roleError||profile?.role!=='admin')return res.status(403).json({error:'Akses admin diperlukan'});
  const {email,password,name,role,action,userId}=req.body||{};
  const admin=createClient(url,secret,{auth:{persistSession:false}});
  if(action==='reset_password'){
    if(typeof userId!=='string'||typeof password!=='string'||password.length<6)return res.status(400).json({error:'Data reset tidak valid'});
    const {error}=await admin.auth.admin.updateUserById(userId,{password});
    if(error)return res.status(400).json({error:error.message});
    return res.status(200).json({ok:true});
  }
  if(typeof email!=='string'||typeof password!=='string'||password.length<6||typeof name!=='string'||
    !['student','teacher','admin'].includes(role))return res.status(400).json({error:'Data akun tidak valid'});
  const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:name.slice(0,80)}});
  if(error||!data.user)return res.status(400).json({error:error?.message||'Gagal membuat akun'});
  const {error:upErr}=await admin.from('profiles').update({role}).eq('id',data.user.id);
  if(upErr)return res.status(500).json({error:`Akun dibuat tetapi role belum diatur: ${upErr.message}`});
  return res.status(201).json({id:data.user.id});
}
