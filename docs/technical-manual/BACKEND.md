# Manual técnico — Backend

## Estructura de capas

- `routes/`: definen endpoints y aplican `authenticate` + `requirePermission`.
- `controllers/`: leen `req.validated`, llaman al servicio y responden.
- `services/`: reglas de negocio y transacciones.
- `repositories/`: CRUD genérico sobre modelos Sequelize.
- `models/`: definición de entidades y asociaciones.
- `middlewares/`: autenticación, RBAC, validación, request-id, errores.
- `validators/`: esquemas Zod.

## Transacciones

Las operaciones críticas usan `db.sequelize.transaction()`. Se bloquean con `transaction.LOCK.UPDATE` las filas de:

- `cash_shifts` (turno del cajero).
- `inventory_items` (stock del juego).
- `sales` (anulación/devolución).
- `customers` (puntos).

Si cualquier validación falla, Sequelize hace rollback automático.

## Migraciones y seeders

```bash
cd backend
npm run migrate
npm run seed
```

La migración inicial ejecuta `database/schema.sql`. El seeder crea:

- Roles `admin`, `gerente`, `cajero` y `comprador` con sus permisos.
- 6 cuentas: 4 de operación y 2 compradores (ver README y manual de usuario).
- Plataformas Xbox Series X|S y PC con 6 videojuegos y su inventario.
  PlayStation y Nintendo se eliminaron porque dejaron de entregar claves a
  tiendas virtuales externas (migración `remove-closed-platforms`).
- Métodos de pago: **Tarjeta** y los seis bancos bolivianos **Mercantil Santa
  Cruz**, **BNB**, **Banco Unión**, **BCP**, **Banco Sol** y **Banco
  Fortaleza** (migración `bolivian-banks`). Los siete descuentan saldo en la
  misma transacción de la venta. **Efectivo** y la transferencia genérica
  quedaron inactivos (migración `multi-payment-methods`).
- `GET /payments/methods` devuelve **solo los medios con los que el usuario
  puede pagar**: siempre Tarjeta y los bancos de sus cuentas (comprador) o de
  los compradores que cobra (personal). El filtro vive en
  `utils/paymentMethods.js` (`filterPayableMethods`).
- Una **tarjeta ficticia BCP** y una **cuenta bancaria BCP** por comprador
  (500 USD iniciales cada una) en `payment_cards` y `bank_accounts`. El personal
  no tiene cuenta propia: selecciona la del comprador que atiende.

El seeder se salta si la base ya está poblada (no borra ventas al reiniciar).

## Variables de entorno

Ver `.env.example`. En producción son obligatorias `DATABASE_URL`, `JWT_SECRET` y `CORS_ORIGIN`.

## Seguridad

- JWT HS256 firmado por el propio backend (`JWT_SECRET`); la identidad sale del
  claim `sub` y nunca de un `userId` enviado por el cliente.
- La sesión del navegador viaja en la cookie HttpOnly `pj_session` (SameSite=Lax,
  Secure en producción). El frontend reenvía `pj_csrf` en `X-CSRF-Token` en
  POST/PATCH/DELETE. Los clientes API pueden seguir usando `Authorization: Bearer`.
- Contraseñas cifradas con scrypt (salt aleatorio, comparación en tiempo
  constante) en `users.password_hash`; jamás en claro ni en logs.
- Login con rate limit propio (10 intentos / 15 min por IP).
- Helmet + CORS restringido + rate limit general + Zod.
- Respuestas de error sin stack traces.
- RLS opcional en `database/rls.sql`.
