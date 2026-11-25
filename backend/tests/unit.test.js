'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { roundMoney } = require('../src/utils/money');
const { generateDigitalKey, DIGITAL_KEY_PATTERN } = require('../src/utils/digitalKey');
const ApiError = require('../src/utils/ApiError');
const { createSaleSchema, movementSchema, createGameSchema } = require('../src/validators/schemas');
const { signedQuantity } = require('../src/utils/stock');

test('roundMoney redondea a dos decimales', () => {
  assert.equal(roundMoney(10.005), 10.01);
  assert.equal(roundMoney('25.5'), 25.5);
  assert.equal(roundMoney(undefined), 0);
});

test('ApiError expone codigos HTTP correctos', () => {
  assert.equal(ApiError.badRequest('x').status, 400);
  assert.equal(ApiError.unauthorized().status, 401);
  assert.equal(ApiError.forbidden().status, 403);
  assert.equal(ApiError.notFound().status, 404);
  assert.equal(ApiError.conflict('x').status, 409);
});

test('createSaleSchema exige al menos un item y un pago', () => {
  const saleId = '11111111-1111-4111-8111-111111111111';
  const base = { cashShiftId: saleId, items: [], payments: [] };
  assert.equal(createSaleSchema.safeParse({ body: base, params: {}, query: {} }).success, false);

  const valid = {
    body: {
      cashShiftId: saleId,
      items: [{ videoGameId: saleId, quantity: 1 }],
      payments: [{ paymentMethodId: saleId, amount: 100 }],
    },
    params: {},
    query: {},
  };
  assert.equal(createSaleSchema.safeParse(valid).success, true);
});

test('createSaleSchema acepta cuenta bancaria para Transferencia', () => {
  const id = '33333333-3333-4333-8333-333333333333';
  const parse = (payment) => createSaleSchema.safeParse({
    body: {
      cashShiftId: id,
      items: [{ videoGameId: id, quantity: 1 }],
      payments: [{ paymentMethodId: id, amount: 40, ...payment }],
    },
    params: {},
    query: {},
  });
  assert.equal(parse({ cardId: id }).success, true);
  assert.equal(parse({ bankAccountId: id }).success, true);
  assert.equal(parse({ cardId: 'no-es-uuid' }).success, false);
});

test('generateDigitalKey genera claves con formato XXXXX-XXXXX-XXXXX', () => {
  const keys = new Set(Array.from({ length: 200 }, () => generateDigitalKey()));
  assert.equal(keys.size, 200, 'las claves no deben repetirse');
  for (const key of keys) {
    assert.match(key, DIGITAL_KEY_PATTERN);
    assert.equal(key.length, 17);
  }
});

test('movementSchema rechaza cantidad cero', () => {
  const itemId = '22222222-2222-4222-8222-222222222222';
  const result = movementSchema.safeParse({
    body: { movementType: 'entry', quantity: 0, reason: 'Prueba' },
    params: { itemId },
    query: {},
  });
  assert.equal(result.success, false);
});

test('createGameSchema exige precio USD entero entre 10 y 60', () => {
  const parse = (price) => createGameSchema.safeParse({
    body: {
      title: 'Juego de prueba',
      sku: 'SKU-TEST-001',
      price,
    },
    params: {},
    query: {},
  });

  assert.equal(parse(10).success, true, 'acepta el mínimo de 10');
  assert.equal(parse(60).success, true, 'acepta el máximo de 60');
  assert.equal(parse(35).success, true, 'acepta valores intermedios');
  assert.equal(parse(9).success, false, 'rechaza por debajo de 10');
  assert.equal(parse(61).success, false, 'rechaza por encima de 60');
  assert.equal(parse(25.5).success, false, 'rechaza decimales');
});

test('signedQuantity: la entrada suma y la salida resta', () => {
  assert.equal(signedQuantity('entry', 3), 3);
  assert.equal(signedQuantity('exit', 3), -3);
  assert.equal(signedQuantity('exit', -2), -2, 'la salida siempre resta');
  assert.equal(signedQuantity('adjustment', -5), -5, 'el ajuste respeta el signo');
});
