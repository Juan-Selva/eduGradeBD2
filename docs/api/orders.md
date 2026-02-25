# API de Pedidos

## Introducción
El endpoint POST /api/order registra pedidos asociados a mesas, valida stock mediante la capa order-store y actualiza la mesa a pedido_en_curso. También devuelve metadatos de versionado para que los paneles invaliden caches cuando se generan pedidos.

## Endpoint
| Método | Ruta       | Descripción                              |
| ------ | ---------- | ---------------------------------------- |
| POST   | /api/order | Crea un nuevo pedido para una mesa dada. |

## Request (CreateOrderRequest)
| Campo | Tipo | Reglas |
| ----- | ---- | ------ |
| tableId | string | Mesa existente en estados libre, ocupada o pedido_en_curso. |
| items[] | objeto | menuItemId válido, quantity >= 1; admite note, modifiers (<=10) y discount opcional. |
| tipCents / serviceChargeCents | integer | Mayor o igual a 0. |
| discounts[] | objeto | Hasta 5 descuentos (type percentage|fixed, value > 0). |
| taxes[] | objeto | Hasta 5 impuestos con rate 0-1 o amountCents >= 0. |
| payment | objeto | method (efectivo|tarjeta|qr|transferencia|mixto|cortesia), amountCents opcional, status pendiente|pagado|cancelado. |
| notes / source / customer / metadata | opcional | Observaciones, origen del pedido, datos del comensal y metadatos libres. |

## Respuesta 201 (resumen)
- data.id: identificador con prefijo ord.
- data.subtotal / data.total: totales en centavos antes y después de descuentos, impuestos, propina y cargo de servicio.
- data.discountTotalCents / data.taxes: desglose de descuentos e impuestos aplicados.
- data.paymentStatus: pendiente por defecto o el valor enviado.
- metadata.version y metadata.updatedAt: control de invalidación para dashboards.

## Errores comunes
- INVALID_JSON (400): body no parseable.
- INVALID_PAYLOAD (400): validaciones de esquema fallidas.
- TABLE_NOT_FOUND (404): la mesa no existe.
- MENU_ITEM_NOT_FOUND (404): algún menú no coincide con el catálogo vigente.
- TABLE_STATE_CONFLICT (409): estado de mesa incompatible (cuenta_solicitada o pago_confirmado).
- STOCK_INSUFFICIENT (409): inventario insuficiente al reservar ítems.
- TABLE_UPDATE_FAILED (500): fallo al sincronizar la transición de mesa.
- INTERNAL_ERROR (500): error inesperado en la persistencia.

## Side-effects
- Reserva stock en data/order-store.json usando writeQueue para evitar race conditions.
- Transiciona la mesa a pedido_en_curso respetando libre -> ocupada -> pedido_en_curso.
- Genera logs con orderId, tableId, totales, códigos de error y advertencias cuando el stock cae por debajo de minStock (3).

## Notas
- IVA 21 % se aplica por defecto si no se envían impuestos; se pueden añadir impuestos adicionales en taxes[].
- Soporta tipCents y serviceChargeCents.
- POST /api/menu/orders permanece para el flujo QR legacy; POST /api/order es el contrato oficial staff/POS.
