'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { roundMoney } = require('../src/utils/money');
const { generateDigitalKey, DIGITAL_KEY_PATTERN } = require('../src/utils/digitalKey');
const ApiError = require('../src/utils/ApiError');
const {
  createSaleSchema, movementSchema, createGameSchema,
  registerSchema, createWalletSchema, depositSchema,
} = require('../src/validators/schemas');
const { signedQuantity } = require('../src/utils/stock');
const { filterPayableMethods } = require('../src/utils/paymentMethods');
const { BANKS, bankByCode, isBankCode } = require('../src/utils/banks');
const {
  generateAccountNumber, generateCardNumber, generateExpiry, generateCvv,
} = require('../src/utils/wallet');

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

test('createSaleSchema acepta tarjeta o cuenta bancaria para los pagos', () => {
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

test('filterPayableMethods deja Tarjeta y solo los bancos con cuenta propia', () => {
  const methods = [
    { code: 'CARD', name: 'Tarjeta' },
    { code: 'BCP', name: 'Banco de Crédito de Bolivia' },
    { code: 'SOL', name: 'Banco Sol' },
    { code: 'BNB', name: 'Banco Nacional de Bolivia' },
  ];
  const bcpOnly = filterPayableMethods(methods, ['BCP']);
  assert.deepEqual(bcpOnly.map((method) => method.code), ['CARD', 'BCP']);

  const sinCuentas = filterPayableMethods(methods, []);
  assert.deepEqual(sinCuentas.map((method) => method.code), ['CARD'], 'sin cuentas solo queda Tarjeta');

  const porNombre = filterPayableMethods(methods, ['banco sol']);
  assert.deepEqual(porNombre.map((method) => method.code), ['CARD', 'SOL'], 'compara sin importar mayúsculas');
});

test('BANKS incluye los cinco bancos del formulario de billetera', () => {
  assert.deepEqual(BANKS.map((bank) => bank.code), ['BCP', 'BNB', 'ECONOMICO', 'UNION', 'MERCANTIL']);
  assert.equal(bankByCode('economico')?.name, 'Banco Económico');
  assert.equal(isBankCode('SCOTIABANK'), false);
});

test('registerSchema y createWalletSchema validan banco y saldo inicial', () => {
  const base = {
    holder: 'Juan Pérez',
    fullName: 'Juan Pérez',
    email: 'juan@ejemplo.com',
    password: 'Clave2026!',
    bank: 'ECONOMICO',
    initialBalance: 500,
  };
  const parseRegister = (payload) => registerSchema.safeParse({ body: payload, params: {}, query: {} });
  const parseWallet = (payload) => createWalletSchema.safeParse({ body: payload, params: {}, query: {} });

  assert.equal(parseRegister(base).success, true);
  assert.equal(parseWallet(base).success, true);
  assert.equal(parseRegister({ ...base, bank: 'SCOTIABANK' }).success, false);
  assert.equal(parseWallet({ ...base, initialBalance: 0 }).success, false);
  assert.equal(parseWallet({ ...base, email: 'correo-invalido' }).success, false);
});

test('depositSchema exige UUID y monto positivo', () => {
  const id = '44444444-4444-4444-8444-444444444444';
  const parse = (amount) => depositSchema.safeParse({
    body: { amount }, params: { id }, query: {},
  });
  assert.equal(parse(100).success, true);
  assert.equal(parse(0).success, false);
  assert.equal(parse(-50).success, false);
});

test('los generadores de billetera producen datos ficticios con formato válido', () => {
  assert.match(generateAccountNumber(), /^\d{16}$/);
  assert.match(generateCardNumber(), /^4\d{15}$/);
  assert.match(generateExpiry(new Date('2026-05-10T12:00:00Z')), /^12\/\d{2}$/);
  assert.match(generateCvv(), /^\d{3}$/);

  const keys = new Set(Array.from({ length: 200 }, () => generateCardNumber()));
  assert.equal(keys.size, 200, 'los números de tarjeta no deben repetirse');
});
