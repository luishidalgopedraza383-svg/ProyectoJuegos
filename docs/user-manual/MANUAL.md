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
   | Comprador 1 | comprador1@proyectojuegos.local | Comprador2026! |
   | Comprador 2 | comprador2@proyectojuegos.local | Comprador2026! |

   Los **compradores** solo pueden comprar: ven el catálogo, compran con su
   tarjeta BCP y consultan sus propias compras.

3. Si tu usuario no tiene perfil en Proyecto Juegos, un administrador debe registrarlo.

## Panel

Muestra ingresos, ventas, juegos activos, clientes y alertas de stock bajo. Se actualiza automáticamente cada 30 segundos.

## Catálogo

- Agrega un juego con título, SKU y precio en **dólares**: entero entre 10 y 60 USD, sin decimales.
- La tabla muestra género, plataforma, precio, stock y estado.

## Punto de venta

1. **Abrir turno** si no hay uno activo (en la compra directa se abre solo).
2. Haz clic en los juegos para agregarlos al carrito.
3. Elige el medio de pago: **Tarjeta**, **Transferencia** o **Efectivo**.
   - Con **Tarjeta** o **Transferencia** se muestra la cuenta ficticia del
     comprador (la tuya si eres comprador): banco, número enmascarado, titular
     y saldo disponible. Cada comprador tiene su propia tarjeta y su propia
     cuenta bancaria, ambas con 500 USD.
   - Con **Efectivo** solo se registra el pago en el turno; no se descuenta de
     ninguna cuenta.
4. Presiona **Cobrar**: el stock baja, el saldo de la cuenta elegida se debita
   (si es Tarjeta o Transferencia) y aparecen las **claves digitales**.
5. Al finalizar, **Cerrar turno**; el sistema calcula el valor esperado y la diferencia.

## Comprar desde la tienda

1. En **Tienda pública** o **Catálogo**, pulsa **Añadir al carrito** para
   acumular uno o más juegos (el contador aparece en **Carrito** de la
   cabecera), o pulsa **Comprar** para la compra directa de un solo juego.
2. Revisa y ajusta cantidades en **Carrito** (`/carrito`): con **−** / **+**
   cambias las unidades (sin pasar del stock), con **Quitar** eliminas un
   juego y con **Vaciar carrito** lo dejas en cero.
3. Pulsa **Ir a pagar**: llegas al punto de venta con **todo el carrito
   precargado** y, si no hay turno, se abre solo.
4. Elige **Tarjeta**, **Transferencia** o **Efectivo**. Con Tarjeta o
   Transferencia se muestra **tu cuenta ficticia** (número enmascarado y saldo
   disponible); con Efectivo no se descuenta saldo.
5. Pulsa **Cobrar**: el stock baja, el saldo de la cuenta elegida se debita (si
   corresponde) y aparecen las **claves digitales** de cada juego comprado. Si
   el cobro falla (por ejemplo, saldo insuficiente), el carrito se restaura
   como estaba.

> El carrito se guarda **por cuenta**: si cierras sesión y entras con otro
> comprador, verás su carrito (o uno vacío), nunca los juegos de la cuenta
> anterior. Al volver a entrar con la misma cuenta, recuperas el tuyo.
6. Guarda las claves y consulta la compra en **Mis compras**.

## Inventario

- En **Stock y movimientos** puedes **+ Aumentar** o **− Quitar** unidades con
  la cantidad deseada, o registrar entradas, salidas y ajustes con motivo.
- La tabla resalta los productos con stock por debajo del mínimo.

## Clientes

- Crea clientes con correo, nombre y datos de contacto.
- Los puntos se acumulan automáticamente con cada venta.

## Ventas

- Consulta el historial. El personal ve todas las ventas; el **comprador**
  solo ve sus propias compras.
- Quien tiene permiso de anulación (administrador, gerente, cajero) puede
  anular una venta activa indicando el motivo; el stock se restaura.

## Reportes

Ingresos, ventas por día y títulos más vendidos.

> Todas las pantallas operativas se refrescan solas. El botón **Recargar** es solo un respaldo.
