# Contrato API — /api/v1

Todas las rutas requieren `Authorization: Bearer <access_token>` salvo `/health`.

Formato de error:

```json
{
  "error": {
    "code": "ApiError",
    "message": "Stock insuficiente. Disponible: 2",
    "details": null,
    "requestId": "uuid"
  }
}
```

## Crear venta

```http
POST /api/v1/sales
Content-Type: application/json
```

```json
{
  "cashShiftId": "uuid",
  "customerId": "uuid|null",
  "items": [
    { "videoGameId": "uuid", "quantity": 1 }
  ],
  "payments": [
    { "paymentMethodId": "uuid", "amount": 89900, "reference": "OP-123" }
  ],
  "promotionCode": "LANZAMIENTO10"
}
```

Respuesta `201`:

```json
{
  "id": "uuid",
  "code": "GH-MXYZ-AB12",
  "subtotal": "89900.00",
  "discount": "0.00",
  "total": "89900.00",
  "status": "completed",
  "details": [],
  "payments": []
}
```

## Movimiento de inventario

```http
POST /api/v1/inventory/:itemId/movements
```

```json
{
  "movementType": "entry",
  "quantity": 10,
  "reason": "Compra a proveedor"
}
```

## Anular venta

```http
POST /api/v1/sales/:id/cancel
```

```json
{ "reason": "Error en el cobro" }
```

## Códigos de estado

| Código | Significado |
| --- | --- |
| 200 | Operación correcta |
| 201 | Recurso creado |
| 400 | Payload inválido o regla de negocio |
| 401 | Token ausente/inválido |
| 403 | Sin permiso |
| 404 | No encontrado |
| 409 | Conflicto (stock, turno, duplicado) |
| 429 | Rate limit excedido |
| 500 | Error interno (sin detalles sensibles) |
