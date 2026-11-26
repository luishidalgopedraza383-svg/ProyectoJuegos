'use strict';

const { z } = require('zod');
const { BANKS } = require('../utils/banks');

const uuid = z.string().uuid();
const positiveInt = z.number().int().positive();
const nonNegativeNumber = z.number().nonnegative();
// Precio en dólares, sin decimales: la tienda cotiza entre 10 y 60 USD.
const priceUsd = z.number()
  .int('El precio debe ser un número entero (sin decimales)')
  .min(10, 'El precio mínimo es 10 USD')
  .max(60, 'El precio máximo es 60 USD');

// Billetera ficticia: siempre uno de los cinco bancos del formulario.
const bankCode = z.enum(BANKS.map((bank) => bank.code));
const walletAmount = z.number()
  .positive('El monto debe ser mayor a cero')
  .max(1000000, 'El monto máximo es 1,000,000 USD');

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(255),
    password: z.string().min(6).max(200),
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});

// Registro público: crea usuario comprador + su primera billetera ficticia.
const registerSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(3, 'Ingresa el nombre completo del titular').max(120),
    email: z.string().trim().email().max(255),
    password: z.string().min(6).max(200),
    bank: bankCode,
    initialBalance: walletAmount,
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});

// Billetera creada desde Ventas/Clientes. El correo es opcional: solo lo usa
// el personal para crear la billetera de un comprador ya registrado.
const createWalletSchema = z.object({
  body: z.object({
    holder: z.string().trim().min(3, 'Ingresa el nombre completo del titular').max(80),
    bank: bankCode,
    initialBalance: walletAmount,
    email: z.string().trim().email().max(255).optional(),
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});

const depositSchema = z.object({
  body: z.object({ amount: walletAmount }),
  params: z.object({ id: uuid }),
  query: z.object({}).default({}),
});

const createGameSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(180),
    description: z.string().max(2000).optional(),
    sku: z.string().min(3).max(40),
    categoryId: uuid.optional().nullable(),
    genreId: uuid.optional().nullable(),
    platformId: uuid.optional().nullable(),
    price: priceUsd,
    // La tienda solo cotiza en dólares: no se acepta otra moneda.
    currency: z.literal('USD').optional(),
    releaseDate: z.string().date().optional().nullable(),
    ageRating: z.string().max(10).optional().nullable(),
    // Solo rutas internas: las imágenes se sirven desde este mismo origen (CSP).
    imageUrl: z.string().max(500)
      .regex(/^\/(uploads|covers)\/[A-Za-z0-9._/-]+$/, 'Ruta de portada inválida')
      .optional().nullable(),
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});

const updateGameSchema = z.object({
  // isActive también se edita desde el panel (activar/desactivar juegos).
  body: createGameSchema.shape.body.partial().extend({ isActive: z.boolean().optional() }),
  params: z.object({ id: uuid }),
  query: z.object({}).default({}),
});

const createSaleSchema = z.object({
  body: z.object({
    cashShiftId: uuid,
    customerId: uuid.optional().nullable(),
    items: z.array(z.object({
      videoGameId: uuid,
      quantity: positiveInt,
    })).min(1),
    payments: z.array(z.object({
      paymentMethodId: uuid,
      amount: nonNegativeNumber.refine((value) => value > 0, 'El monto debe ser mayor a cero'),
      reference: z.string().max(120).optional(),
      // Obligatorios cuando el método es Tarjeta o uno de los bancos (saleService).
      cardId: uuid.optional(),
      bankAccountId: uuid.optional(),
    })).min(1),
    promotionCode: z.string().max(40).optional(),
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});

const cancelSaleSchema = z.object({
  body: z.object({ reason: z.string().min(5).max(300) }),
  params: z.object({ id: uuid }),
  query: z.object({}).default({}),
});

const returnSchema = z.object({
  body: z.object({
    reason: z.string().min(5).max(300),
    amount: nonNegativeNumber.refine((value) => value > 0, 'El monto debe ser mayor a cero'),
  }),
  params: z.object({ id: uuid }),
  query: z.object({}).default({}),
});

const shiftSchema = z.object({
  body: z.object({
    openingAmount: nonNegativeNumber.optional(),
    countedAmount: nonNegativeNumber.optional(),
    notes: z.string().max(300).optional(),
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});

const movementSchema = z.object({
  body: z.object({
    movementType: z.enum(['entry', 'exit', 'adjustment']),
    quantity: z.number().int().refine((value) => value !== 0, 'La cantidad no puede ser cero'),
    reason: z.string().min(3).max(200),
  }),
  params: z.object({ itemId: uuid }),
  query: z.object({}).default({}),
});

const updateItemSchema = z.object({
  body: z.object({
    minQuantity: z.number().int().min(0).max(999999).optional(),
    itemType: z.enum(['digital_key', 'physical_copy']).optional(),
  }).refine((value) => value.minQuantity !== undefined || value.itemType !== undefined, 'Debes enviar minQuantity o itemType'),
  params: z.object({ itemId: uuid }),
  query: z.object({}).default({}),
});

const customerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    firstName: z.string().min(2).max(100),
    lastName: z.string().max(100).optional(),
    phone: z.string().max(30).optional(),
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});

const publicCatalogQuerySchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    search: z.string().trim().max(120).optional(),
    platformId: uuid.optional(),
    genreId: uuid.optional(),
    categoryId: uuid.optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  }).default({}),
});

// Catálogo del panel: onlyActive=false permite ver también los juegos
// desactivados para poder reactivarlos o cargarles stock.
const listGamesSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    search: z.string().trim().max(120).optional(),
    platformId: uuid.optional(),
    genreId: uuid.optional(),
    categoryId: uuid.optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
    onlyActive: z.enum(['true', 'false']).optional(),
  }).default({}),
});

module.exports = {
  loginSchema,
  registerSchema,
  createWalletSchema,
  depositSchema,
  createGameSchema,
  updateGameSchema,
  createSaleSchema,
  cancelSaleSchema,
  returnSchema,
  shiftSchema,
  movementSchema,
  updateItemSchema,
  customerSchema,
  publicCatalogQuerySchema,
  listGamesSchema,
};
