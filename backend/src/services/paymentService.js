'use strict';

const db = require('../models');
const { bankByCode } = require('../utils/banks');
const { filterPayableMethods } = require('../utils/paymentMethods');

// Todas las tarjetas activas creadas en el sistema aparecen en el POS. Antes
// se filtraban por rol comprador; ahora también se muestran las billeteras
// creadas desde Ventas/Clientes por el personal.
const buyerInclude = [
  {
    model: db.User,
    as: 'user',
    attributes: ['id', 'displayName', 'email'],
    required: true,
    include: [{ model: db.Role, as: 'role', attributes: ['name'] }],
  },
];

const listBuyerCards = async () => {
  const cards = await db.PaymentCard.findAll({
    where: { isActive: true },
    include: buyerInclude,
    order: [['holder', 'ASC']],
  });
  return cards.map((card) => ({
    id: card.id,
    brand: card.brand,
    bankName: bankByCode(card.brand)?.name || card.brand,
    // Demo: se muestra el dato completo para que se vea la tarjeta creada.
    cardNumber: card.cardNumber,
    maskedNumber: `**** **** **** ${card.cardNumber.slice(-4)}`,
    last4: card.cardNumber.slice(-4),
    holder: card.holder,
    expiry: card.expiry,
    cvv: card.cvv,
    balance: card.balance,
    owner: {
      id: card.user.id,
      displayName: card.user.displayName,
      email: card.user.email,
      role: card.user.role?.name || null,
    },
  }));
};

// Tarjeta ficticia del usuario autenticado (la más reciente si tiene varias).
const getMyCard = async (userId) => {
  const card = await db.PaymentCard.findOne({
    where: { userId, isActive: true },
    order: [['createdAt', 'DESC']],
  });
  if (!card) return null;
  return {
    id: card.id,
    brand: card.brand,
    bankName: bankByCode(card.brand)?.name || card.brand,
    cardNumber: card.cardNumber,
    maskedNumber: `**** **** **** ${card.cardNumber.slice(-4)}`,
    last4: card.cardNumber.slice(-4),
    holder: card.holder,
    expiry: card.expiry,
    cvv: card.cvv,
    balance: card.balance,
  };
};

// Cuentas bancarias de todos los compradores para cobrar desde los bancos del POS.
const listBuyerAccounts = async () => {
  const accounts = await db.BankAccount.findAll({
    where: { isActive: true },
    include: buyerInclude,
    order: [['holder', 'ASC']],
  });
  return accounts.map((account) => ({
    id: account.id,
    bank: account.bank,
    bankName: bankByCode(account.bank)?.name || account.bank,
    accountNumber: account.accountNumber,
    maskedNumber: `**** **** ${account.accountNumber.slice(-4)}`,
    last4: account.accountNumber.slice(-4),
    holder: account.holder,
    balance: account.balance,
    owner: {
      id: account.user.id,
      displayName: account.user.displayName,
      email: account.user.email,
      role: account.user.role?.name || null,
    },
  }));
};

// Cuenta bancaria ficticia del usuario autenticado (la más reciente).
const getMyAccount = async (userId) => {
  const account = await db.BankAccount.findOne({
    where: { userId, isActive: true },
    order: [['createdAt', 'DESC']],
  });
  if (!account) return null;
  return {
    id: account.id,
    bank: account.bank,
    bankName: bankByCode(account.bank)?.name || account.bank,
    accountNumber: account.accountNumber,
    maskedNumber: `**** **** ${account.accountNumber.slice(-4)}`,
    last4: account.accountNumber.slice(-4),
    holder: account.holder,
    balance: account.balance,
  };
};

// Medios de pago disponibles para el usuario en el POS: siempre Tarjeta y,
// de los bancos, solo los que coinciden con alguna cuenta desde la que se
// puede debitar (la propia del comprador o las del personal).
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

module.exports = {
  listMethods, getMyCard, listBuyerCards, listBuyerAccounts, getMyAccount,
};
