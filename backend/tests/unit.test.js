'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { roundMoney } = require('../src/utils/money');
const ApiError = require('../src/utils/ApiError');
const { createSaleSchema, movementSchema } = require('../src/validators/schemas');

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

test('movementSchema rechaza cantidad cero', () => {
  const itemId = '22222222-2222-4222-8222-222222222222';
  const result = movementSchema.safeParse({
    body: { movementType: 'entry', quantity: 0, reason: 'Prueba' },
    params: { itemId },
    query: {},
  });
  assert.equal(result.success, false);
});
