-- Jalankan terakhir. Role admin awal: ikuti perintah satu kali di README.
create or replace function public.set_user_role(p_user uuid,p_role text) returns void language plpgsql security definer set search_path = '' as $$
begin
 if (select public.my_role())<>'admin' then raise exception 'Akses admin diperlukan'; end if;
 if p_role not in ('student','teacher','admin') then raise exception 'Role tidak dikenal'; end if;
 update public.profiles set role=p_role where id=p_user;
end $$;
revoke all on function public.set_user_role(uuid,text) from public;
grant execute on function public.set_user_role(uuid,text) to authenticated;
create or replace function public.award_badges() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if new.status='finished' and (old.status is distinct from 'finished') then
   insert into public.badges(user_id,badge_key) values(new.user_id,'first_game') on conflict do nothing;
   if new.winner_name is not null then
     insert into public.badges(user_id,badge_key) values(new.user_id,'first_win') on conflict do nothing;
   end if;
   if (select count(*) from public.answer_logs where user_id=new.user_id and is_correct)>=10 then
     insert into public.badges(user_id,badge_key) values(new.user_id,'ten_correct') on conflict do nothing;
   end if;
   if (select count(*) from public.game_sessions where user_id=new.user_id and status='finished')>=5 then
     insert into public.badges(user_id,badge_key) values(new.user_id,'five_games') on conflict do nothing;
   end if;
 end if;
 return new;
end $$;
create trigger badge_on_finish after update of status on public.game_sessions
 for each row execute function public.award_badges();
create or replace function public.award_answers_badge() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if new.is_correct and (select count(*) from public.answer_logs where user_id=new.user_id and is_correct)>=10 then
   insert into public.badges(user_id,badge_key) values(new.user_id,'ten_correct') on conflict do nothing;
 end if;
 return new;
end $$;
create trigger badge_on_answer after insert on public.answer_logs
 for each row execute function public.award_answers_badge();
create or replace function public.class_leaderboard(p_class uuid)
returns table(full_name text,best_score integer) language plpgsql stable security definer set search_path = '' as $$
begin
 if not exists(select 1 from public.classes c where c.id=p_class and
  (c.teacher_id=(select auth.uid()) or (select public.my_role())='admin' or
  exists(select 1 from public.class_members m where m.class_id=p_class and m.student_id=(select auth.uid()))))
 then raise exception 'Kelas tidak dapat diakses'; end if;
 return query select p.full_name, coalesce(max(s.score),0)::integer
 from public.class_members m join public.profiles p on p.id=m.student_id
 left join public.game_sessions s on s.user_id=m.student_id and s.status='finished'
 where m.class_id=p_class group by p.id,p.full_name order by 2 desc,p.full_name limit 100;
end $$;
revoke all on function public.class_leaderboard(uuid) from public;
grant execute on function public.class_leaderboard(uuid) to authenticated;
-- Guru/admin dapat mengubah bank soal global; siswa hanya membacanya.
create table public.question_banks (
 key text primary key check(key='arabic'), payload jsonb not null check(jsonb_typeof(payload)='array'),
 version integer not null default 1, updated_by uuid references public.profiles(id),
 updated_at timestamptz not null default now()
);
alter table public.question_banks enable row level security;
create policy bank_read on public.question_banks for select to authenticated using (true);
create policy bank_insert on public.question_banks for insert to authenticated
 with check ((select public.my_role()) in ('teacher','admin') and updated_by=(select auth.uid()));
create policy bank_update on public.question_banks for update to authenticated
 using ((select public.my_role()) in ('teacher','admin'))
 with check ((select public.my_role()) in ('teacher','admin') and updated_by=(select auth.uid()));
create or replace function public.bump_bank_version() returns trigger language plpgsql security definer set search_path = '' as $$
begin new.version:=old.version+1;new.updated_at:=now();return new;end $$;
create trigger bank_version before update on public.question_banks
 for each row execute function public.bump_bank_version();
