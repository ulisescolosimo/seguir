-- Nombre y apellido para mostrar en comunidad y perfil.

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text;

comment on column public.profiles.first_name is 'Nombre del usuario (registro/signup).';
comment on column public.profiles.last_name is 'Apellido del usuario (registro/signup).';
