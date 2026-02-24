-- Registro de generaciones de consignas por IA para límite diario (2 por día por usuario).
create table if not exists public.consigna_ia_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_consigna_ia_generations_user_date
  on public.consigna_ia_generations(user_id, created_at);

alter table public.consigna_ia_generations enable row level security;

create policy "Usuario ve sus propias generaciones"
  on public.consigna_ia_generations for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Usuario inserta su propia generación"
  on public.consigna_ia_generations for insert
  to authenticated
  with check (auth.uid() = user_id);

comment on table public.consigna_ia_generations is 'Una fila por cada generación de consigna con IA; se usa para limitar a 2 por día por usuario.';
