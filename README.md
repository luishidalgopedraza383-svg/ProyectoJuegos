# PlayVibe

Plataforma web de gestión para una **tienda de videojuegos**. Un solo sistema: catálogo, punto de venta, inventario, clientes, promociones, reportes y auditoría, con identidad verde neón.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 18 + Vite + React Router |
| Backend | Node.js + Express |
| ORM | Sequelize |
| Base de datos | PostgreSQL 16 (Docker) / Supabase (remoto, ya creado) |
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
| Web / vitrina pública (sin sesión) | http://localhost:5173 |
| Ingreso | http://localhost:5173/login |
| Catálogo público | http://localhost:5173/catalogo |
| Panel general (según rol) | http://localhost:5173/panel |
| Punto de venta (con sesión) | http://localhost:5173/ventas |
| Administración · juegos y precios | http://localhost:5173/admin/juegos |
| Administración · stock | http://localhost:5173/admin/stock |
| API | http://localhost:4000/api/v1 |
| Health API | http://localhost:4000/health |
| Base de datos | localhost:5432 (proyecto_juegos) |

Cada pantalla tiene su propia dirección (React Router): `/login`, `/`, `/catalogo`,
`/ventas`, `/historial`, `/inventario`, `/clientes`, `/reportes`, `/admin/juegos`
y `/admin/stock`. Nginx sirve el SPA con `try_files` para que esas URLs funcionen
al refrescar el navegador. Si inicias sesión desde una ruta protegida, al entrar
se vuelve a esa misma dirección. Las rutas no existentes muestran un 404.

### Vitrina pública vs. área privada

Sin iniciar sesión se puede entrar a `/` y `/catalogo`: se muestran los juegos
**activos con stock disponible**, sus precios y existencias. La vitrina y el
catálogo usan tarjetas grandes: la portada ocupa la izquierda y a su derecha
aparecen título, descripción, categoría, género, clasificación, formato, SKU,
stock, precio y el botón de compra. La vitrina, el catálogo y **Admin · Juegos**
permiten filtrar por **plataforma** y por **género** (botones tipo chip) y
buscar por **título o género**; los filtros se reflejan en la URL
(`?plataforma=pc&genero=terror`), así que se pueden compartir o volver atrás.
Los géneros disponibles son Acción, Aventura, Carreras, Deportes, Lucha,
Plataformas, RPG, Shooter y Terror; Shooter agrupa Halo, Gears, Call of Duty y
Battlefield. El catálogo público es **solo de consulta**: no tiene formularios de edición.
Para crear, editar, cambiar portadas o activar/desactivar juegos se usa
**Admin · Juegos** (`/admin/juegos`), accesible solo con permisos.

Los botones de compra llevan a `/login` cuando no hay sesión; la API pública
(`/api/v1/public/games` y `/api/v1/public/games/meta`) no expone datos internos y
no permite comprar (`POST /sales` responde `401` sin token).

Con sesión, cada cuenta ve solo sus secciones:

| Cuenta | Secciones |
| --- | --- |
| Administrador | Panel, tienda, catálogo, ventas, inventario, clientes, reportes y administración |
| Gerente | Panel, tienda, catálogo, ventas, inventario, clientes, reportes y administración |
| Vendedor / Cajero | Tienda, catálogo, punto de venta, historial, inventario y clientes |

El menú lateral está presente tanto en la tienda pública como en el panel, con
un botón **Ocultar menú / Mostrar menú** (y un `✕` compacto dentro de la barra).
La preferencia se guarda en el navegador: no se pierde al cambiar de página ni
al recargar. Sin sesión muestra Tienda y Catálogo; con sesión muestra las
secciones permitidas para el rol. El backend vuelve a validar los permisos.

Al levantarse, el contenedor del backend espera a PostgreSQL, aplica las
migraciones y carga los datos iniciales (roles, cuentas y catálogo) con
`ON CONFLICT DO NOTHING`: reiniciar no borra ventas ni sobrescribe el stock
editado. Para regenerar la demo desde cero: `docker compose down -v && docker compose up --build`.

### Acceso desde celular u otra computadora

La URL de la API va horneada en el build y la CSP de Nginx la usa para `connect-src`.
Si abres la página desde otro dispositivo de la misma red, define en `.env` la IP
de la máquina que corre Docker (ejemplo `192.168.1.10`):

```env
VITE_API_BASE_URL=http://192.168.1.10:4000/api/v1
API_ORIGIN=http://192.168.1.10:4000
CORS_ORIGIN=http://192.168.1.10:5173
```

Luego `docker compose up -d --build` y entra a `http://192.168.1.10:5173`.

### Cuentas de demostración

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | admin@proyectojuegos.local | Admin2026! |
| Gerente | gerente@proyectojuegos.local | Gerente2026! |
| Vendedor | vendedor@proyectojuegos.local | Vendedor2026! |
| Cajero | cajero@proyectojuegos.local | Cajero2026! |
| Comprador 1 | comprador1@proyectojuegos.local | Comprador2026! |
| Comprador 2 | comprador2@proyectojuegos.local | Comprador2026! |

- **Administrador / Gerente**: crean y editan juegos, precios, estado y stock.
- **Vendedor / Cajero**: venden en el punto de venta, registran clientes y
  consultan inventario (solo lectura en catálogo y stock).
- **Comprador 1 / Comprador 2**: **solo compran**. Ven el catálogo, compran
  con su tarjeta BCP desde el punto de venta y consultan únicamente sus
  propias compras (ven solo sus ventas y no pueden anular nada).

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

### Base de datos remota en Supabase

El proyecto `aftnpwddbpluthgzmvdr` ya tiene el esquema completo (23 tablas) y
los datos demo cargados: 6 usuarios, 18 juegos (catálogo inicial + ampliación),
stock 401 en Supabase, 3 métodos de pago, 2 tarjetas y 2 cuentas bancarias con
500 USD cada una. El catálogo ampliado también está en
`database/add-more-games.sql` y en el seeder local. El login sigue siendo propio
(JWT + scrypt); **no se usa Supabase Auth**.

- URL de la API: `https://aftnpwddbpluthgzmvdr.supabase.co`
- Clave publishable: `sb_publishable_nxcrC_SXgFdJpUCInFJ3bA_F_1aFwLQ`
- Para conectar la API Express, copia en el host el `DATABASE_URL` de
  **Project Settings → Database → Connection string** (modo *Transaction
  pooler*) y pon `DB_SSL=true`. Todas las tablas tienen RLS activo; la API
  entra con el rol `postgres`, que no queda bloqueado por RLS.

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
  fallidos cada 15 minutos por IP, validación Zod en todo payload, `express.json`
  limitado a 1 MB, timeouts de petición/cabecera, `Cache-Control: no-store`,
  request-id para trazabilidad.
- **Contraseñas**: scrypt con salt aleatorio (16 bytes) y verificación
  `timingSafeEqual` (sin fugas por tiempo de respuesta).
- **Frontend/Nginx**: CSP estricto (sin scripts inline, `connect-src` limitado al
  origen de la API), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Permissions-Policy` (bloquea cámara, micrófono,
  geolocalización y pagos del navegador), `Cross-Origin-Opener-Policy`,
  `Cross-Origin-Resource-Policy` y HSTS listo para cuando se active HTTPS.
- **Cuentas demo**: los botones de autocompletado están **desactivados por defecto**
  en la entrega final. Para una demo local se pueden activar con
  `VITE_SHOW_DEMO_ACCOUNTS=true`; las credenciales siguen documentadas abajo
  para iniciar sesión manualmente.
- **Datos**: consultas parametrizadas vía Sequelize (sin SQL concatenado),
  autorización por permiso en cada endpoint y auditoría en `audit_logs`.

## Endpoints principales

| Método | Ruta | Permiso |
| --- | --- | --- |
| POST | `/api/v1/auth/login` | público (rate limit propio) |
| GET | `/api/v1/public/games` · `/public/games/meta` | público (solo juegos activos con stock) |
| GET | `/api/v1/auth/me` · `/permissions` | autenticado |
| GET | `/api/v1/games` · `/games/meta` | `catalog.read` |
| POST/PATCH | `/api/v1/games` · `/games/:id` | `catalog.write` |
| GET | `/api/v1/inventory` | `inventory.read` |
| POST | `/api/v1/inventory/:itemId/movements` | `inventory.write` |
| PATCH | `/api/v1/inventory/:itemId` (stock mínimo) | `inventory.write` |
| GET | `/api/v1/payments/methods` · `/payments/cards/me` | `sales.read` |
| GET | `/api/v1/payments/cards` (solo tarjetas de compradores, para el POS) | `sales.read` + `sales.write` |
| GET | `/api/v1/payments/accounts/me` · `/payments/accounts` (cuentas de compradores) | `sales.read` · `sales.read` + `sales.write` |
| GET/POST | `/api/v1/sales` | `sales.read` / `sales.write` (el listado se limita a lo propio sin `sales.readAll`) |
| POST | `/api/v1/sales/:id/cancel` | `sales.write` + `sales.cancel` |
| POST | `/api/v1/sales/:id/returns` | `sales.write` + `sales.cancel` |
| GET/POST | `/api/v1/sales/shifts/open` · `/close` · `/me` | `sales.write` / `sales.read` |
| GET/POST | `/api/v1/customers` | `customers.read` / `customers.write` |
| GET | `/api/v1/reports/summary` · `/top-games` · `/sales-by-day` | `reports.read` |
| POST | `/api/v1/games/:id/image` (`multipart/form-data`, campo `image`) | `catalog.write` |

### Portadas de los videojuegos

Los juegos tienen una portada que se muestra en la tienda pública, en el
catálogo y en el panel. Para cambiarla:

1. Entra con administrador o gerente a **Admin · Juegos**.
2. En la fila del juego, pulsa **Portada** y elige un archivo JPG, PNG, WEBP o GIF
   (máximo 2 MB).
3. La imagen se guarda en el volumen `proyecto_juegos_uploads` y se sirve en
   `/uploads/...` a través de Nginx, **mismo origen** que la web (cumple la CSP).
4. **Quitar portada** vuelve a la imagen de ejemplo por plataforma.

Las portadas iniciales están en `frontend/public/covers/` (Xbox, PC y genérica)
y se asignan automáticamente al sembrar. El seeder nunca sobrescribe una portada
que hayas subido. Para cambiar el límite de 2 MB, define `MAX_UPLOAD_BYTES` en
`.env` (y `client_max_body_size` en Nginx si subes el tamaño).

## Claves digitales

Al confirmar una venta se genera **una clave aleatoria por cada juego comprado**
(con formato `XXXXX-XXXXX-XXXXX`, sin ceros ni unos para evitar confusiones).
Se guarda en `sale_details.digital_keys`, se muestra en el punto de venta al
cobrar —con botón **Copiar claves**— y queda consultable en **Historial de
ventas**. El cliente las canjea en la plataforma correspondiente.

Solo se venden claves para **Xbox, Xbox Series X|S y PC**. PlayStation y
Nintendo fueron retirados porque dejaron de entregar claves a tiendas virtuales externas;
una migración elimina esos juegos y plataformas, pero conserva cualquier título
que ya aparezca en una venta anterior (inactivo y sin stock, solo para historial).

## Medios de pago (demo)

- El POS ofrece tres medios: **Tarjeta**, **Transferencia** y **Efectivo**
  (migración `multi-payment-methods`).
- Solo los **compradores** tienen cuentas ficticias individuales: una tarjeta
  BCP y una cuenta bancaria BCP, cada una con **500 USD iniciales**. El personal
  de caja no tiene cuenta propia: cobra con la cuenta del comprador que atiende.
- Al elegir **Tarjeta** o **Transferencia**, el POS muestra la cuenta del
  comprador elegido (o la tuya, si eres comprador): banco, número enmascarado,
  titular y **saldo disponible**. **Efectivo** se registra en el turno sin
  descontar de ninguna cuenta.
- El saldo se debita en la misma transacción de la venta (junto con el stock y
  las claves): si algo falla, no se guarda nada. Un pago con saldo insuficiente
  se rechaza.
- El pago queda registrado en `payments` con una referencia enmascarada:
  `BCP ****1234` para tarjeta, `BCP ****1234 · OP-XXXX` para transferencia y
  `Efectivo en caja` para efectivo.

## Carrito de compras y compra directa

- **Añadir al carrito**: el botón de cada tarjeta agrega el juego al carrito
  (con contador en la cabecera y en el menú lateral). El carrito se guarda en
  el navegador, así que sobrevive a los cambios de pantalla y al inicio de
  sesión.
- **Página de carrito** (`/carrito`): lista los juegos con controles **−/+**
  (limitados al stock), **Quitar**, **Vaciar carrito**, total y el botón
  **Ir a pagar**.
- **Ir a pagar** abre el punto de venta con **todo el carrito precargado**
  (`/ventas?checkout=1`) y, si no hay turno, lo abre automáticamente; solo
  queda elegir el **medio de pago**, la **cuenta del comprador** (si estás en caja) y
  **Cobrar**. Si el cobro falla (saldo
  insuficiente, por ejemplo), el carrito se restaura como estaba.
- **Compra directa**: el botón **Comprar** lleva al punto de venta con
  **ese juego ya en el carrito** (`/ventas?game=<id>`, sin duplicarlo) y con
  el turno abierto. Al confirmar, el stock baja, el saldo de la cuenta elegida se
  debita y las claves digitales aparecen en pantalla y en **Mis compras**.

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
- **Pagos en línea / pasarela**: hoy solo cobro simulado con **Tarjeta**,
  **Transferencia** y **Efectivo** desde saldos ficticios en PostgreSQL; no hay
  Stripe, PayPal ni pasarela real.
- **HTTPS con certificado**: HSTS ya está configurado en Nginx; falta emitir el
  certificado (Let's Encrypt / ALB) y apuntar el dominio.
- **Correos y notificaciones** y recuperación de contraseña por correo.
- **Administración de cuentas desde la interfaz**: el panel `/admin` ya permite
  editar juegos, precios y stock; el permiso `users.write` ya existe en el
  backend, pero el CRUD de usuarios/roles queda pendiente para una siguiente entrega.
- **Despliegue en la nube**: la guía de Kubernetes/AWS está en `infrastructure/`.

## Documentación

- [Requisitos](./docs/requirements/REQUISITOS.md)
- [Arquitectura y UML](./docs/uml/ARQUITECTURA.md)
- [Manual técnico](./docs/technical-manual/BACKEND.md)
- [Manual de usuario](./docs/user-manual/MANUAL.md)
- [Plan de pruebas](./docs/testing/PLAN-PRUEBAS.md)
- [Contrato API](./docs/api/API.md)
