'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const table = await queryInterface.describeTable('video_games');
    if (!table.image_url) {
      await queryInterface.addColumn('video_games', 'image_url', {
        type: DataTypes.STRING(500),
        allowNull: true,
      });
    }

    // Solo rellena nulos: nunca pisa una portada subida desde el panel.
    // La portada por plataforma la asigna después el seeder.
    await queryInterface.sequelize.query(`
      UPDATE video_games SET image_url = '/covers/placeholder.svg'
      WHERE image_url IS NULL
    `);
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('video_games');
    if (table.image_url) {
      await queryInterface.removeColumn('video_games', 'image_url');
    }
  },
};
