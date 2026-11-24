# Proyecto Juegos

Plataforma web de gestión para una **tienda de videojuegos**. Un solo sistema: catálogo, punto de venta, inventario, clientes, promociones, reportes y auditoría.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 18 + Vite + React Router |
| Backend | Node.js + Express |
| ORM | Sequelize |
| Base de datos | PostgreSQL 16 (Docker) / Supabase (pendiente) |
| Autenticación | JWT propio (HS256) + contraseñas scrypt. Supabase Auth: pendiente |
| Autorización | RBAC (roles, permisos) + RLS opcional |
| Seguridad | Helmet, CORS restringido, rate limit (general y de login), Zod, CSP, request-id |
| Infraestructura | Docker Compose, Kubernetes, AWS (guía) |

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

## Inicio rápido (Docker)

```bash
cd ProyectoJuegos
docker compose up --build
```

No requiere crear `.env`: el compose trae valores por defecto para desarrollo.
Si quieres personalizarlos, copia el ejemplo (opcional):

```bash
cp .env.example .env   # opcional: cambia JWT_SECRET, DB_PASSWORD, etc.
```

Servicios:

| Servicio | Dirección |
| --- | --- |
| Web (página con su propia URL por ruta) | http://localhost:5173 |
| Punto de venta | http://localhost:5173/ventas |
| Catálogo | http://localhost:5173/catalogo |
| API | http://localhost:4000/api/v1 |
| Health API | http://localhost:4000/health |
| Base de datos | localhost:5432 (proyecto_juegos) |

Cada pantalla tiene su propia dirección (React Router): `/login`, `/`, `/catalogo`,
`/ventas`, `/historial`, `/inventario`, `/clientes`, `/reportes`. Nginx sirve el
SPA con `try_files` para que esas URLs funcionen al refrescar el navegador.

Al levantarse, el contenedor del backend espera a PostgreSQL, aplica las
migraciones y carga los datos iniciales (roles, cuentas y catálogo).

### Cuentas de demostración

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | admin@proyectojuegos.local | Admin2026! |
| Gerente | gerente@proyectojuegos.local | Gerente2026! |
| Vendedor | vendedor@proyectojuegos.local | Vendedor2026! |
| Cajero | cajero@proyectojuegos.local | Cajero2026! |

- **Administrador / Gerente**: crean y editan juegos, precios, estado y stock.
- **Vendedor / Cajero**: venden en el punto de venta, registran clientes y
  consultan inventario (solo lectura en catálogo y stock).

> Cambia estas contraseñas antes de cualquier uso real.

### Sin Docker

```bash
createdb proyecto_juegos
psql "$DATABASE_URL" -f database/schema.sql

cd backend
npm install
npm run migrate
npm run seed
npm run dev

# otra terminal
cd frontend
npm install
npm run dev
```

## Autenticación

1. El usuario se identifica en `POST /api/v1/auth/login` con correo y contraseña.
2. El backend verifica la contraseña con **scrypt** (comparación en tiempo
   constante) contra `users.password_hash`; la contraseña nunca viaja en claro
   por el servidor ni se registra en logs.
3. Se firma un **JWT (HS256)** con `JWT_SECRET` y expiración de 8 horas.
4. El frontend guarda el token y lo envía como `Authorization: Bearer <token>`.
5. En cada request el backend verifica la firma y resuelve el perfil por `sub`;
   **nunca** se confía en un `userId` enviado por el cliente.
6. RBAC valida permisos por endpoint (`catalog.read`, `sales.write`, ...).

La tabla `users` almacena `password_hash` cifrado; **nunca** la contraseña en claro.

### Seguridad (celular y computadora)

- **API**: Helmet (cabeceras anti-XSS, clickjacking, sniffing), CORS restringido
  a `CORS_ORIGIN`, rate limit general y límite específico de 10 intentos de login
  cada 15 minutos por IP, validación Zod en todo payload, `express.json` limitado
  a 1 MB, `Cache-Control: no-store`, request-id para trazabilidad.
- **Contraseñas**: scrypt con salt aleatorio (16 bytes) y verificación
  `timingSafeEqual` (sin fugas por tiempo de respuesta).
- **Frontend/Nginx**: CSP estricto (sin scripts inline), `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`
  (bloquea cámara, micrófono, geolocalización y pagos del navegador) y HSTS
  listo para cuando se active HTTPS.
- **Datos**: consultas parametrizadas vía Sequelize (sin SQL concatenado),
  autorización por permiso en cada endpoint y auditoría en `audit_logs`.

## Endpoints principales

| Método | Ruta | Permiso |
| --- | --- | --- |
| POST | `/api/v1/auth/login` | público (rate limit propio) |
| GET | `/api/v1/auth/me` · `/permissions` | autenticado |
| GET | `/api/v1/games` · `/games/meta` | `catalog.read` |
| POST/PATCH | `/api/v1/games` · `/games/:id` | `catalog.write` |
| GET | `/api/v1/inventory` | `inventory.read` |
| POST | `/api/v1/inventory/:itemId/movements` | `inventory.write` |
| PATCH | `/api/v1/inventory/:itemId` (stock mínimo) | `inventory.write` |
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

## Pendientes (servicios externos)

Quedan a medias / para más adelante, a propósito, para no bloquear el proyecto:

- **Supabase Auth**: integración externa. El login actual es propio (JWT + scrypt).
  Archivo `frontend/src/services/supabase.js` marcado como pendiente.
- **Pagos en línea / pasarela**: hoy solo métodos manuales (efectivo, tarjeta,
  transferencia) registrados por el cajero.
- **HTTPS con certificado**: HSTS ya está configurado en Nginx; falta emitir el
  certificado (Let's Encrypt / ALB) y apuntar el dominio.
- **Correos y notificaciones**, recuperación de contraseña por correo y
  administración de cuentas desde la interfaz (el permiso `users.write` ya existe).
- **Despliegue en la nube**: la guía de Kubernetes/AWS está en `infrastructure/`.

## Documentación

- [Requisitos](./docs/requirements/REQUISITOS.md)
- [Arquitectura y UML](./docs/uml/ARQUITECTURA.md)
- [Manual técnico](./docs/technical-manual/BACKEND.md)
- [Manual de usuario](./docs/user-manual/MANUAL.md)
- [Plan de pruebas](./docs/testing/PLAN-PRUEBAS.md)
- [Contrato API](./docs/api/API.md)
