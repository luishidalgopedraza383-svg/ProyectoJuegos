'use strict';

// Migración complementaria para bases de datos creadas antes de que existiera
// el inicio de sesión local (password_hash).
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)',
    );
    await queryInterface.sequelize.query(
      "UPDATE users SET password_hash = '' WHERE password_hash IS NULL",
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL',
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE users ALTER COLUMN auth_user_id DROP NOT NULL',
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE users DROP COLUMN IF EXISTS password_hash');
  },
};
