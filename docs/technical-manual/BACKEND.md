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

- Rol `admin` con todos los permisos.
- Usuario de prueba con `auth_user_id` fijo (debe existir en Supabase Auth).
- 3 juegos con inventario.
- Métodos de pago: Efectivo, Tarjeta, Transferencia.

## Variables de entorno

Ver `.env.example`. En producción son obligatorias `DATABASE_URL`, `SUPABASE_JWT_SECRET` y `CORS_ORIGIN`.

## Seguridad

- JWT HS256 verificado en el backend; la identidad sale delclaim `sub`.
- Contraseñas gestionadas por Supabase Auth; no hay `passwordHash`.
- Helmet + CORS + rate limit + Zod.
- Respuestas de error sin stack traces.
- RLS opcional en `database/rls.sql`.
