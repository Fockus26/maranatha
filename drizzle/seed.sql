-- Seed mínimo para la base de QA (bun run qa:local). Sin datos personales.
-- Las cuentas de prueba no van aquí: las crea scripts/seed-db.ts desde
-- .env.test.local. Los pagos de prueba los crea la QA desde el sitio, igual
-- que un visitante.

-- Las reuniones semanales que antes sembraba la migración de la agenda
-- (placeholder hasta que el cliente confirme horarios, CONTENT_CHECKLIST).
insert into public.agenda_events (kind, weekday, start_time, title, location) values
  ('recurring', 0, '10:00', 'Servicio Dominical', 'Templo principal'),
  ('recurring', 3, '19:00', 'Reunión de oración', 'Salón de oración'),
  ('recurring', 5, '19:00', 'Reunión de jóvenes', 'Salón de jóvenes');
