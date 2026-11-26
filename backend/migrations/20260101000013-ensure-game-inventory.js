'use strict';

// Todo videojuego debe tener una fila en inventory_items: el panel de
// Inventario lista esa tabla y la venta exige inventario configurado. Los
// juegos creados antes de este cambio se quedaron sin ella, así que se
// rellenan con stock 0 y mínimo 5 para poder cargarles existencias.

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      INSERT INTO inventory_items
        (id, video_game_id, item_type, quantity, min_quantity, created_at, updated_at)
      SELECT gen_random_uuid(), vg.id, 'digital_key', 0, 5, now(), now()
      FROM video_games vg
      WHERE NOT EXISTS (
        SELECT 1 FROM inventory_items ii WHERE ii.video_game_id = vg.id
      )
      ON CONFLICT (video_game_id) DO NOTHING;
    `);
  },

  async down() {
    // No se eliminan filas: pueden tener movimientos y ventas asociadas.
  },
};
