create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  age int not null check (age between 13 and 19),
  city text not null,
  school_name text not null,
  grade text not null,
  gender text not null,
  pronouns text not null,
  interested_in text not null,
  height_cm int not null check (height_cm between 120 and 230),
  religion text,
  zodiac text,
  dating_intention text not null,
  prompt_title text not null,
  prompt_answer text not null,
  hobbies text[] not null default '{}',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references public.profiles (id) on delete cascade,
  to_user uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (from_user, to_user),
  check (from_user <> to_user)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.likes enable row level security;
alter table public.messages enable row level security;

drop policy if exists "profiles readable by authenticated users" on public.profiles;
create policy "profiles readable by authenticated users"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "users can read likes they are involved in" on public.likes;
create policy "users can read likes they are involved in"
on public.likes
for select
to authenticated
using (auth.uid() = from_user or auth.uid() = to_user);

drop policy if exists "users can create own likes" on public.likes;
create policy "users can create own likes"
on public.likes
for insert
to authenticated
with check (auth.uid() = from_user);

drop policy if exists "users can read their messages" on public.messages;
create policy "users can read their messages"
on public.messages
for select
to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "users can send messages as themselves" on public.messages;
create policy "users can send messages as themselves"
on public.messages
for insert
to authenticated
with check (auth.uid() = sender_id);
