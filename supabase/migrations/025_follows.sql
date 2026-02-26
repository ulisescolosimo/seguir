-- Relación de seguimiento entre usuarios (quién sigue a quién).

create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id != following_id)
);

create index if not exists idx_follows_follower_id on public.follows(follower_id);
create index if not exists idx_follows_following_id on public.follows(following_id);

alter table public.follows enable row level security;

-- El usuario puede ver sus propias relaciones de seguimiento (a quién sigue).
create policy "Usuario ve a quién sigue"
  on public.follows for select
  using (auth.uid() = follower_id);

-- El usuario puede seguir a otro (solo como follower).
create policy "Usuario puede seguir"
  on public.follows for insert
  with check (
    auth.uid() = follower_id
    and exists (
      select 1 from public.profiles p
      where p.id = following_id and p.want_to_be_read = true
    )
  );

-- El usuario puede dejar de seguir (solo sus propias filas).
create policy "Usuario puede dejar de seguir"
  on public.follows for delete
  using (auth.uid() = follower_id);

comment on table public.follows is 'Relación de seguimiento: follower_id sigue a following_id.';
