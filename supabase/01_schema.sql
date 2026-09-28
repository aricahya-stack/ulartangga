-- Jalankan pertama di Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '', role text not null default 'student' check (role in ('student','teacher','admin')),
  username text unique, created_at timestamptz not null default now()
);
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(), name text not null,
  academic_year text not null, teacher_id uuid references public.profiles(id),
  created_at timestamptz not null default now(), unique(name, academic_year)
);
create table if not exists public.class_members (
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(), primary key(class_id, student_id)
);
create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null default 'local' check(mode in ('local','online')),
  started_at timestamptz not null default now(), finished_at timestamptz,
  status text not null default 'playing' check(status in ('playing','finished','abandoned')),
  final_tile integer not null default 0 check(final_tile between 0 and 50),
  score integer not null default 0 check(score between 0 and 100000),
  correct_answers integer not null default 0, total_answers integer not null default 0,
  winner_name text, room_id uuid
);
create table if not exists public.answer_logs (
  id uuid primary key default gen_random_uuid(), game_session_id uuid not null references public.game_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id text not null, zone text not null, question_type text not null,
  is_correct boolean not null, points integer not null default 0,
  answered_at timestamptz not null default now()
);
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  badge_key text not null check(badge_key in ('first_game','first_win','ten_correct','five_games')),
  awarded_at timestamptz not null default now(), unique(user_id,badge_key)
);
