/**
 * @openapi
 * tags: [{ name: Checkout, description: 'Cart → validate → discounts → coupon → shipping → tax → grand total → order' }]
 *
 * components:
 *   schemas:
 *     CheckoutAddress:
 *       type: object
 *       required: [fullName, phone, addressLine1, city, postalCode, country]
 *       properties:
 *         fullName: { type: string }
 *         phone: { type: string }
 *         addressLine1: { type: string }
 *         addressLine2: { type: string }
 *         city: { type: string }
 *         state: { type: string }
 *         postalCode: { type: string }
 *         country: { type: string }
 *     CheckoutSummary:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               variantId: { type: string, format: uuid }
 *               productId: { type: string, format: uuid }
 *               productName: { type: string }
 *               productThumbnail: { type: string, nullable: true }
 *               variantSku: { type: string }
 *               colorName: { type: string, nullable: true }
 *               sizeName: { type: string, nullable: true }
 *               quantity: { type: integer }
 *               originalPrice: { type: number }
 *               unitPrice: { type: number }
 *               discountAmount: { type: number, description: 'per unit' }
 *               lineDiscount: { type: number }
 *               lineTotal: { type: number }
 *         subtotal: { type: number }
 *         discountAmount: { type: number }
 *         couponCode: { type: string, nullable: true }
 *         couponDiscount: { type: number }
 *         shippingCharge: { type: number }
 *         taxAmount: { type: number }
 *         grandTotal: { type: number }
 *         currency: { type: string }
 *
 * /checkout/preview:
 *   post:
 *     tags: [Checkout]
 *     summary: Compute a live checkout summary (dry-run, no writes)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               couponCode: { type: string }
 *     responses:
 *       200:
 *         description: Summary
 *         content: { application/json: { schema: { type: object, properties: { data: { $ref: '#/components/schemas/CheckoutSummary' } } } } }
 *       400: { description: Cart empty / item unavailable / stock issue / coupon invalid }
 *       404: { description: Cart or coupon not found }
 *
 * /checkout/place-order:
 *   post:
 *     tags: [Checkout]
 *     summary: Place an order (atomic stock decrement + snapshot pricing)
 *     description: |
 *       Recomputes the summary server-side. In a single transaction:
 *       decrements variant stock (guarded so it never goes negative),
 *       creates the Order + OrderItem snapshots, tracks coupon usage,
 *       and clears the cart. Returns the new orderNumber.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shippingAddress]
 *             properties:
 *               couponCode: { type: string }
 *               shippingAddress: { $ref: '#/components/schemas/CheckoutAddress' }
 *               billingAddress: { $ref: '#/components/schemas/CheckoutAddress' }
 *               customerNote: { type: string, maxLength: 1000 }
 *     responses:
 *       201:
 *         description: Order placed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId: { type: string, format: uuid }
 *                     orderNumber: { type: string, example: 'ORD-20260706-000001' }
 *                     summary: { $ref: '#/components/schemas/CheckoutSummary' }
 *       400: { description: Stock unavailable / rule violation }
 */
export {};
