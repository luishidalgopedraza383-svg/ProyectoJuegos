'use strict';

const db = require('../models');

const listMethods = () => db.PaymentMethod.findAll({
  where: { isActive: true },
  order: [['name', 'ASC']],
});

module.exports = { listMethods };
