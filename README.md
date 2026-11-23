# Proyecto Juegos

Plataforma web de gestión para una **tienda de videojuegos**. Un solo sistema: catálogo, punto de venta, inventario, clientes, promociones, reportes y auditoría.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 18 + Vite + React Router |
| Backend | Node.js + Express |
| ORM | Sequelize |
| Base de datos | PostgreSQL / Supabase |
| Autenticación | Supabase Auth + JWT (HS256) |
| Autorización | RBAC (roles, permisos) + RLS opcional |
| Seguridad | Helmet, CORS restringido, rate limit, Zod, request-id |
| Infraestructura | Docker, Kubernetes, AWS (guía) |

## Estructura

```text
ProyectoJuegos/
├── backend/                 # API REST /api/v1
│   ├── src/
│   │   ├── config/          # entorno y conexion
│   │   ├── controllers/     # request/response
│   │   ├── middlewares/     # auth, RBAC, validacion, errores
│   │   ├── models/          # modelos Sequelize
│   │   ├── repositories/    # acceso a datos
│   │   ├── routes/          # endpoints
│   │   ├── services/        # reglas de negocio
│   │   ├── utils/           # utilidades
│   │   ├── app.js
│   │   └── server.js
│   ├── migrations/
│   ├── seeders/
│   └── Dockerfile
├── frontend/                # SPA React
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   └── Dockerfile
├── database/                # DDL y politicas RLS
├── docs/                    # requisitos, UML, manuales, pruebas
├── infrastructure/          # kubernetes y aws
├── docker-compose.yml
├── .env.example
└── RAMAS.md                 # equipo y comandos Git
```

## Arquitectura en capas

```text
routes → controllers → services → repositories → models/database
```

Las reglas de negocio (ventas, inventario, turnos) viven en `services/` y se ejecutan dentro de transacciones con bloqueo de fila.

## Inicio rápido

```bash
cd ProyectoJuegos
cp .env.example .env
# Edita .env con tus credenciales de PostgreSQL y Supabase

docker compose up --build
```

- Web: http://localhost:5173
- API: http://localhost:4000/api/v1
- Health: http://localhost:4000/health

Sin Docker:

```bash
createdb proyecto_juegos
psql "$DATABASE_URL" -f database/schema.sql

cd backend
npm install
npm run seed
npm run dev

# otra terminal
cd frontend
npm install
npm run dev
```

## Autenticación

1. El usuario inicia sesión en Supabase Auth desde el frontend.
2. El frontend envía el `access_token` como `Authorization: Bearer <token>`.
3. El backend verifica la firma HS256 con `SUPABASE_JWT_SECRET`.
4. El `sub` del JWT se usa para resolver el perfil en `users`; **nunca** se confía en un `userId` del cliente.
5. RBAC valida permisos por endpoint (`catalog.read`, `sales.write`, ...).

La tabla `users` **no** almacena contraseñas.

## Endpoints principales

| Método | Ruta | Permiso |
| --- | --- | --- |
| GET | `/api/v1/auth/me` | autenticado |
| GET/POST | `/api/v1/games` | `catalog.read` / `catalog.write` |
| GET | `/api/v1/inventory` | `inventory.read` |
| POST | `/api/v1/inventory/:itemId/movements` | `inventory.write` |
| GET | `/api/v1/payments/methods` | `sales.read` |
| GET/POST | `/api/v1/sales` | `sales.read` / `sales.write` |
| POST | `/api/v1/sales/:id/cancel` | `sales.write` |
| POST | `/api/v1/sales/:id/returns` | `sales.write` |
| GET/POST | `/api/v1/sales/shifts/open` · `/close` · `/me` | `sales.write` / `sales.read` |
| GET/POST | `/api/v1/customers` | `customers.read` / `customers.write` |
| GET | `/api/v1/reports/summary` · `/top-games` · `/sales-by-day` | `reports.read` |

## Reglas de negocio destacadas

- Un cajero no puede tener dos turnos abiertos (índice único parcial).
- Una venta valida turno abierto, precios del backend, stock y suma de pagos.
- Inventario y venta se escriben en la misma transacción con `SELECT ... FOR UPDATE`.
- Anular una venta restaura el stock y deja trazabilidad.
- Las devoluciones no pueden superar el total vendido.
- Las ventas nunca se eliminan físicamente: cambian de estado.
- Toda operación crítica genera registro en `audit_logs`.

## Identidad visual

Tipografías propias: `Orbitron` (títulos), `Space Grotesk` (interfaz), `JetBrains Mono` (cifras, con `tabular-nums`). Definidas en `frontend/src/styles/tokens.css`.

## Ramas del equipo

Ver [RAMAS.md](./RAMAS.md). El repositorio se inicializa con exactamente tres ramas: `Fabio`, `Marco` y `Luis`.

## Documentación

- [Requisitos](./docs/requirements/REQUISITOS.md)
- [Arquitectura y UML](./docs/uml/ARQUITECTURA.md)
- [Manual técnico](./docs/technical-manual/BACKEND.md)
- [Manual de usuario](./docs/user-manual/MANUAL.md)
- [Plan de pruebas](./docs/testing/PLAN-PRUEBAS.md)
- [Contrato API](./docs/api/API.md)
