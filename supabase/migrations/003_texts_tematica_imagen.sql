-- Agregar temática e imagen principal a textos.
-- Ejecutar en el SQL Editor del proyecto Supabase o con supabase db push.

alter table public.texts
  add column if not exists tematica text,
  add column if not exists image_url text;

comment on column public.texts.tematica is 'Temática del texto: Poesía, Cuento, Novela, Ensayo, Otro';
comment on column public.texts.image_url is 'URL de la imagen principal del texto (Supabase Storage)';

-- Crear bucket "text-images" en Supabase Dashboard > Storage.
-- Luego ejecutar esta política para permitir subidas de usuarios autenticados:
create policy "Usuarios autenticados pueden subir imágenes de textos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'text-images');

-- Hacer el bucket público para lectura (Dashboard > Storage > text-images > Public).
