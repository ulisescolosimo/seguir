-- Avatar del perfil (URL en Storage, mismo bucket text-images con path avatars/{id}/...).

alter table public.profiles
  add column if not exists avatar_url text;

comment on column public.profiles.avatar_url is 'URL de la foto de perfil (Supabase Storage, bucket text-images, carpeta avatars).';
