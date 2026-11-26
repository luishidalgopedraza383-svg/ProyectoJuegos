'use strict';

const asyncHandler = require('../utils/asyncHandler');
const walletService = require('../services/walletService');

const mine = asyncHandler(async (req, res) => {
  res.json({ items: await walletService.listMyWallets(req.user.id) });
});

// El personal (Clientes/Ventas) ve todas las billeteras creadas.
const all = asyncHandler(async (req, res) => {
  res.json({ items: await walletService.listAllWallets() });
});

const create = asyncHandler(async (req, res) => {
  const { holder, bank, initialBalance, email } = req.validated.body;
  // Desde Ventas/Clientes se crea también el comprador demo cuando no se
  // indica un correo, para que la tarjeta pueda usarse en el POS.
  const wallet = await walletService.createForActor({
    actor: req.user,
    holder,
    bank,
    initialBalance,
    email,
  });
  res.status(201).json({ wallet });
});

const deposit = asyncHandler(async (req, res) => {
  const wallet = await walletService.deposit(
    req.validated.params.id,
    req.validated.body.amount,
    req.user,
  );
  res.json({ wallet });
});

module.exports = { mine, all, create, deposit };
