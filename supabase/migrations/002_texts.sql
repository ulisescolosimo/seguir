-- Textos (borradores y publicados) del usuario.
-- Ejecutar en el SQL Editor del proyecto Supabase o con supabase db push.

create table if not exists public.texts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Sin título',
  body text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_texts_user_id on public.texts(user_id);
create index if not exists idx_texts_status on public.texts(user_id, status);

alter table public.texts enable row level security;

create policy "Usuario ve sus propios textos"
  on public.texts for select
  using (auth.uid() = user_id);

create policy "Usuario inserta sus propios textos"
  on public.texts for insert
  with check (auth.uid() = user_id);

create policy "Usuario actualiza sus propios textos"
  on public.texts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Usuario elimina sus propios textos"
  on public.texts for delete
  using (auth.uid() = user_id);

-- Actualizar updated_at al modificar
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger texts_updated_at
  before update on public.texts
  for each row execute function public.set_updated_at();

comment on table public.texts is 'Borradores y textos publicados por el usuario.';
