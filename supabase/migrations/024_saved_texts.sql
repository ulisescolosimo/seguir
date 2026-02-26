-- Textos guardados (bookmark) por el usuario. Solo textos publicados.

create table if not exists public.saved_texts (
  user_id uuid not null references auth.users(id) on delete cascade,
  text_id uuid not null references public.texts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, text_id)
);

create index if not exists idx_saved_texts_user_id on public.saved_texts(user_id);

alter table public.saved_texts enable row level security;

create policy "Usuario ve sus textos guardados"
  on public.saved_texts for select
  using (auth.uid() = user_id);

create policy "Usuario guarda texto"
  on public.saved_texts for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.texts t where t.id = text_id and t.status = 'published')
  );

create policy "Usuario quita texto guardado"
  on public.saved_texts for delete
  using (auth.uid() = user_id);

comment on table public.saved_texts is 'Textos de la comunidad guardados por el usuario (bookmark).';
