# Plan de pruebas — Proyecto Juegos

## Funcionales

| Caso | Resultado esperado |
| --- | --- |
| Venta de un juego | Descuenta stock, crea venta y auditoría. |
| Venta con varios juegos y pago dividido | Totales y pagos cuadran; stock de cada juego correcto. |
| Venta sin stock | 409 y ninguna escritura. |
| Venta sin turno abierto | 409. |
| Pago menor al total | 400. |
| Promoción vencida | Sin descuento. |
| Anulación | Stock restaurado, estado `cancelled`, historial conservado. |
| Devolución mayor al total | 400. |
| Dos turnos abiertos | 409 por índice único y validación de servicio. |
| Cierre de turno con diferencia | `differenceAmount` calculado. |
| Cliente con puntos | `loyalty_movements` y `points` actualizados. |

## Seguridad

- Token inválido → 401.
- Token expirado → 401.
- Usuario sin permiso → 403.
- Payload inválido → 400 con `details`.
- Rate limit → 429.
- SQL injection / XSS → rechazado por Sequelize y validación.
- CORS solo permite `CORS_ORIGIN`.
- Errores 500 sin stack trace.

## Concurrencia

- Dos ventas simultáneas del último juego: una exitosa, otra 409.
- Verificar con `SELECT ... FOR UPDATE` que no haya stock negativo.

## Integrada final

1. Abrir turno.
2. Crear cliente.
3. Registrar entrada de inventario.
4. Vender con promoción y pago dividido.
5. Consultar reportes.
6. Anular venta.
7. Cerrar turno.
8. Verificar auditoría y movimientos.
