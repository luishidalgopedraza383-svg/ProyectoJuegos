-- Género Shooter para PlayVibe. Idempotente: se puede ejecutar varias veces.
-- Se usan UUID literales para evitar problemas de codificación al cargar el
-- archivo desde PowerShell (los acentos de "Acción" no siempre llegan igual).

INSERT INTO genres (id, name) VALUES
  ('55555555-5555-4555-8555-555555555559', 'Shooter')
ON CONFLICT (id) DO NOTHING;

-- Repara categoría/género de los juegos que quedaron nulos en cargas anteriores.
UPDATE video_games
SET category_id = '44444444-4444-4444-8444-444444444441'::uuid,
    updated_at = now()
WHERE sku IN ('PC-GTA5-015', 'PC-HALO1-019', 'XB-HALO3-020', 'PC-BO6-025', 'PC-BF6-026')
  AND category_id IS NULL;

UPDATE video_games
SET genre_id = '55555555-5555-4555-8555-555555555551'::uuid,
    updated_at = now()
WHERE sku = 'PC-GTA5-015'
  AND genre_id IS NULL;

-- Títulos de disparos: Halo, Gears, Call of Duty y Battlefield.
UPDATE video_games
SET genre_id = '55555555-5555-4555-8555-555555555559'::uuid,
    updated_at = now()
WHERE sku IN (
  'XSS-GEARS-008',
  'XSS-HALO-006',
  'PC-HALO1-019',
  'XB-HALO3-020',
  'PC-BO6-025',
  'PC-BF6-026'
);

SELECT ge.name AS genre, count(*) AS games
FROM video_games g
JOIN genres ge ON ge.id = g.genre_id
GROUP BY ge.name
ORDER BY ge.name;
