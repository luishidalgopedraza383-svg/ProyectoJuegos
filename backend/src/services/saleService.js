'use strict';

const { Transaction, Op } = require('sequelize');
const db = require('../models');
const ApiError = require('../utils/ApiError');
const { toNumber, roundMoney } = require('../utils/money');
const { generateDigitalKey } = require('../utils/digitalKey');
const inventoryService = require('./inventoryService');

const saleIncludes = [
  { model: db.Customer, as: 'customer', attributes: ['id', 'email', 'firstName', 'lastName'] },
  { model: db.User, as: 'seller', attributes: ['id', 'displayName'] },
  { model: db.SaleDetail, as: 'details', include: [{ model: db.VideoGame, as: 'game', attributes: ['id', 'title', 'sku'] }] },
  { model: db.Payment, as: 'payments', include: [{ model: db.PaymentMethod, as: 'method', attributes: ['id', 'name', 'code'] }] },
];

const generateSaleCode = () => {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GH-${stamp}-${random}`;
};

// Una clave distinta por cada unidad vendida, canjeable en la plataforma.
// Se valida contra las claves ya entregadas para no repetir ninguna.
const generateDigitalKeys = async (quantity, transaction) => {
  const keys = [];
  const seen = new Set();
  while (keys.length < quantity) {
    const key = generateDigitalKey();
    if (seen.has(key)) continue;
    const existing = await db.SaleDetail.count({
      where: { digitalKeys: { [Op.overlap]: [key] } },
      transaction,
    });
    if (existing) continue;
    seen.add(key);
    keys.push(key);
  }
  return keys;
};

const getSale = async (id, user = null) => {
  const where = { id };
  // Sin sales.readAll (rol comprador) solo se consultan las ventas propias.
  if (user && !user.permissions.includes('sales.readAll')) where.sellerId = user.id;
  const sale = await db.Sale.findOne({ where, include: saleIncludes });
  if (!sale) throw ApiError.notFound('Venta no encontrada');
  return sale;
};

const resolveDiscount = async (game, quantity, promotionCode) => {
  if (!promotionCode) return 0;
  const now = new Date();
  const promotion = await db.Promotion.findOne({
    where: { code: promotionCode, isActive: true },
    include: [{
      model: db.VideoGame,
      as: 'games',
      where: { id: game.id },
      required: true,
      attributes: [],
    }],
  });

  if (!promotion || now < new Date(promotion.startDate) || now > new Date(promotion.endDate)) {
    return 0;
  }
  return roundMoney(toNumber(game.price) * quantity * (toNumber(promotion.percent) / 100));
};

const createSale = async (payload, user) => {
  const saleId = await db.sequelize.transaction(async (transaction) => {
    const shift = await db.CashShift.findOne({
      where: { id: payload.cashShiftId, cashierId: user.id, status: 'open' },
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });
    if (!shift) throw ApiError.conflict('No existe un turno abierto para este cajero');

    const gameIds = [...new Set(payload.items.map((item) => item.videoGameId))];
    const games = await db.VideoGame.findAll({
      where: { id: gameIds, isActive: true },
      include: [{ model: db.InventoryItem, as: 'inventory' }],
      transaction,
    });

    if (games.length !== gameIds.length) {
      throw ApiError.badRequest('Uno o más videojuegos no existen o están inactivos');
    }

    const details = [];
    let subtotal = 0;
    let totalDiscount = 0;

    for (const requested of payload.items) {
      const game = games.find((item) => item.id === requested.videoGameId);
      const inventory = game.inventory;
      if (!inventory) throw ApiError.conflict(`Sin inventario configurado para ${game.title}`);
      if (inventory.quantity < requested.quantity) {
        throw ApiError.conflict(`Stock insuficiente para ${game.title}. Disponible: ${inventory.quantity}`);
      }

      const lineSubtotal = roundMoney(toNumber(game.price) * requested.quantity);
      const discount = await resolveDiscount(game, requested.quantity, payload.promotionCode);
      const lineTotal = roundMoney(lineSubtotal - discount);

      subtotal = roundMoney(subtotal + lineSubtotal);
      totalDiscount = roundMoney(totalDiscount + discount);

      details.push({
        videoGameId: game.id,
        quantity: requested.quantity,
        unitPrice: game.price,
        discount,
        subtotal: lineTotal,
        digitalKeys: await generateDigitalKeys(requested.quantity, transaction),
      });
    }

    const total = roundMoney(subtotal - totalDiscount);
    const paid = roundMoney(payload.payments.reduce((sum, payment) => sum + payment.amount, 0));
    if (Math.abs(paid - total) > 0.01) {
      throw ApiError.badRequest(`El total pagado (${paid}) no coincide con el total de la venta (${total})`);
    }

    const methods = await db.PaymentMethod.findAll({
      where: { id: payload.payments.map((payment) => payment.paymentMethodId), isActive: true },
      transaction,
    });
    if (methods.length !== payload.payments.length) {
      throw ApiError.badRequest('Uno o más métodos de pago no son válidos');
    }

    // Tarjeta y Transferencia descuentan de una cuenta ficticia dentro de la
    // misma transacción de la venta; Efectivo solo deja constancia en caja.
    const paymentRows = [];
    for (const payment of payload.payments) {
      const method = methods.find((item) => item.id === payment.paymentMethodId);
      const { cardId, bankAccountId, ...row } = payment;
      const amount = Number(payment.amount);
      const isStaff = user.role?.name !== 'comprador';
      row.reference = payment.reference || null;

      if (method.code === 'CARD') {
        if (!cardId) throw ApiError.badRequest('Para pagar con Tarjeta debes indicar tu tarjeta');
        // Se bloquea solo la fila de la cuenta: PostgreSQL no permite
        // FOR UPDATE sobre el lado opcional de un LEFT JOIN (user/role).
        const card = await db.PaymentCard.findByPk(cardId, {
          transaction,
          lock: Transaction.LOCK.UPDATE,
        });
        if (!card || !card.isActive) {
          throw ApiError.forbidden('La tarjeta indicada no existe o no está activa');
        }
        const owner = await db.User.findByPk(card.userId, {
          transaction,
          include: [{ model: db.Role, as: 'role', attributes: ['name'] }],
        });
        // Cada comprador paga con su propia cuenta; el personal del POS cobra
        // con la cuenta del comprador que esté atendiendo.
        const isOwnCard = card.userId === user.id;
        const isBuyerCard = owner?.role?.name === 'comprador';
        if (!isOwnCard && !(isStaff && isBuyerCard)) {
          throw ApiError.forbidden('La tarjeta indicada no existe o no es de un comprador');
        }
        if (Number(card.balance) < amount) {
          throw ApiError.badRequest(
            `Saldo insuficiente en tu tarjeta ${card.brand} ****${card.cardNumber.slice(-4)}. `
            + `Disponible: ${Number(card.balance)}; requerido: ${amount}`,
          );
        }
        await card.decrement('balance', { by: amount, transaction });
        row.reference = `${card.brand} ****${card.cardNumber.slice(-4)}`;
      } else if (method.code === 'TRANSFER') {
        if (!bankAccountId) throw ApiError.badRequest('Para pagar con Transferencia debes indicar la cuenta bancaria');
        const account = await db.BankAccount.findByPk(bankAccountId, {
          transaction,
          lock: Transaction.LOCK.UPDATE,
        });
        if (!account || !account.isActive) {
          throw ApiError.forbidden('La cuenta bancaria indicada no existe o no está activa');
        }
        const owner = await db.User.findByPk(account.userId, {
          transaction,
          include: [{ model: db.Role, as: 'role', attributes: ['name'] }],
        });
        const isOwnAccount = account.userId === user.id;
        const isBuyerAccount = owner?.role?.name === 'comprador';
        if (!isOwnAccount && !(isStaff && isBuyerAccount)) {
          throw ApiError.forbidden('La cuenta indicada no existe o no es de un comprador');
        }
        if (Number(account.balance) < amount) {
          throw ApiError.badRequest(
            `Saldo insuficiente en la cuenta ${account.bank} ****${account.accountNumber.slice(-4)}. `
            + `Disponible: ${Number(account.balance)}; requerido: ${amount}`,
          );
        }
        await account.decrement('balance', { by: amount, transaction });
        // Operación ficticia: deja una referencia distinta en cada venta.
        row.reference = `${account.bank} ****${account.accountNumber.slice(-4)} · OP-${generateSaleCode().slice(3)}`;
      } else if (method.code === 'CASH') {
        row.reference = payment.reference || 'Efectivo en caja';
      }

      paymentRows.push(row);
    }

    const sale = await db.Sale.create({
      code: generateSaleCode(),
      cashShiftId: shift.id,
      customerId: payload.customerId || null,
      sellerId: user.id,
      subtotal,
      discount: totalDiscount,
      total,
    }, { transaction });

    await db.SaleDetail.bulkCreate(details.map((detail) => ({ ...detail, saleId: sale.id })), { transaction });
    await db.Payment.bulkCreate(paymentRows.map((payment) => ({ ...payment, saleId: sale.id })), { transaction });

    for (const requested of payload.items) {
      const game = games.find((item) => item.id === requested.videoGameId);
      await inventoryService.adjustStock({
        itemId: game.inventory.id,
        movementType: 'sale',
        quantity: -requested.quantity,
        reason: `Venta ${sale.code}`,
        referenceId: sale.id,
        userId: user.id,
      }, transaction);
    }

    if (payload.customerId) {
      const earned = Math.floor(toNumber(total) / 1000);
      if (earned > 0) {
        const customer = await db.Customer.findByPk(payload.customerId, { transaction, lock: Transaction.LOCK.UPDATE });
        if (!customer) throw ApiError.badRequest('El cliente indicado no existe');
        await customer.increment('points', { by: earned, transaction });
        await db.LoyaltyMovement.create({
          customerId: customer.id,
          points: earned,
          concept: `Puntos por venta ${sale.code}`,
          referenceId: sale.id,
        }, { transaction });
      }
    }

    await db.AuditLog.create({
      userId: user.id,
      action: 'SALE_CREATED',
      entity: 'Sale',
      entityId: sale.id,
      payload: {
        code: sale.code,
        total: sale.total,
        keysGenerated: details.reduce((sum, detail) => sum + detail.digitalKeys.length, 0),
      },
    }, { transaction });

    return sale.id;
  });
  return getSale(saleId, user);
};

const cancelSale = async (id, reason, user) => {
  await db.sequelize.transaction(async (transaction) => {
    // Igual que con la tarjeta: se bloquea solo la venta, nunca un LEFT JOIN.
    const sale = await db.Sale.findByPk(id, {
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });
    if (!sale) throw ApiError.notFound('Venta no encontrada');
    if (sale.status !== 'completed') throw ApiError.conflict('La venta no está activa');
    const details = await db.SaleDetail.findAll({ where: { saleId: sale.id }, transaction });

    for (const detail of details) {
      const item = await db.InventoryItem.findOne({
        where: { videoGameId: detail.videoGameId },
        transaction,
        lock: Transaction.LOCK.UPDATE,
      });
      if (item) {
        await inventoryService.adjustStock({
          itemId: item.id,
          movementType: 'return',
          quantity: detail.quantity,
          reason: `Anulación ${sale.code}: ${reason}`,
          referenceId: sale.id,
          userId: user.id,
        }, transaction);
      }
    }

    await sale.update({ status: 'cancelled', cancelledAt: new Date(), cancelReason: reason }, { transaction });
    await db.AuditLog.create({
      userId: user.id,
      action: 'SALE_CANCELLED',
      entity: 'Sale',
      entityId: sale.id,
      payload: { reason },
    }, { transaction });

  });
  return getSale(id);
};

const registerReturn = async (id, payload, user) => {
  await db.sequelize.transaction(async (transaction) => {
    const sale = await db.Sale.findByPk(id, { transaction, lock: Transaction.LOCK.UPDATE });
    if (!sale) throw ApiError.notFound('Venta no encontrada');
    if (sale.status !== 'completed') throw ApiError.conflict('Solo se pueden devolver ventas activas');
    if (toNumber(payload.amount) > toNumber(sale.total)) {
      throw ApiError.badRequest('El monto devuelto supera el total de la venta');
    }

    await db.SaleReturn.create({
      saleId: sale.id,
      reason: payload.reason,
      amount: payload.amount,
      authorizedBy: user.id,
    }, { transaction });

    await sale.update({ status: 'returned' }, { transaction });

    await db.AuditLog.create({
      userId: user.id,
      action: 'SALE_RETURNED',
      entity: 'Sale',
      entityId: sale.id,
      payload: { amount: payload.amount, reason: payload.reason },
    }, { transaction });

  });
  return getSale(id);
};

const openShift = async (user, payload) => {
  const existing = await db.CashShift.findOne({ where: { cashierId: user.id, status: 'open' } });
  if (existing) throw ApiError.conflict('Ya existe un turno abierto para este cajero');

  const shift = await db.CashShift.create({
    cashierId: user.id,
    openingAmount: payload.openingAmount || 0,
    notes: payload.notes || null,
  });
  await db.AuditLog.create({
    userId: user.id,
    action: 'SHIFT_OPENED',
    entity: 'CashShift',
    entityId: shift.id,
  });
  return shift;
};

const closeShift = async (user, payload) => {
  const shift = await db.CashShift.findOne({ where: { cashierId: user.id, status: 'open' } });
  if (!shift) throw ApiError.notFound('No hay un turno abierto para cerrar');

  const sales = await db.Sale.findAll({
    where: { cashShiftId: shift.id, status: 'completed' },
    attributes: ['total'],
  });
  const expected = roundMoney(sales.reduce((sum, sale) => sum + toNumber(sale.total), 0));
  const counted = roundMoney(payload.countedAmount || 0);

  await shift.update({
    status: 'closed',
    closedAt: new Date(),
    expectedAmount: expected,
    countedAmount: counted,
    differenceAmount: roundMoney(counted - expected),
    notes: payload.notes || shift.notes,
  });

  await db.AuditLog.create({
    userId: user.id,
    action: 'SHIFT_CLOSED',
    entity: 'CashShift',
    entityId: shift.id,
    payload: { expected, counted },
  });

  return shift;
};

const getMyShift = async (user) => db.CashShift.findOne({
  where: { cashierId: user.id, status: 'open' },
  include: [{ model: db.Sale, as: 'sales', attributes: ['id', 'code', 'total', 'status'] }],
});

const listSales = async (query = {}, user = null) => {
  const limit = Math.min(Number(query.limit) || 50, 100);
  const offset = Math.max(Number(query.offset) || 0, 0);
  const where = user && !user.permissions.includes('sales.readAll')
    ? { sellerId: user.id }
    : {};
  const { rows, count } = await db.Sale.findAndCountAll({
    where,
    include: saleIncludes,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });
  return { items: rows, total: count, limit, offset };
};

module.exports = {
  createSale, cancelSale, registerReturn,
  openShift, closeShift, getMyShift, listSales, getSale,
};
