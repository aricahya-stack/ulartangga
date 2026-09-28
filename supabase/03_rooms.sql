-- Jalankan setelah 02. Undangan memakai kode 8 karakter.
create table public.rooms (
  id uuid primary key default gen_random_uuid(), code text not null unique,
  player_a uuid not null references public.profiles(id), player_b uuid references public.profiles(id),
  status text not null default 'waiting' check(status in ('waiting','playing','finished')),
  turn_no integer not null default 0, phase text not null default 'roll' check(phase in ('roll','answer')),
  created_at timestamptz not null default now()
);
create table public.room_actions (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.rooms(id) on delete cascade,
  turn_no integer not null, kind text not null check(kind in ('roll','answer','skip')),
  actor_id uuid not null references public.profiles(id), payload jsonb not null,
  created_at timestamptz not null default now(), unique(room_id,turn_no,kind)
);
alter table public.game_sessions add constraint sessions_room_fk foreign key(room_id) references public.rooms(id);
alter table public.rooms enable row level security;
alter table public.room_actions enable row level security;
create policy rooms_read on public.rooms for select to authenticated using (
 player_a=(select auth.uid()) or player_b=(select auth.uid())
);
create policy actions_read on public.room_actions for select to authenticated using (
 exists(select 1 from public.rooms r where r.id=room_id and
 (r.player_a=(select auth.uid()) or r.player_b=(select auth.uid())))
);
-- Klien hanya boleh mengubah ruang dan aksi melalui fungsi terkontrol.
revoke insert, update, delete on public.rooms from anon, authenticated;
revoke insert, update, delete on public.room_actions from anon, authenticated;
create or replace function public.create_room() returns public.rooms language plpgsql security definer set search_path = '' as $$
declare r public.rooms;
begin
 if (select auth.uid()) is null then raise exception 'Login diperlukan'; end if;
 insert into public.rooms(code,player_a)
 values(upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),(select auth.uid())) returning * into r;
 return r;
end $$;
create or replace function public.join_room(invite_code text) returns public.rooms language plpgsql security definer set search_path = '' as $$
declare r public.rooms;
begin
 if (select auth.uid()) is null then raise exception 'Login diperlukan'; end if;
 select * into r from public.rooms where code=upper(trim(invite_code)) for update;
 if not found or r.status<>'waiting' or r.player_a=(select auth.uid()) then
   raise exception 'Kode tidak ditemukan atau ruang sudah terisi';
 end if;
 update public.rooms set player_b=(select auth.uid()),status='playing' where id=r.id returning * into r;
 return r;
end $$;
create or replace function public.post_room_action(p_room uuid,p_kind text,p_payload jsonb default '{}'::jsonb)
returns public.room_actions language plpgsql security definer set search_path = '' as $$
declare r public.rooms; a public.room_actions; expected_actor uuid; p jsonb;
begin
 select * into r from public.rooms where id=p_room for update;
 if not found or r.status<>'playing' then raise exception 'Ruang belum siap'; end if;
 expected_actor:=case when r.turn_no%2=0 then r.player_a else r.player_b end;
 if expected_actor is distinct from (select auth.uid()) then raise exception 'Bukan giliran Anda'; end if;
 if p_kind<>r.phase and not(p_kind='skip' and r.phase='answer') then raise exception 'Tahap giliran tidak sesuai'; end if;
 if p_kind='roll' then
   p:=jsonb_build_object('value',1+floor(random()*6)::integer);
   update public.rooms set phase='answer' where id=r.id;
 elsif p_kind='skip' then
   p:='{}'::jsonb;
   update public.rooms set phase='roll',turn_no=turn_no+1 where id=r.id;
 elsif p_kind='answer' then
   if jsonb_typeof(p_payload->'selection') not in ('array','number','boolean') then
     raise exception 'Jawaban tidak valid';
   end if;
   p:=jsonb_build_object('selection',p_payload->'selection');
   update public.rooms set phase='roll',turn_no=turn_no+1 where id=r.id;
 else raise exception 'Aksi tidak valid'; end if;
 insert into public.room_actions(room_id,turn_no,kind,actor_id,payload)
 values(r.id,r.turn_no,p_kind,(select auth.uid()),p) returning * into a;
 return a;
end $$;
revoke all on function public.create_room(),public.join_room(text),public.post_room_action(uuid,text,jsonb) from public;
grant execute on function public.create_room(),public.join_room(text),public.post_room_action(uuid,text,jsonb) to authenticated;
do $$ begin
  alter publication supabase_realtime add table public.rooms;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.room_actions;
exception when duplicate_object then null; end $$;
