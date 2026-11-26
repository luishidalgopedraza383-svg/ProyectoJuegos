'use strict';

const db = require('../models');
const ApiError = require('../utils/ApiError');

const listCustomers = async (query = {}) => {
  const limit = Math.min(Number(query.limit) || 50, 100);
  const offset = Math.max(Number(query.offset) || 0, 0);
  const { rows, count } = await db.Customer.findAndCountAll({
    // Incluye el usuario vinculado para que /clientes muestre los registros
    // nuevos creados desde una billetera ficticia.
    include: [{ model: db.User, as: 'user', attributes: ['id', 'email', 'displayName'] }],
    order: [['firstName', 'ASC']],
    limit,
    offset,
  });
  return { items: rows, total: count, limit, offset };
};

const getCustomer = async (id) => {
  const customer = await db.Customer.findByPk(id, {
    include: [{ model: db.LoyaltyMovement, as: 'loyaltyMovements', order: [['createdAt', 'DESC']] }],
  });
  if (!customer) throw ApiError.notFound('Cliente no encontrado');
  return customer;
};

const createCustomer = async (payload, user) => {
  const customer = await db.Customer.create(payload);
  await db.AuditLog.create({
    userId: user.id,
    action: 'CUSTOMER_CREATED',
    entity: 'Customer',
    entityId: customer.id,
  });
  return customer;
};

module.exports = { listCustomers, getCustomer, createCustomer };
