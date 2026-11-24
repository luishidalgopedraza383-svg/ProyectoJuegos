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

- Roles `admin`, `gerente` y `cajero` con sus permisos.
- 4 cuentas: 1 administradora y 3 usuarios (ver README y manual de usuario).
- Plataformas PlayStation 5, Xbox Series X|S, Nintendo Switch y PC con
  14 videojuegos y su inventario.
- Métodos de pago: Efectivo, Tarjeta, Transferencia.

El seeder se salta si la base ya está poblada (no borra ventas al reiniciar).

## Variables de entorno

Ver `.env.example`. En producción son obligatorias `DATABASE_URL`, `JWT_SECRET` y `CORS_ORIGIN`.

## Seguridad

- JWT HS256 firmado por el propio backend (`JWT_SECRET`); la identidad sale del
  claim `sub` y nunca de un `userId` enviado por el cliente.
- Contraseñas cifradas con scrypt (salt aleatorio, comparación en tiempo
  constante) en `users.password_hash`; jamás en claro ni en logs.
- Login con rate limit propio (10 intentos / 15 min por IP).
- Helmet + CORS restringido + rate limit general + Zod.
- Respuestas de error sin stack traces.
- RLS opcional en `database/rls.sql`.
