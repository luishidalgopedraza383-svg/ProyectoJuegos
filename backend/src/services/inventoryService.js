'use strict';

const { Op, Transaction } = require('sequelize');
const db = require('../models');
const ApiError = require('../utils/ApiError');
const { signedQuantity } = require('../utils/stock');

const adjustStock = async (
  { itemId, movementType, quantity, reason, referenceId, userId },
  transaction,
) => {
  const item = await db.InventoryItem.findByPk(itemId, {
    transaction,
    lock: transaction ? Transaction.LOCK.UPDATE : undefined,
  });

  if (!item) throw ApiError.notFound('Ítem de inventario no encontrado');

  const nextQuantity = item.quantity + quantity;
  if (nextQuantity < 0) {
    throw ApiError.conflict(`Stock insuficiente. Disponible: ${item.quantity}`);
  }

  await item.update({ quantity: nextQuantity }, { transaction });
  const movement = await db.InventoryMovement.create({
    inventoryItemId: itemId,
    movementType,
    quantity,
    reason,
    referenceId,
    createdBy: userId,
  }, { transaction });

  return { item, movement };
};

const listItems = async () => db.InventoryItem.findAll({
  include: [
    // Se muestra isActive para que un juego desactivado siga siendo visible y
    // editable desde Inventario (solo se oculta del catálogo público/POS).
    { model: db.VideoGame, as: 'game', attributes: ['id', 'title', 'sku', 'isActive'] },
  ],
  order: [['quantity', 'ASC']],
});

const listLowStock = async () => db.InventoryItem.findAll({
  where: {
    quantity: { [Op.lte]: db.sequelize.col('InventoryItem.min_quantity') },
  },
  include: [{ model: db.VideoGame, as: 'game', attributes: ['id', 'title'] }],
});

const listMovements = async (itemId) => db.InventoryMovement.findAll({
  where: itemId ? { inventoryItemId: itemId } : {},
  include: [{ model: db.InventoryItem, as: 'item', include: [{ model: db.VideoGame, as: 'game' }] }],
  order: [['createdAt', 'DESC']],
  limit: 200,
});

const registerMovement = async (payload, user) => {
  const quantity = signedQuantity(payload.movementType, payload.quantity);
  const result = await db.sequelize.transaction(async (transaction) => {
    const movement = await adjustStock({
      itemId: payload.itemId,
      movementType: payload.movementType,
      quantity,
      reason: payload.reason,
      userId: user.id,
    }, transaction);

    await db.AuditLog.create({
      userId: user.id,
      action: 'INVENTORY_MOVEMENT',
      entity: 'InventoryItem',
      entityId: payload.itemId,
      payload: { movementType: payload.movementType, quantity },
    }, { transaction });

    return movement;
  });
  return result;
};

// Edición de parámetros del stock (minimo y tipo de copia).
const updateItem = async (itemId, payload, user) => {
  const item = await db.InventoryItem.findByPk(itemId, {
    include: [{ model: db.VideoGame, as: 'game', attributes: ['id', 'title', 'sku'] }],
  });
  if (!item) throw ApiError.notFound('Ítem de inventario no encontrado');

  const changes = {};
  if (payload.minQuantity !== undefined) changes.minQuantity = payload.minQuantity;
  if (payload.itemType !== undefined) changes.itemType = payload.itemType;

  await item.update(changes);
  await db.AuditLog.create({
    userId: user.id,
    action: 'INVENTORY_ITEM_UPDATED',
    entity: 'InventoryItem',
    entityId: item.id,
    payload: changes,
  });
  return item;
};

module.exports = {
  adjustStock, listItems, listLowStock, listMovements, registerMovement, updateItem,
};
