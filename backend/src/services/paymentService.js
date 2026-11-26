'use strict';

const db = require('../models');
const { filterPayableMethods } = require('../utils/paymentMethods');

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

// Cuentas bancarias de los compradores para cobrar desde los bancos del POS.
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

// Cuenta bancaria ficticia del usuario autenticado (pago desde un banco).
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

// Medios de pago disponibles para el usuario en el POS: siempre Tarjeta y,
// de los bancos, solo los que coinciden con las cuentas desde las que se
// puede debitar (la propia del comprador o las de los compradores que cobra
// el personal). Así nadie ve un banco desde el que no se pueda pagar.
const listMethods = async (user) => {
  const isBuyer = user?.role?.name === 'comprador';
  const ownAccount = isBuyer ? await getMyAccount(user.id) : null;
  const accounts = isBuyer ? (ownAccount ? [ownAccount] : []) : await listBuyerAccounts();
  const methods = await db.PaymentMethod.findAll({
    where: { isActive: true },
    order: [['name', 'ASC']],
  });
  return filterPayableMethods(methods, accounts.map((account) => account.bank));
};

module.exports = { listMethods, getMyCard, listBuyerCards, listBuyerAccounts, getMyAccount };
