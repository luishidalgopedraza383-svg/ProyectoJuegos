'use strict';

// La reexpresión a dólares del catálogo dejó el esquema viejo: la columna
// currency seguía con valor por defecto COP y el CHECK solo exigía price >= 0.
// Aquí se fija USD como moneda por defecto y se garantiza en base de datos lo
// que ya valida la API: precio entero entre 10 y 60 dólares.

const USD_CHECK = 'video_games_price_usd_check';
const OLD_CHECK = 'video_games_price_check';

module.exports = {
  async up(queryInterface) {
    const query = (sql) => queryInterface.sequelize.query(sql);

    await query(`ALTER TABLE video_games ALTER COLUMN currency SET DEFAULT 'USD'`);
    await query(`UPDATE video_games SET currency = 'USD' WHERE currency IS DISTINCT FROM 'USD'`);
    await query(`UPDATE video_games SET price = trunc(price) WHERE price <> trunc(price)`);

    await query(`ALTER TABLE video_games DROP CONSTRAINT IF EXISTS ${OLD_CHECK}`);
    await query(`ALTER TABLE video_games DROP CONSTRAINT IF EXISTS ${USD_CHECK}`);
    await query(
      `ALTER TABLE video_games ADD CONSTRAINT ${USD_CHECK}
       CHECK (price >= 10 AND price <= 60 AND price = trunc(price))`,
    );
  },

  async down(queryInterface) {
    const query = (sql) => queryInterface.sequelize.query(sql);

    await query(`ALTER TABLE video_games DROP CONSTRAINT IF EXISTS ${USD_CHECK}`);
    await query(
      `ALTER TABLE video_games ADD CONSTRAINT ${OLD_CHECK} CHECK (price >= 0)`,
    );
    await query(`ALTER TABLE video_games ALTER COLUMN currency SET DEFAULT 'COP'`);
    // Los precios ya están reexpresados en USD: no se intenta recuperar los
    // valores en COP anteriores a la migración usd-prices-buyer-cards.
  },
};
