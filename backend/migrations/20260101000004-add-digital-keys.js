'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const table = await queryInterface.describeTable('sale_details');
    if (!table.digital_keys) {
      await queryInterface.addColumn('sale_details', 'digital_keys', {
        type: DataTypes.ARRAY(DataTypes.STRING(17)),
        allowNull: false,
        defaultValue: [],
      });
    }
    // Las ventas anteriores no tenían claves: se dejan con el arreglo vacío.
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('sale_details');
    if (table.digital_keys) {
      await queryInterface.removeColumn('sale_details', 'digital_keys');
    }
  },
};
