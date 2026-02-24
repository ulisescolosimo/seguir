-- Asignar formato/temática (formatos_texto) a cada consigna según su contenido.
-- Cuento b0000001, Novela b0000002, Híbrido b0000003, Microrrelato b0000004,
-- Diario b0000008, Crónica b0000007, Poesía b0000009

update public.consignas set formato_id = 'b0000001-0001-4000-8000-000000000001' where id = '062eed65-afb4-43e0-afca-a610ecac0396'; -- Una puerta se abre, mamá (TEMAS)
update public.consignas set formato_id = 'b0000003-0001-4000-8000-000000000003' where id = '0a22847c-e533-4ffd-9bbd-6e02f292ef86'; -- tiempo hacia atrás (RECURSOS) → Híbrido
update public.consignas set formato_id = 'b0000001-0001-4000-8000-000000000001' where id = '2207e201-21dc-4c51-93f9-ba362a3e91ea'; -- multa por algo que no hizo (TEMAS)
update public.consignas set formato_id = 'b0000001-0001-4000-8000-000000000001' where id = '4669e9c7-ba5c-4e70-8a23-e3fd59cb3b62'; -- tres finales, reconstruye (RECURSOS)
update public.consignas set formato_id = 'b0000008-0001-4000-8000-000000000008' where id = '5f6a77a5-6340-4a8d-9179-94f802fa9547'; -- recuerdo infancia en presente (RECURSOS) → Diario
update public.consignas set formato_id = 'b0000001-0001-4000-8000-000000000001' where id = '608734f9-c3f9-47fa-94db-3dd10c3595c5'; -- objeto que revela historia (TEMAS)
update public.consignas set formato_id = 'b0000001-0001-4000-8000-000000000001' where id = '6a206a54-d453-4048-a247-ac573aa528b3'; -- ruptura desde objeto (RECURSOS)
update public.consignas set formato_id = 'b0000007-0001-4000-8000-000000000007' where id = '774293fb-e241-44cc-bef0-cda94f524f00'; -- un día solo verdad (TEMAS) → Crónica
update public.consignas set formato_id = 'b0000001-0001-4000-8000-000000000001' where id = '7aea19c6-0f1e-4090-901f-ff4aa430f480'; -- titular diario, cuento (TEMAS)
update public.consignas set formato_id = 'b0000008-0001-4000-8000-000000000008' where id = '8108309a-1687-48a4-9494-c92f8a8a4341'; -- día en fragmentos (RECURSOS) → Diario
update public.consignas set formato_id = 'b0000001-0001-4000-8000-000000000001' where id = '8ad6eef7-c17f-44f7-914c-d1bf66d67428'; -- vuelve a lugar que juró no volver (TEMAS)
update public.consignas set formato_id = 'b0000004-0001-4000-8000-000000000004' where id = '9b3bce80-eea9-442c-8226-7abb0096aa9b'; -- una página, 5 min (RECURSOS) → Microrrelato
update public.consignas set formato_id = 'b0000001-0001-4000-8000-000000000001' where id = '9cd7be07-cb9d-4b37-8980-1a292b4fd7bf'; -- callar para siempre (TEMAS)
update public.consignas set formato_id = 'b0000002-0001-4000-8000-000000000002' where id = 'bc6bbdef-15d0-4e97-b90f-de13b7158933'; -- viaje con ídolo, desayuno hotel (TEMAS) → Novela
update public.consignas set formato_id = 'b0000001-0001-4000-8000-000000000001' where id = 'ddbf2567-4857-4383-a674-056acd3c5d59'; -- diálogo que vuelve confuso (RECURSOS)
update public.consignas set formato_id = 'b0000003-0001-4000-8000-000000000003' where id = 'e3e912d9-e70c-43bc-9542-6267d67f6f99'; -- escena pasado y futuro (RECURSOS) → Híbrido
update public.consignas set formato_id = 'b0000001-0001-4000-8000-000000000001' where id = 'e5a01918-0e08-4ce1-a058-2fbbe79260ff'; -- cena donde todos saben algo (TEMAS)
update public.consignas set formato_id = 'b0000002-0001-4000-8000-000000000002' where id = 'e5df7002-273e-41f9-9113-1fc79bb52466'; -- narrador omnisciente (RECURSOS) → Novela
update public.consignas set formato_id = 'b0000004-0001-4000-8000-000000000004' where id = 'f960b334-d6dd-403e-8e19-3d84b8e1f24d'; -- diez renglones, más de una hora (RECURSOS) → Microrrelato
update public.consignas set formato_id = 'b0000001-0001-4000-8000-000000000001' where id = 'fa6fde1d-bf39-44cc-801d-71e2178eb16d'; -- devolver regalo imposible (TEMAS)
