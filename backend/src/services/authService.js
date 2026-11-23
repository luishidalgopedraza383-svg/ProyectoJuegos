'use strict';

const db = require('../models');

const findProfileByAuthId = (authUserId) =>
  db.User.findOne({
    where: { authUserId, isActive: true },
    include: [{ model: db.Role, as: 'role', include: [{ model: db.Permission, as: 'permissions' }] }],
  });

const registerLogin = async (user) => {
  await user.update({ lastLoginAt: new Date() });
};

module.exports = { findProfileByAuthId, registerLogin };
