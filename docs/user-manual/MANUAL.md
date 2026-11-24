# Manual de usuario — Proyecto Juegos

## Ingresar

1. Abre la aplicación en `http://localhost:5173` (te redirige a `/login`).
2. Ingresa correo y contraseña, o usa una de las cuentas de demostración
   (el botón correspondiente autocompleta el formulario):

   | Rol | Correo | Contraseña |
   | --- | --- | --- |
   | Administrador | admin@proyectojuegos.local | Admin2026! |
   | Gerente | gerente@proyectojuegos.local | Gerente2026! |
   | Vendedor | vendedor@proyectojuegos.local | Vendedor2026! |
   | Cajero | cajero@proyectojuegos.local | Cajero2026! |

3. Si tu usuario no tiene perfil en Proyecto Juegos, un administrador debe registrarlo.

## Panel

Muestra ingresos, ventas, juegos activos, clientes y alertas de stock bajo. Se actualiza automáticamente cada 30 segundos.

## Catálogo

- Agrega un juego con título, SKU y precio.
- La tabla muestra género, plataforma, precio, stock y estado.

## Punto de venta

1. **Abrir turno** si no hay uno activo.
2. Haz clic en los juegos para agregarlos al carrito.
3. Selecciona método de pago.
4. Presiona **Cobrar**.
5. Al finalizar, **Cerrar turno**; el sistema calcula el valor esperado y la diferencia.

## Inventario

- Registra entradas, salidas o ajustes indicando cantidad y motivo.
- La tabla resalta los productos con stock por debajo del mínimo.

## Clientes

- Crea clientes con correo, nombre y datos de contacto.
- Los puntos se acumulan automáticamente con cada venta.

## Ventas

- Consulta el historial.
- Puedes anular una venta activa indicando el motivo; el stock se restaura.

## Reportes

Ingresos, ventas por día y títulos más vendidos.

> Todas las pantallas operativas se refrescan solas. El botón **Recargar** es solo un respaldo.
