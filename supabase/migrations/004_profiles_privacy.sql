-- Preferencias de privacidad en perfil. Por defecto todas true.

alter table public.profiles
  add column if not exists want_to_be_read boolean not null default true,
  add column if not exists want_comments boolean not null default true,
  add column if not exists public_comments boolean not null default true,
  add column if not exists allow_share_texts boolean not null default true;

comment on column public.profiles.want_to_be_read is 'Quiero que me lean; si está apagado no podrás publicar tus textos';
comment on column public.profiles.want_comments is 'Permitir comentarios de otros usuarios';
comment on column public.profiles.public_comments is 'Los comentarios que recibas serán visibles para otros usuarios';
comment on column public.profiles.allow_share_texts is 'Tus textos se comparten fuera de la comunidad';
