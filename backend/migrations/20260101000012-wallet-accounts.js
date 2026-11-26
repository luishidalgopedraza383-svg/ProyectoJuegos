'use strict';

// Registro público + billetera ficticia.
//
// Una billetera = una cuenta bancaria + una tarjeta de prueba vinculadas al
// mismo usuario. Se permiten varias por usuario (se retira el UNIQUE de
// user_id), se guarda el CVV de la tarjeta y el cliente del panel se vincula
// con el usuario dueño de la billetera (customers.user_id).
//
// También se habilita Banco Económico como medio de pago del POS.

const METHOD = { id: '77777777-7777-4777-8777-777777777780', code: 'ECONOMICO', name: 'Banco Económico' };

module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;
    await sequelize.query(`
      ALTER TABLE payment_cards ADD COLUMN IF NOT EXISTS cvv VARCHAR(4);
      UPDATE payment_cards SET cvv = '000' WHERE cvv IS NULL;
      ALTER TABLE payment_cards ALTER COLUMN cvv SET DEFAULT '000';
      ALTER TABLE payment_cards ALTER COLUMN cvv SET NOT NULL;

      ALTER TABLE payment_cards ADD COLUMN IF NOT EXISTS bank_account_id UUID;
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_cards_bank_account_id_fkey') THEN
          ALTER TABLE payment_cards
            ADD CONSTRAINT payment_cards_bank_account_id_fkey
            FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL;
        END IF;
      END $$;

      ALTER TABLE payment_cards DROP CONSTRAINT IF EXISTS payment_cards_user_id_key;
      ALTER TABLE bank_accounts DROP CONSTRAINT IF EXISTS bank_accounts_user_id_key;
      CREATE INDEX IF NOT EXISTS payment_cards_user_id_idx ON payment_cards (user_id);
      CREATE INDEX IF NOT EXISTS bank_accounts_user_id_idx ON bank_accounts (user_id);

      ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id UUID;
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_user_id_fkey') THEN
          ALTER TABLE customers
            ADD CONSTRAINT customers_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END $$;
      CREATE UNIQUE INDEX IF NOT EXISTS customers_user_id_key ON customers (user_id);

      INSERT INTO payment_methods (id, code, name, is_active, created_at, updated_at)
      VALUES ('${METHOD.id}', '${METHOD.code}', '${METHOD.name}', true, now(), now())
      ON CONFLICT (code) DO UPDATE
        SET name = EXCLUDED.name, is_active = true, updated_at = now();
    `);
  },

  async down(queryInterface) {
    const sequelize = queryInterface.sequelize;
    await sequelize.query(`
      UPDATE payment_methods SET is_active = false, updated_at = now()
      WHERE code = '${METHOD.code}';

      ALTER TABLE payment_cards DROP CONSTRAINT IF EXISTS payment_cards_bank_account_id_fkey;
      ALTER TABLE payment_cards DROP COLUMN IF EXISTS bank_account_id;
      ALTER TABLE payment_cards DROP COLUMN IF EXISTS cvv;

      DROP INDEX IF EXISTS customers_user_id_key;
      ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_user_id_fkey;
      ALTER TABLE customers DROP COLUMN IF EXISTS user_id;

      DROP INDEX IF EXISTS payment_cards_user_id_idx;
      DROP INDEX IF EXISTS bank_accounts_user_id_idx;

      DO $$
      BEGIN
        -- Solo se restaura UNIQUE si no hay duplicados creados mientras tanto.
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_cards_user_id_key')
           AND NOT EXISTS (SELECT 1 FROM (SELECT user_id FROM payment_cards GROUP BY user_id HAVING COUNT(*) > 1) d) THEN
          ALTER TABLE payment_cards ADD CONSTRAINT payment_cards_user_id_key UNIQUE (user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_accounts_user_id_key')
           AND NOT EXISTS (SELECT 1 FROM (SELECT user_id FROM bank_accounts GROUP BY user_id HAVING COUNT(*) > 1) d) THEN
          ALTER TABLE bank_accounts ADD CONSTRAINT bank_accounts_user_id_key UNIQUE (user_id);
        END IF;
      END $$;
    `);
  },
};
