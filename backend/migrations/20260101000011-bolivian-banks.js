'use strict';

// Se retira Efectivo y la Transferencia genérica: el POS cobra con Tarjeta o
// con cualquiera de los seis bancos bolivianos. Los seis se comportan igual
// que la transferencia anterior (debitan la cuenta bancaria del comprador
// dentro de la misma transacción de la venta).
//
// Los métodos viejos NO se borran: si una venta antigua pagó con Efectivo o
// Transferencia, su referencia sigue siendo verdadera. Solo se desactivan para
// que dejen de aparecer en el selector del POS.

const METHODS = [
  { id: '77777777-7777-4777-8777-777777777774', code: 'MERCANTIL', name: 'Mercantil Santa Cruz' },
  { id: '77777777-7777-4777-8777-777777777775', code: 'BNB', name: 'BNB' },
  { id: '77777777-7777-4777-8777-777777777776', code: 'UNION', name: 'Banco Unión' },
  { id: '77777777-7777-4777-8777-777777777777', code: 'BCP', name: 'BCP' },
  { id: '77777777-7777-4777-8777-777777777778', code: 'SOL', name: 'Banco Sol' },
  { id: '77777777-7777-4777-8777-777777777779', code: 'FORTALEZA', name: 'Banco Fortaleza' },
];

const LEGACY_CODES = ['CASH', 'TRANSFER'];

module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const query = (sql, replacements) => sequelize.query(sql, { replacements });

    for (const method of METHODS) {
      await query(
        `INSERT INTO payment_methods (id, code, name, is_active, created_at, updated_at)
         VALUES (:id, :code, :name, true, now(), now())
         ON CONFLICT (id) DO UPDATE
           SET name = EXCLUDED.name, is_active = true, updated_at = now()`,
        method,
      );
    }

    await query(
      `UPDATE payment_methods SET is_active = false, updated_at = now()
       WHERE code IN (:legacy)`,
      { legacy: LEGACY_CODES },
    );
  },

  async down(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const query = (sql, replacements) => sequelize.query(sql, { replacements });

    // Igual que al subir: no se borran filas que puedan tener pagos históricos.
    await query(
      `UPDATE payment_methods SET is_active = false, updated_at = now()
       WHERE code IN (:codes)`,
      { codes: METHODS.map((method) => method.code) },
    );
    await query(
      `UPDATE payment_methods SET is_active = true, updated_at = now()
       WHERE code IN (:legacy)`,
      { legacy: LEGACY_CODES },
    );
  },
};
