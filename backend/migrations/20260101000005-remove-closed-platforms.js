'use strict';

const { QueryTypes } = require('sequelize');

// PlayStation y Nintendo dejaron de entregar claves a tiendas virtuales externas.
const LEGACY = [
  { id: '66666666-6666-4666-8666-666666666661', name: 'PlayStation 5', manufacturer: 'Sony' },
  { id: '66666666-6666-4666-8666-666666666663', name: 'Nintendo Switch', manufacturer: 'Nintendo' },
];

const LEGACY_GAMES = [
  '88888888-8888-4888-8888-888888888801',
  '88888888-8888-4888-8888-888888888802',
  '88888888-8888-4888-8888-888888888803',
  '88888888-8888-4888-8888-888888888804',
  '88888888-8888-4888-8888-888888888809',
  '88888888-8888-4888-8888-888888888810',
  '88888888-8888-4888-8888-888888888811',
  '88888888-8888-4888-8888-888888888812',
];

module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const query = (sql, replacements) => sequelize.query(sql, { replacements });
    const ids = LEGACY.map((item) => item.id);

    const games = await sequelize.query(
      'SELECT id FROM video_games WHERE platform_id IN (:ids)',
      { replacements: { ids }, type: QueryTypes.SELECT },
    );

    for (const game of games) {
      const [sold] = await sequelize.query(
        'SELECT COUNT(*)::int AS total FROM sale_details WHERE video_game_id = :id',
        { replacements: { id: game.id }, type: QueryTypes.SELECT },
      );
      if (Number(sold.total) > 0) {
        // Si ya se vendió, se conserva el título para el historial pero sale
        // del catálogo: inactivo, sin stock y sin plataforma.
        await query(`UPDATE video_games
          SET is_active = false, platform_id = NULL, image_url = '/covers/placeholder.svg'
          WHERE id = :id`, { id: game.id });
        await query(`UPDATE inventory_items
          SET quantity = 0, item_type = 'digital_key'
          WHERE video_game_id = :id`, { id: game.id });
      } else {
        await query(`DELETE FROM inventory_movements
          WHERE inventory_item_id IN (SELECT id FROM inventory_items WHERE video_game_id = :id)`, { id: game.id });
        await query('DELETE FROM promotion_games WHERE video_game_id = :id', { id: game.id });
        await query('DELETE FROM inventory_items WHERE video_game_id = :id', { id: game.id });
        await query('DELETE FROM video_games WHERE id = :id', { id: game.id });
      }
    }

    await query('DELETE FROM platforms WHERE id IN (:ids)', { ids });
    // Todo lo que queda se entrega como clave digital.
    await query("UPDATE inventory_items SET item_type = 'digital_key' WHERE item_type <> 'digital_key'");
  },

  async down(queryInterface) {
    const sequelize = queryInterface.sequelize;
    for (const item of LEGACY) {
      await sequelize.query(`INSERT INTO platforms (id, name, manufacturer, created_at, updated_at)
        VALUES (:id, :name, :manufacturer, now(), now())
        ON CONFLICT (id) DO NOTHING`, { replacements: item });
    }
    // Los juegos sin ventas ya no se pueden recuperar desde esta migración;
    // el seeder original tampoco los vuelve a crear.
    await sequelize.query(`UPDATE video_games
      SET is_active = true, platform_id = CASE
        WHEN id IN ('88888888-8888-4888-8888-888888888801','88888888-8888-4888-8888-888888888802',
                    '88888888-8888-4888-8888-888888888803','88888888-8888-4888-8888-888888888804')
          THEN '66666666-6666-4666-8666-666666666661'
        ELSE '66666666-6666-4666-8666-666666666663' END
      WHERE id IN (:ids)`, { replacements: { ids: LEGACY_GAMES } });
  },
};
