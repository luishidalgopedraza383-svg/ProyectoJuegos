'use strict';

const db = require('../models');

const listMethods = () => db.PaymentMethod.findAll({
  where: { isActive: true },
  order: [['name', 'ASC']],
});

// Tarjetas de los compradores: solo las ve el personal del punto de venta,
// para poder cobrar en el POS con la tarjeta del comprador atendido.
const listBuyerCards = async () => {
  const cards = await db.PaymentCard.findAll({
    where: { isActive: true },
    include: [{
      model: db.User,
      as: 'user',
      attributes: ['id', 'displayName', 'email'],
      required: true,
      include: [{ model: db.Role, as: 'role', attributes: ['name'], where: { name: 'comprador' }, required: true }],
    }],
    order: [['holder', 'ASC']],
  });
  return cards.map((card) => ({
    id: card.id,
    brand: card.brand,
    maskedNumber: `**** **** **** ${card.cardNumber.slice(-4)}`,
    last4: card.cardNumber.slice(-4),
    holder: card.holder,
    expiry: card.expiry,
    balance: card.balance,
    owner: { id: card.user.id, displayName: card.user.displayName, email: card.user.email },
  }));
};

// Tarjeta ficticia del usuario autenticado. El número nunca sale completo:
// solo se expone enmascarado (la venta solo necesita los últimos 4 dígitos).
const getMyCard = async (userId) => {
  const card = await db.PaymentCard.findOne({ where: { userId, isActive: true } });
  if (!card) return null;
  return {
    id: card.id,
    brand: card.brand,
    maskedNumber: `**** **** **** ${card.cardNumber.slice(-4)}`,
    last4: card.cardNumber.slice(-4),
    holder: card.holder,
    expiry: card.expiry,
    balance: card.balance,
  };
};

// Cuentas bancarias de los compradores para cobrar por Transferencia.
const listBuyerAccounts = async () => {
  const accounts = await db.BankAccount.findAll({
    where: { isActive: true },
    include: [{
      model: db.User,
      as: 'user',
      attributes: ['id', 'displayName', 'email'],
      required: true,
      include: [{ model: db.Role, as: 'role', attributes: ['name'], where: { name: 'comprador' }, required: true }],
    }],
    order: [['holder', 'ASC']],
  });
  return accounts.map((account) => ({
    id: account.id,
    bank: account.bank,
    maskedNumber: `**** **** ${account.accountNumber.slice(-4)}`,
    last4: account.accountNumber.slice(-4),
    holder: account.holder,
    balance: account.balance,
    owner: { id: account.user.id, displayName: account.user.displayName, email: account.user.email },
  }));
};

// Cuenta bancaria ficticia del usuario autenticado (Transferencia).
const getMyAccount = async (userId) => {
  const account = await db.BankAccount.findOne({ where: { userId, isActive: true } });
  if (!account) return null;
  return {
    id: account.id,
    bank: account.bank,
    maskedNumber: `**** **** ${account.accountNumber.slice(-4)}`,
    last4: account.accountNumber.slice(-4),
    holder: account.holder,
    balance: account.balance,
  };
};

module.exports = { listMethods, getMyCard, listBuyerCards, listBuyerAccounts, getMyAccount };
