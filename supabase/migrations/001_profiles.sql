-- Perfil de usuario: prefs de onboarding y datos extendidos.
-- Ejecutar en el SQL Editor del proyecto Supabase.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  onboarding_completed boolean not null default false,
  start_mode text not null default 'zero' check (start_mode in ('zero', 'prompts')),
  reminders_per_week smallint not null default 1 check (reminders_per_week >= 0 and reminders_per_week <= 3),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Usuario ve y actualiza su propio perfil"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

comment on table public.profiles is 'Preferencias de usuario (onboarding) y datos de perfil.';
