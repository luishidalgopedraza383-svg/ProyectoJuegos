-- Catálogo ampliado de PlayVibe. Idempotente: se puede ejecutar varias veces.
-- Precios enteros en USD (10..60) y stocks variados.

INSERT INTO categories (id, name, slug) VALUES
  ('44444444-4444-4444-8444-444444444447', 'Terror', 'terror'),
  ('44444444-4444-4444-8444-444444444448', 'Lucha', 'lucha')
ON CONFLICT (id) DO NOTHING;

INSERT INTO genres (id, name) VALUES
  ('55555555-5555-4555-8555-555555555557', 'Terror'),
  ('55555555-5555-4555-8555-555555555558', 'Lucha'),
  ('55555555-5555-4555-8555-555555555559', 'Shooter')
ON CONFLICT (id) DO NOTHING;

INSERT INTO platforms (id, name, manufacturer) VALUES
  ('66666666-6666-4666-8666-666666666661', 'Xbox', 'Microsoft')
ON CONFLICT (id) DO NOTHING;

INSERT INTO video_games (
  id, title, description, sku, category_id, genre_id, platform_id,
  price, currency, age_rating, image_url, is_active
) VALUES
  ('88888888-8888-4888-8888-888888888815', 'GTA 5', 'Grand Theft Auto V en PC: historia, mundo abierto y modo online.', 'PC-GTA5-015', '44444444-4444-4444-8444-444444444441'::uuid, '55555555-5555-4555-8555-555555555551'::uuid, (SELECT id FROM platforms WHERE name='PC'), 30, 'USD', 'M', '/covers/pc.svg', true),
  ('88888888-8888-4888-8888-888888888816', 'Hollow Knight: Silksong', 'La secuela del aclamado metroidvania de Team Cherry.', 'PC-SILK-016', (SELECT id FROM categories WHERE name='Plataformas'), (SELECT id FROM genres WHERE name='Plataformas'), (SELECT id FROM platforms WHERE name='PC'), 12, 'USD', 'E', '/covers/pc.svg', true),
  ('88888888-8888-4888-8888-888888888817', 'Expedition 33', 'RPG de turnos con combate espectacular en un mundo fantástico.', 'PC-EXP33-017', (SELECT id FROM categories WHERE name='RPG'), (SELECT id FROM genres WHERE name='RPG'), (SELECT id FROM platforms WHERE name='PC'), 33, 'USD', 'M', '/covers/pc.svg', true),
  ('88888888-8888-4888-8888-888888888818', 'Minecraft Bedrock', 'Construye, explora y sobrevive en el mundo de bloques.', 'PC-MCBE-018', (SELECT id FROM categories WHERE name='Aventura'), (SELECT id FROM genres WHERE name='Aventura'), (SELECT id FROM platforms WHERE name='PC'), 20, 'USD', 'E', '/covers/pc.svg', true),
  ('88888888-8888-4888-8888-888888888819', 'Halo 1', 'El inicio de la leyenda del Jefe Maestro en PC.', 'PC-HALO1-019', '44444444-4444-4444-8444-444444444441'::uuid, '55555555-5555-4555-8555-555555555551'::uuid, (SELECT id FROM platforms WHERE name='PC'), 30, 'USD', 'M', '/covers/pc.svg', true),
  ('88888888-8888-4888-8888-888888888820', 'Halo 3', 'La conclusión de la trilogía clásica en Xbox.', 'XB-HALO3-020', '44444444-4444-4444-8444-444444444441'::uuid, '55555555-5555-4555-8555-555555555551'::uuid, (SELECT id FROM platforms WHERE name='Xbox'), 30, 'USD', 'M', '/covers/xbox.svg', true),
  ('88888888-8888-4888-8888-888888888821', 'Resident Evil: Requiem', 'Nueva entrega de terror y supervivencia de Capcom.', 'PC-REQUIEM-021', (SELECT id FROM categories WHERE name='Terror'), (SELECT id FROM genres WHERE name='Terror'), (SELECT id FROM platforms WHERE name='PC'), 60, 'USD', 'M', '/covers/pc.svg', true),
  ('88888888-8888-4888-8888-888888888822', 'Silent Hill 2', 'El clásico de terror psicológico regresa con un remake.', 'PC-SH2-022', (SELECT id FROM categories WHERE name='Terror'), (SELECT id FROM genres WHERE name='Terror'), (SELECT id FROM platforms WHERE name='PC'), 20, 'USD', 'M', '/covers/pc.svg', true),
  ('88888888-8888-4888-8888-888888888823', 'Tekken 8', 'La saga de artes marciales vuelve con combate de última generación.', 'PC-TEKKEN8-023', (SELECT id FROM categories WHERE name='Lucha'), (SELECT id FROM genres WHERE name='Lucha'), (SELECT id FROM platforms WHERE name='PC'), 50, 'USD', 'T', '/covers/pc.svg', true),
  ('88888888-8888-4888-8888-888888888824', 'Mortal Kombat 1', 'El reinicio sangriento de la franquicia de lucha.', 'PC-MK1-024', (SELECT id FROM categories WHERE name='Lucha'), (SELECT id FROM genres WHERE name='Lucha'), (SELECT id FROM platforms WHERE name='PC'), 40, 'USD', 'M', '/covers/pc.svg', true),
  ('88888888-8888-4888-8888-888888888825', 'Call of Duty: Black Ops 6', 'Acción, sigilo y multijugador en la nueva entrega de Black Ops.', 'PC-BO6-025', '44444444-4444-4444-8444-444444444441'::uuid, '55555555-5555-4555-8555-555555555551'::uuid, (SELECT id FROM platforms WHERE name='PC'), 50, 'USD', 'M', '/covers/pc.svg', true),
  ('88888888-8888-4888-8888-888888888826', 'Battlefield 6', 'Guerras a gran escala con combate combinado.', 'PC-BF6-026', '44444444-4444-4444-8444-444444444441'::uuid, '55555555-5555-4555-8555-555555555551'::uuid, (SELECT id FROM platforms WHERE name='PC'), 60, 'USD', 'M', '/covers/pc.svg', true)
ON CONFLICT (id) DO NOTHING;

-- Los juegos de disparos se clasifican como Shooter (ver add-shooter-genre.sql).
UPDATE video_games
SET genre_id = '55555555-5555-4555-8555-555555555559'::uuid, updated_at = now()
WHERE sku IN ('XSS-GEARS-008', 'XSS-HALO-006', 'PC-HALO1-019', 'XB-HALO3-020', 'PC-BO6-025', 'PC-BF6-026');

INSERT INTO inventory_items (id, video_game_id, item_type, quantity, min_quantity) VALUES
  ('99999999-9999-4999-8999-999999999915', '88888888-8888-4888-8888-888888888815', 'digital_key', 35, 10),
  ('99999999-9999-4999-8999-999999999916', '88888888-8888-4888-8888-888888888816', 'digital_key', 12, 5),
  ('99999999-9999-4999-8999-999999999917', '88888888-8888-4888-8888-888888888817', 'digital_key', 18, 8),
  ('99999999-9999-4999-8999-999999999918', '88888888-8888-4888-8888-888888888818', 'digital_key', 50, 12),
  ('99999999-9999-4999-8999-999999999919', '88888888-8888-4888-8888-888888888819', 'digital_key', 22, 10),
  ('99999999-9999-4999-8999-999999999920', '88888888-8888-4888-8888-888888888820', 'digital_key', 16, 6),
  ('99999999-9999-4999-8999-999999999921', '88888888-8888-4888-8888-888888888821', 'digital_key', 8, 5),
  ('99999999-9999-4999-8999-999999999922', '88888888-8888-4888-8888-888888888822', 'digital_key', 27, 10),
  ('99999999-9999-4999-8999-999999999923', '88888888-8888-4888-8888-888888888823', 'digital_key', 14, 8),
  ('99999999-9999-4999-8999-999999999924', '88888888-8888-4888-8888-888888888824', 'digital_key', 19, 9),
  ('99999999-9999-4999-8999-999999999925', '88888888-8888-4888-8888-888888888825', 'digital_key', 24, 12),
  ('99999999-9999-4999-8999-999999999926', '88888888-8888-4888-8888-888888888826', 'digital_key', 11, 7)
ON CONFLICT (id) DO NOTHING;

SELECT
  (SELECT count(*) FROM video_games) AS total_games,
  (SELECT sum(quantity) FROM inventory_items) AS total_stock,
  (SELECT min(price) FROM video_games) AS min_price,
  (SELECT max(price) FROM video_games) AS max_price;
