/**
 * @openapi
 * tags: [{ name: Orders, description: Order lifecycle, state machine, payment status }]
 *
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         productId: { type: string, format: uuid }
 *         variantId: { type: string, format: uuid }
 *         productName: { type: string }
 *         variantSku: { type: string }
 *         colorName: { type: string, nullable: true }
 *         sizeName: { type: string, nullable: true }
 *         imageUrl: { type: string, nullable: true }
 *         originalPrice: { type: number }
 *         unitPrice: { type: number }
 *         discountAmount: { type: number }
 *         quantity: { type: integer }
 *         lineTotal: { type: number }
 *     Order:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         orderNumber: { type: string, example: 'ORD-20260706-000001' }
 *         invoiceNumber: { type: string, example: 'INV-20260706-000001' }
 *         userId: { type: string, format: uuid }
 *         status: { type: string, enum: [PENDING, CONFIRMED, PACKED, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, RETURNED, REFUNDED] }
 *         paymentStatus: { type: string, enum: [PENDING, PAID, FAILED, REFUNDED] }
 *         subtotal: { type: number }
 *         discountAmount: { type: number }
 *         couponCode: { type: string, nullable: true }
 *         couponDiscount: { type: number }
 *         shippingCharge: { type: number }
 *         taxAmount: { type: number }
 *         grandTotal: { type: number }
 *         currency: { type: string }
 *         shippingAddress: { type: object }
 *         billingAddress: { type: object }
 *         customerNote: { type: string, nullable: true }
 *         items: { type: array, items: { $ref: '#/components/schemas/OrderItem' } }
 *         placedAt: { type: string, format: date-time }
 *         confirmedAt: { type: string, format: date-time, nullable: true }
 *         packedAt: { type: string, format: date-time, nullable: true }
 *         shippedAt: { type: string, format: date-time, nullable: true }
 *         outForDeliveryAt: { type: string, format: date-time, nullable: true }
 *         deliveredAt: { type: string, format: date-time, nullable: true }
 *         cancelledAt: { type: string, format: date-time, nullable: true }
 *         returnedAt: { type: string, format: date-time, nullable: true }
 *         refundedAt: { type: string, format: date-time, nullable: true }
 *
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: List orders
 *     parameters:
 *       - { in: query, name: page,          schema: { type: integer } }
 *       - { in: query, name: limit,         schema: { type: integer } }
 *       - { in: query, name: search,        schema: { type: string, description: 'orderNumber / invoiceNumber' } }
 *       - { in: query, name: userId,        schema: { type: string, format: uuid } }
 *       - { in: query, name: status,        schema: { type: string, enum: [PENDING, CONFIRMED, PACKED, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, RETURNED, REFUNDED] } }
 *       - { in: query, name: paymentStatus, schema: { type: string, enum: [PENDING, PAID, FAILED, REFUNDED] } }
 *       - { in: query, name: from,          schema: { type: string, format: date-time } }
 *       - { in: query, name: to,            schema: { type: string, format: date-time } }
 *       - { in: query, name: sortBy,        schema: { type: string, enum: [placedAt, createdAt, grandTotal] } }
 *       - { in: query, name: sortOrder,     schema: { type: string, enum: [asc, desc] } }
 *     responses: { 200: { description: OK } }
 *
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get an order
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *
 *   put:
 *     tags: [Orders]
 *     summary: Admin update — shipping/billing address and customer note
 *     description: |
 *       Items, totals, coupon, and status are locked at placement. Only editable fields:
 *       shippingAddress, billingAddress, customerNote. Shipping address changes are refused after the
 *       order has shipped.
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shippingAddress: { $ref: '#/components/schemas/CheckoutAddress' }
 *               billingAddress: { $ref: '#/components/schemas/CheckoutAddress' }
 *               customerNote: { type: string, maxLength: 1000, nullable: true }
 *     responses:
 *       200: { description: OK }
 *       400: { description: Address locked after shipment }
 *       404: { description: Not found }
 *
 *   delete:
 *     tags: [Orders]
 *     summary: Soft-delete an order (hides from default listings)
 *     description: |
 *       Row is preserved for accounting. Restore with POST /orders/{id}/restore.
 *       Default listings exclude soft-deleted orders.
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 204: { description: Deleted }, 404: { description: Not found } }
 *
 * /orders/{id}/restore:
 *   post:
 *     tags: [Orders]
 *     summary: Restore a soft-deleted order
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: Restored }, 404: { description: Not found } }
 *
 * /orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Advance the order status (enforces the state machine)
 *     description: |
 *       Allowed transitions:
 *       PENDING → CONFIRMED / CANCELLED;
 *       CONFIRMED → PACKED / CANCELLED;
 *       PACKED → SHIPPED / CANCELLED;
 *       SHIPPED → OUT_FOR_DELIVERY;
 *       OUT_FOR_DELIVERY → DELIVERED;
 *       DELIVERED → RETURNED;
 *       RETURNED → REFUNDED.
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [PENDING, CONFIRMED, PACKED, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, RETURNED, REFUNDED] }
 *               reason: { type: string, maxLength: 500 }
 *     responses: { 200: { description: OK }, 400: { description: Invalid transition }, 404: { description: Not found } }
 *
 * /orders/{id}/payment:
 *   patch:
 *     tags: [Orders]
 *     summary: Update payment status
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentStatus]
 *             properties:
 *               paymentStatus: { type: string, enum: [PENDING, PAID, FAILED, REFUNDED] }
 *     responses: { 200: { description: OK }, 400: { description: Invalid transition }, 404: { description: Not found } }
 *
 * /orders/{id}/invoice:
 *   get:
 *     tags: [Orders]
 *     summary: Download a PDF invoice for the order
 *     description: |
 *       Generated on demand from the immutable order snapshot (no email/SMS delivery —
 *       this is a direct file download). Available to the order's owner or an ADMIN.
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200: { description: 'PDF file (application/pdf)' }
 *       404: { description: Not found }
 *
 * /orders/{id}/cancel:
 *   post:
 *     tags: [Orders]
 *     summary: Cancel an order (only before shipment) — restores stock atomically
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { reason: { type: string, maxLength: 500 } } }
 *     responses: { 200: { description: Cancelled }, 400: { description: Cannot cancel after shipment }, 404: { description: Not found } }
 */
export {};
