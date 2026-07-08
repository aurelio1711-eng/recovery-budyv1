-- Recovery Buddy — Supabase Schema Migration
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)

-- 1. Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Program groups
create table if not exists public.program_groups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id text not null,
  name text not null,
  required integer not null default 0,
  completed integer not null default 0,
  category text not null,
  recurring boolean default false,
  note text,
  custom boolean default false,
  time text,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, group_id)
);

alter table public.program_groups enable row level security;

create policy "Users can view own groups"
  on public.program_groups for select
  using (auth.uid() = user_id);

create policy "Users can insert own groups"
  on public.program_groups for insert
  with check (auth.uid() = user_id);

create policy "Users can update own groups"
  on public.program_groups for update
  using (auth.uid() = user_id);

create policy "Users can delete own groups"
  on public.program_groups for delete
  using (auth.uid() = user_id);

-- 3. Check-ins
create table if not exists public.check_ins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id text not null,
  date date not null,
  notes text default '',
  timestamp bigint not null default extract(epoch from now())::bigint * 1000,
  signature_path text,
  created_at timestamptz default now()
);

-- Index for fast lookups by user + date
create index if not exists idx_check_ins_user_date on public.check_ins(user_id, date);

alter table public.check_ins enable row level security;

create policy "Users can view own check-ins"
  on public.check_ins for select
  using (auth.uid() = user_id);

create policy "Users can insert own check-ins"
  on public.check_ins for insert
  with check (auth.uid() = user_id);

create policy "Users can update own check-ins"
  on public.check_ins for update
  using (auth.uid() = user_id);

create policy "Users can delete own check-ins"
  on public.check_ins for delete
  using (auth.uid() = user_id);

-- 4. Settings
create table if not exists public.settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade unique,
  start_date date not null default current_date,
  notifications boolean default true,
  program_start_date date not null default current_date,
  last_pass_date date,
  pass_history jsonb default '[]'::jsonb,
  pass_history_labels jsonb default '[]'::jsonb,
  reminder_time time default '09:00',
  reminder_days jsonb default '[1,2,3,4,5,6,0]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.settings enable row level security;

create policy "Users can view own settings"
  on public.settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.settings for update
  using (auth.uid() = user_id);

create policy "Users can delete own settings"
  on public.settings for delete
  using (auth.uid() = user_id);

-- 5. Storage bucket for signatures
insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', false)
on conflict (id) do nothing;

-- Allow authenticated users to upload/read their own signatures
create policy "Users can upload own signatures"
  on storage.objects for insert
  with check (
    auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view own signatures"
  on storage.objects for select
  using (
    auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own signatures"
  on storage.objects for delete
  using (
    auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
