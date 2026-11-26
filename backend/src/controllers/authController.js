'use strict';

const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const { setSessionCookies, clearSessionCookies } = require('../utils/cookies');

// El token JWT nunca se devuelve en el body: viaja en una cookie HttpOnly.
// La respuesta incluye el valor de CSRF para que el frontend lo reenvíe.
const withSession = (res, result, status = 200) => {
  const { token, ...body } = result;
  const csrfToken = setSessionCookies(res, token);
  res.status(status).json({ ...body, csrfToken });
};

const login = asyncHandler(async (req, res) => {
  withSession(res, await authService.login(req.validated.body));
});

const register = asyncHandler(async (req, res) => {
  withSession(res, await authService.register(req.validated.body), 201);
});

const logout = asyncHandler(async (_req, res) => {
  clearSessionCookies(res);
  res.json({ ok: true });
});

const me = asyncHandler(async (req, res) => {
  const profile = await authService.findProfileByAuthId(req.user.authUserId || req.user.id);
  await authService.registerLogin(profile);

  res.json({ user: req.user });
});

const permissions = asyncHandler(async (req, res) => {
  res.json({ permissions: req.user.permissions });
});

module.exports = { login, register, logout, me, permissions };
