-- Jalankan setelah 01. Peran admin pertama diangkat manual pada langkah README.
create or replace function public.my_role() returns text language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid())
$$;
create or replace function public.teaches_student(student uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.classes c join public.class_members m on m.class_id=c.id
    where c.teacher_id=(select auth.uid()) and m.student_id=student)
$$;
revoke all on function public.my_role() from public;
revoke all on function public.teaches_student(uuid) from public;
grant execute on function public.my_role(), public.teaches_student(uuid) to authenticated;
create or replace function public.new_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,full_name) values(new.id, left(coalesce(new.raw_user_meta_data->>'full_name',''),80));
  return new;
end $$;
drop trigger if exists auth_profile_created on auth.users;
create trigger auth_profile_created after insert on auth.users for each row execute function public.new_profile();
-- Aman jika sudah ada akun Auth sebelum SQL ini diterapkan.
insert into public.profiles(id,full_name) select id, coalesce(raw_user_meta_data->>'full_name','') from auth.users on conflict(id) do nothing;
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.game_sessions enable row level security;
alter table public.answer_logs enable row level security;
alter table public.badges enable row level security;
create policy profiles_read on public.profiles for select to authenticated using (
 id=(select auth.uid()) or (select public.my_role())='admin' or public.teaches_student(id)
);
create policy classes_read on public.classes for select to authenticated using (
 teacher_id=(select auth.uid()) or (select public.my_role())='admin' or
 exists(select 1 from public.class_members m where m.class_id=id and m.student_id=(select auth.uid()))
);
create policy classes_admin_write on public.classes for all to authenticated using ((select public.my_role())='admin') with check ((select public.my_role())='admin');
create policy members_read on public.class_members for select to authenticated using (
 student_id=(select auth.uid()) or (select public.my_role())='admin' or
 exists(select 1 from public.classes c where c.id=class_id and c.teacher_id=(select auth.uid()))
);
create policy members_admin_write on public.class_members for all to authenticated using ((select public.my_role())='admin') with check ((select public.my_role())='admin');
create policy sessions_read on public.game_sessions for select to authenticated using (
 user_id=(select auth.uid()) or (select public.my_role())='admin' or public.teaches_student(user_id)
);
create policy sessions_insert on public.game_sessions for insert to authenticated with check (
 user_id=(select auth.uid()) and status='playing' and score=0 and total_answers=0 and final_tile=0
);
create policy sessions_update on public.game_sessions for update to authenticated using (user_id=(select auth.uid())) with check (
 user_id=(select auth.uid()) and score>=0 and correct_answers<=total_answers
);
create policy answers_read on public.answer_logs for select to authenticated using (
 user_id=(select auth.uid()) or (select public.my_role())='admin' or public.teaches_student(user_id)
);
create policy answers_insert on public.answer_logs for insert to authenticated with check (
 user_id=(select auth.uid()) and exists(select 1 from public.game_sessions s
 where s.id=game_session_id and s.user_id=(select auth.uid()) and s.status='playing')
);
create policy badges_read on public.badges for select to authenticated using (
 user_id=(select auth.uid()) or (select public.my_role())='admin' or public.teaches_student(user_id)
);
