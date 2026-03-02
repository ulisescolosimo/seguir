-- Quitar preferencia "cómo empezar" (desde cero vs consignas).
-- El usuario elige en Inicio con dos botones, ya no se guarda en perfil.

alter table public.profiles drop column if exists start_mode;
