'use strict';

// Solo se cobra con Tarjeta: Efectivo y Transferencia dejan de existir.
// Los pagos ya registrados con esos métodos se reasignan a Tarjeta para no
// romper las referencias históricas antes de borrar los métodos.
const CARD = { id: '77777777-7777-4777-8777-777777777772', code: 'CARD', name: 'Tarjeta' };
const LEGACY_CODES = ['CASH', 'TRANSFER'];

module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const query = (sql, replacements) => sequelize.query(sql, { replacements });

    await query(
      `INSERT INTO payment_methods (id, code, name, is_active, created_at, updated_at)
       VALUES (:id, :code, :name, true, now(), now())
       ON CONFLICT (id) DO NOTHING`,
      CARD,
    );

    await query(
      `UPDATE payments SET payment_method_id = :cardId
       WHERE payment_method_id IN (SELECT id FROM payment_methods WHERE code IN (:legacy))`,
      { cardId: CARD.id, legacy: LEGACY_CODES },
    );

    await query('DELETE FROM payment_methods WHERE code IN (:legacy)', { legacy: LEGACY_CODES });
  },

  async down(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const legacy = [
      { id: '77777777-7777-4777-8777-777777777771', code: 'CASH', name: 'Efectivo' },
      { id: '77777777-7777-4777-8777-777777777773', code: 'TRANSFER', name: 'Transferencia' },
    ];
    for (const method of legacy) {
      await sequelize.query(
        `INSERT INTO payment_methods (id, code, name, is_active, created_at, updated_at)
         VALUES (:id, :code, :name, true, now(), now())
         ON CONFLICT (id) DO NOTHING`,
        { replacements: method },
      );
    }
  },
};
