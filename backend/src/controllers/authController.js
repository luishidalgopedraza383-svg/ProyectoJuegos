'use strict';

const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

const login = asyncHandler(async (req, res) => {
  res.json(await authService.login(req.validated.body));
});

const register = asyncHandler(async (req, res) => {
  res.status(201).json(await authService.register(req.validated.body));
});

const me = asyncHandler(async (req, res) => {
  const profile = await authService.findProfileByAuthId(req.user.authUserId || req.user.id);
  await authService.registerLogin(profile);

  res.json({ user: req.user });
});

const permissions = asyncHandler(async (req, res) => {
  res.json({ permissions: req.user.permissions });
});

module.exports = { login, register, me, permissions };
