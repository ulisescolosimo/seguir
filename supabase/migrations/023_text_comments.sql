-- Comentarios en textos publicados de la comunidad.
-- Respeta want_comments y public_comments del autor del texto.

create table if not exists public.text_comments (
  id uuid primary key default gen_random_uuid(),
  text_id uuid not null references public.texts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default '',
  body text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_text_comments_text_id on public.text_comments(text_id);
create index if not exists idx_text_comments_user_id on public.text_comments(user_id);
create index if not exists idx_text_comments_created_at on public.text_comments(text_id, created_at);

alter table public.text_comments enable row level security;

-- Ver comentarios: texto publicado y (autor permite comentarios públicos o soy el autor del texto)
create policy "Ver comentarios en textos publicados"
  on public.text_comments for select
  using (
    exists (
      select 1 from public.texts t
      join public.profiles p on p.id = t.user_id
      where t.id = text_comments.text_id
        and t.status = 'published'
        and (p.public_comments = true or t.user_id = auth.uid())
    )
  );

-- Insertar: usuario autenticado, texto publicado, autor del texto permite comentarios
create policy "Comentar en texto si autor permite"
  on public.text_comments for insert
  with check (
    auth.uid() is not null
    and exists (
      select 1 from public.texts t
      join public.profiles p on p.id = t.user_id
      where t.id = text_id
        and t.status = 'published'
        and p.want_comments = true
    )
    and user_id = auth.uid()
  );

-- Borrar solo el propio comentario
create policy "Borrar propio comentario"
  on public.text_comments for delete
  using (auth.uid() = user_id);

comment on table public.text_comments is 'Comentarios en textos publicados; respeta want_comments y public_comments del autor.';
