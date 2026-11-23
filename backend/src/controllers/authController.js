'use strict';

const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

const me = asyncHandler(async (req, res) => {
  const profile = await authService.findProfileByAuthId(req.user.authUserId);
  await authService.registerLogin(profile);

  res.json({ user: req.user });
});

const permissions = asyncHandler(async (req, res) => {
  res.json({ permissions: req.user.permissions });
});

module.exports = { me, permissions };
