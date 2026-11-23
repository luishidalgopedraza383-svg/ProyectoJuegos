'use strict';

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundMoney = (value) => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

module.exports = { toNumber, roundMoney };
