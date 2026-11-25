'use strict';

// Los precios pasan a dólares enteros entre 10 y 60: el catálogo ya no
// cotiza en COP. Las ventas históricas se reexpresan con los nuevos precios
// para que reportes, pagos y saldos sigan cuadrando en la nueva moneda.
// En tarjetas solo quedan las de los compradores (saldo 500 USD): el
// personal del POS cobra con la tarjeta del comprador que atiende.

const GAMES_USD = {
  '88888888-8888-4888-8888-888888888805': 40, // Forza Horizon 5
  '88888888-8888-4888-8888-888888888806': 35, // Halo Infinite
  '88888888-8888-4888-8888-888888888807': 55, // Starfield
  '88888888-8888-4888-8888-888888888808': 25, // Gears 5
  '88888888-8888-4888-8888-888888888813': 50, // Elden Ring
  '88888888-8888-4888-8888-888888888814': 45, // Cyberpunk 2077
};

const CARD_BALANCE = 500;

module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const query = (sql, replacements) => sequelize.query(sql, { replacements });

    // 1) Catálogo en USD (enteros, sin decimales).
    for (const [id, price] of Object.entries(GAMES_USD)) {
      await query(
        `UPDATE video_games SET price = :price, currency = 'USD', updated_at = now() WHERE id = :id`,
        { id, price },
      );
    }

    // 2) Historial de ventas reexpresado en USD con los nuevos precios.
    await query(
      `UPDATE sale_details sd
          SET unit_price = vg.price,
              subtotal = vg.price * sd.quantity,
              discount = 0,
              updated_at = now()
         FROM video_games vg
        WHERE sd.video_game_id = vg.id`,
    );
    await query(
      `UPDATE sales s
          SET subtotal = t.total,
              discount = 0,
              total = t.total,
              updated_at = now()
         FROM (SELECT sale_id, sum(subtotal) AS total FROM sale_details GROUP BY sale_id) t
        WHERE t.sale_id = s.id`,
    );
    await query(
      `UPDATE payments p
          SET amount = s.total,
              updated_at = now()
         FROM sales s
        WHERE p.sale_id = s.id`,
    );

    // 3) Tarjetas: solo de compradores, con saldo de 500 USD.
    await query(
      `DELETE FROM payment_cards pc
        USING users u
        JOIN roles r ON r.id = u.role_id
        WHERE pc.user_id = u.id
          AND r.name <> 'comprador'`,
    );
    await query(
      `UPDATE payment_cards SET balance = :balance, updated_at = now()`,
      { balance: CARD_BALANCE },
    );
  },

  async down() {
    // No se restauran precios históricos ni tarjetas eliminadas: son datos
    // derivados de la reexpresión a dólares y no hay dónde guardarlos.
  },
};
