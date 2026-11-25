'use strict';

const { z } = require('zod');

const uuid = z.string().uuid();
const positiveInt = z.number().int().positive();
const nonNegativeNumber = z.number().nonnegative();
// Precio en dólares, sin decimales: la tienda cotiza entre 10 y 60 USD.
const priceUsd = z.number()
  .int('El precio debe ser un número entero (sin decimales)')
  .min(10, 'El precio mínimo es 10 USD')
  .max(60, 'El precio máximo es 60 USD');

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(255),
    password: z.string().min(6).max(200),
  }),
  params: z.object({}).default({}),
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
      // Obligatorios cuando el método es Tarjeta o Transferencia (saleService).
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

module.exports = {
  loginSchema,
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
};
