-- Nombre de usuario para mostrar como @usuario en perfil y comunidad.

alter table public.profiles
  add column if not exists username text;

comment on column public.profiles.username is 'Nombre de usuario público (ej. @maria_escritora). Si es null se usa el prefijo del email.';
