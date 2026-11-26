'use strict';

const crypto = require('crypto');
const { Op, Transaction } = require('sequelize');
const db = require('../models');
const ApiError = require('../utils/ApiError');
const { bankByCode } = require('../utils/banks');
const { roundMoney } = require('../utils/money');
const { hashPassword } = require('../utils/password');
const {
  generateAccountNumber,
  generateCardNumber,
  generateExpiry,
  generateCvv,
} = require('../utils/wallet');

const MANAGE_PERMISSIONS = ['customers.write', 'sales.write'];

const splitName = (holder) => {
  const parts = String(holder || '').trim().split(/\s+/);
  return {
    firstName: parts.shift() || 'Cliente',
    lastName: parts.join(' ').slice(0, 100) || null,
  };
};

const serializeCard = (card) => (card ? {
  id: card.id,
  brand: card.brand,
  bankName: bankByCode(card.brand)?.name || card.brand,
  cardNumber: card.cardNumber,
  last4: card.cardNumber.slice(-4),
  holder: card.holder,
  expiry: card.expiry,
  cvv: card.cvv,
  balance: card.balance,
  isActive: card.isActive,
} : null);

const serializeWallet = (account, card = null, customer = null) => ({
  id: account.id,
  userId: account.userId,
  bank: account.bank,
  bankName: bankByCode(account.bank)?.name || account.bank,
  accountNumber: account.accountNumber,
  holder: account.holder,
  balance: account.balance,
  isActive: account.isActive,
  card: serializeCard(card),
  customer: customer ? { id: customer.id, email: customer.email } : null,
  owner: account.user
    ? {
      id: account.user.id,
      displayName: account.user.displayName,
      email: account.user.email,
      role: account.user.role?.name || null,
    }
    : undefined,
});

const isManager = (actor) => actor?.role?.name !== 'comprador'
  && Boolean(actor?.permissions?.some((code) => MANAGE_PERMISSIONS.includes(code)));

// Correo demo para una billetera creada desde Ventas/Clientes sin correo.
const demoEmail = (holder) => {
  const base = String(holder).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '').slice(0, 40) || 'comprador';
  return `${base}.${crypto.randomBytes(3).toString('hex')}@billetera.demo`;
};

// Crea un comprador con credenciales internas aleatorias: la billetera siempre
// debe pertenecer a un comprador para que el POS pueda cobrarla. La contraseña
// no se entrega ni se muestra (el registro público es la vía con contraseña).
const createBuyer = async ({ holder, email, transaction }) => {
  const role = await db.Role.findOne({ where: { name: 'comprador' }, transaction });
  if (!role) throw ApiError.conflict('El rol comprador no está configurado');

  const cleanEmail = String(email || demoEmail(holder)).trim().toLowerCase();
  const passwordHash = await hashPassword(crypto.randomBytes(24).toString('base64url'));

  return db.User.create({
    email: cleanEmail,
    displayName: String(holder).trim(),
    passwordHash,
    roleId: role.id,
    isActive: true,
  }, { transaction });
};

const resolveWalletOwner = async ({ actor, holder, email, transaction }) => {
  // El comprador siempre crea billeteras para sí mismo, aunque envíe correo.
  if (actor.role?.name === 'comprador') return actor;
  if (email && !isManager(actor)) {
    throw ApiError.forbidden('No puedes crear la billetera de otro usuario');
  }

  const cleanEmail = email ? String(email).trim().toLowerCase() : null;
  if (cleanEmail) {
    const user = await db.User.findOne({
      where: { email: { [Op.iLike]: cleanEmail } },
      transaction,
      include: [{ model: db.Role, as: 'role', attributes: ['name'] }],
    });
    if (user) {
      if (user.role?.name !== 'comprador') {
        throw ApiError.conflict('Ese correo pertenece a un usuario del personal; usa el registro público para crear un comprador');
      }
      return user;
    }
  }

  // Sin correo (o con uno nuevo) se crea un comprador demo automáticamente.
  return createBuyer({ holder, email: cleanEmail, transaction });
};

// Crea la billetera completa (comprador + cuenta + tarjeta + cliente) en una
// sola transacción cuando la acción viene del panel de Ventas/Clientes.
const createForActor = async ({ actor, holder, bank, initialBalance, email = null }) =>
  db.sequelize.transaction(async (transaction) => {
    const owner = await resolveWalletOwner({ actor, holder, email, transaction });
    return createWallet({
      userId: owner.id,
      holder,
      bank,
      initialBalance,
      email: owner.email,
    }, actor, { transaction });
  });

const uniqueAccountNumber = async (transaction) => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = generateAccountNumber();
    const exists = await db.BankAccount.count({ where: { accountNumber: candidate }, transaction });
    if (!exists) return candidate;
  }
  throw ApiError.conflict('No se pudo generar un número de cuenta único');
};

const uniqueCardNumber = async (transaction) => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = generateCardNumber();
    const exists = await db.PaymentCard.count({ where: { cardNumber: candidate }, transaction });
    if (!exists) return candidate;
  }
  throw ApiError.conflict('No se pudo generar un número de tarjeta único');
};

const linkCustomer = async ({ userId, email, holder, transaction }) => {
  let customer = await db.Customer.findOne({ where: { userId }, transaction });
  if (!customer && email) {
    customer = await db.Customer.findOne({
      where: { email: { [Op.iLike]: String(email).trim() } },
      transaction,
    });
  }

  if (customer) {
    if (!customer.userId) await customer.update({ userId }, { transaction });
    return customer;
  }

  const { firstName, lastName } = splitName(holder);
  return db.Customer.create({
    userId,
    email: String(email || `${userId}@billetera.demo`).trim().toLowerCase(),
    firstName,
    lastName,
  }, { transaction });
};

// Crea cuenta + tarjeta vinculadas, con el mismo saldo inicial en ambas para
// que se pueda cobrar con Tarjeta o con el banco elegido.
const createWallet = async ({ userId, holder, bank, initialBalance, email = null }, actor = null, options = {}) => {
  const bankDef = bankByCode(bank);
  if (!bankDef) throw ApiError.badRequest('El banco indicado no está disponible');

  const balance = roundMoney(initialBalance);
  if (!Number.isFinite(balance) || balance < 0) {
    throw ApiError.badRequest('El saldo inicial debe ser mayor o igual a cero');
  }

  const run = async (transaction) => {
    const accountNumber = await uniqueAccountNumber(transaction);
    const cardNumber = await uniqueCardNumber(transaction);
    const displayName = String(holder).trim();

    const account = await db.BankAccount.create({
      userId,
      bank: bankDef.code,
      accountNumber,
      holder: displayName,
      balance,
    }, { transaction });

    const card = await db.PaymentCard.create({
      userId,
      bankAccountId: account.id,
      brand: bankDef.code,
      cardNumber,
      holder: displayName,
      expiry: generateExpiry(),
      cvv: generateCvv(),
      balance,
    }, { transaction });

    const customer = await linkCustomer({ userId, email, holder: displayName, transaction });

    await db.AuditLog.create({
      userId: actor?.id || userId,
      action: 'WALLET_CREATED',
      entity: 'BankAccount',
      entityId: account.id,
      payload: { bank: bankDef.code, initialBalance: balance, cardLast4: cardNumber.slice(-4) },
    }, { transaction });

    return serializeWallet(account, card, customer);
  };

  return options.transaction ? run(options.transaction) : db.sequelize.transaction(run);
};

// Recarga rápida: el depósito entra en la cuenta y en su tarjeta asociada.
const deposit = async (walletId, amount, actor) => {
  const value = roundMoney(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw ApiError.badRequest('El monto a depositar debe ser mayor a cero');
  }

  return db.sequelize.transaction(async (transaction) => {
    const account = await db.BankAccount.findByPk(walletId, {
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });
    if (!account || !account.isActive) throw ApiError.notFound('La billetera no existe o está inactiva');
    if (account.userId !== actor.id && !isManager(actor)) {
      throw ApiError.forbidden('Solo puedes recargar tu propia billetera');
    }

    const card = await db.PaymentCard.findOne({
      where: { bankAccountId: account.id },
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });

    await account.increment('balance', { by: value, transaction });
    if (card) await card.increment('balance', { by: value, transaction });

    await db.AuditLog.create({
      userId: actor.id,
      action: 'WALLET_DEPOSIT',
      entity: 'BankAccount',
      entityId: account.id,
      payload: { amount: value },
    }, { transaction });

    const [freshAccount, freshCard] = await Promise.all([
      db.BankAccount.findByPk(account.id, { transaction }),
      card ? db.PaymentCard.findByPk(card.id, { transaction }) : Promise.resolve(null),
    ]);
    return serializeWallet(freshAccount, freshCard);
  });
};

const walletIncludes = (withOwner) => [
  {
    model: db.PaymentCard,
    as: 'cards',
    where: { isActive: true },
    required: false,
    order: [['createdAt', 'DESC']],
  },
  ...(withOwner ? [{
    model: db.User,
    as: 'user',
    attributes: ['id', 'displayName', 'email'],
    include: [{ model: db.Role, as: 'role', attributes: ['name'] }],
  }] : []),
];

const listMyWallets = async (userId) => {
  const accounts = await db.BankAccount.findAll({
    where: { userId, isActive: true },
    include: walletIncludes(false),
    order: [['createdAt', 'DESC']],
  });
  return accounts.map((account) => serializeWallet(account, account.cards?.[0] || null));
};

const listAllWallets = async () => {
  const accounts = await db.BankAccount.findAll({
    where: { isActive: true },
    include: walletIncludes(true),
    order: [['createdAt', 'DESC']],
  });
  return accounts.map((account) => serializeWallet(account, account.cards?.[0] || null));
};

module.exports = {
  createWallet,
  createForActor,
  deposit,
  listMyWallets,
  listAllWallets,
  serializeWallet,
  serializeCard,
  isManager,
};
