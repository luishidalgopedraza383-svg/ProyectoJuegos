# Requisitos — Proyecto Juegos

## Funcionales

| ID | Requisito |
| --- | --- |
| RF-01 | Registrar y autenticar usuarios con login propio (JWT + contraseñas cifradas). Supabase Auth queda pendiente. |
| RF-02 | Resolver perfil y permisos desde el JWT en el backend. |
| RF-03 | Gestionar catálogo de videojuegos (título, SKU, precio, género, plataforma). |
| RF-04 | Registrar entradas, salidas y ajustes de inventario. |
| RF-05 | Abrir y cerrar turno de caja por vendedor. |
| RF-06 | Registrar ventas con uno o varios juegos y pagos divididos. |
| RF-07 | Validar stock y descontarlo transaccionalmente. |
| RF-08 | Anular ventas restaurando inventario y conservando historial. |
| RF-09 | Registrar devoluciones parciales o totales. |
| RF-10 | Gestionar clientes y puntos de fidelización. |
| RF-11 | Aplicar promociones vigentes por juego. |
| RF-12 | Consultar reportes de ingresos, ventas por día y productos más vendidos. |
| RF-13 | Registrar auditoría de operaciones críticas. |
| RF-14 | Refrescar automáticamente las vistas operativas sin recarga manual. |

## No funcionales

| ID | Requisito |
| --- | --- |
| RNF-01 | API versionada bajo `/api/v1`. |
| RNF-02 | Helmet, CORS restringido y rate limiting. |
| RNF-03 | Validación de payloads con Zod; sin stack traces al cliente. |
| RNF-04 | Dinero en `NUMERIC(12,2)`, nunca `float`. |
| RNF-05 | IDs UUID y claves foráneas indexadas. |
| RNF-06 | Transacciones y bloqueo optimista/pesimista en operaciones críticas. |
| RNF-07 | Secretos únicamente en variables de entorno. |
| RNF-08 | Health checks en API y web. |
| RNF-09 | Soporte para Docker y Kubernetes. |
| RNF-10 | RLS como capa adicional cuando se use Supabase (pendiente). |

## Reglas de dominio

- precio >= 0; cantidad > 0; stock >= 0.
- Un turno abierto por cajero.
- Pago total == subtotal - descuento (tolerancia de 0.01).
- Puntos ganados = `floor(total / 1000)`.
- Promoción vigente solo si `start_date <= now <= end_date` y aplica al juego.
