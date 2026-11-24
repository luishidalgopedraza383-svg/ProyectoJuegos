'use strict';

const { z } = require('zod');

const uuid = z.string().uuid();
const positiveInt = z.number().int().positive();
const nonNegativeNumber = z.number().nonnegative();

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
    price: nonNegativeNumber,
    currency: z.string().length(3).optional(),
    releaseDate: z.string().date().optional().nullable(),
    ageRating: z.string().max(10).optional().nullable(),
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});

const updateGameSchema = z.object({
  body: createGameSchema.shape.body.partial(),
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
};
