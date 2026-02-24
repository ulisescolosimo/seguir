-- Seed completo de consignas (por recursos y por temas).
-- Borrar seed anterior de ejemplo para evitar duplicados por titulo.
delete from public.consignas where titulo in (
  'El susurro del viento', 'Reflejos olvidados', 'Punto de vista'
);

insert into public.consignas (titulo, descripcion, tipo, orden) values
-- Consignas por recursos (orden 1..10)
('Escribe tres finales de una historia. Elige uno y reconstruye hasta el inicio.', '', 'RECURSOS', 1),
('Escribe un recuerdo de infancia en presente.', '', 'RECURSOS', 2),
('Escribe una escena en la que haya un diálogo que no solo no clarifica lo que ocurre sino que lo vuelve más confuso.', '', 'RECURSOS', 3),
('Cuenta una ruptura amorosa desde el punto de vista de un objeto que la haya presenciado.', '', 'RECURSOS', 4),
('Escribe una escena donde el tiempo avance hacia atrás.', '', 'RECURSOS', 5),
('Cuenta una historia con un narrador omnisciente que interviene y opina sobre los personajes.', '', 'RECURSOS', 6),
('Escribe un día completo en fragmentos desordenados.', '', 'RECURSOS', 7),
('Desarrolla una escena usando solamente pasado y futuro.', '', 'RECURSOS', 8),
('Escribe en una página algo que haya durado máximo cinco minutos.', '', 'RECURSOS', 9),
('Escribe en diez renglones algo que haya ocurrido durante más de una hora.', '', 'RECURSOS', 10),
-- Consignas por temas (orden 11..20)
('Escribe la historia de alguien que decidió callar para siempre.', '', 'TEMAS', 11),
('Una puerta se abre y tu mamá te descubre en una situación incómoda. ¿Qué pasa?', '', 'TEMAS', 12),
('Alguien vuelve a un lugar que juró no volver.', '', 'TEMAS', 13),
('El protagonista se muda a una casa y descubre un objeto que revela una historia.', '', 'TEMAS', 14),
('La protagonista se encuentra en un viaje con su ídolo de la adolescencia. La historia empieza mientras se sirven el desayuno del hotel.', '', 'TEMAS', 15),
('Elige un titular del diario y úsalo como título de un cuento.', '', 'TEMAS', 16),
('Alguien recibe una multa por algo que todavía no hizo.', '', 'TEMAS', 17),
('Escribe la historia de una cena donde todos saben algo que uno no.', '', 'TEMAS', 18),
('Una persona decide vivir un día entero diciendo solo la verdad.', '', 'TEMAS', 19),
('Alguien intenta devolver un regalo imposible de devolver.', '', 'TEMAS', 20);
