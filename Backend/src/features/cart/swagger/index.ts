/**
 * @openapi
 * tags: [{ name: Cart, description: Persistent per-user shopping cart }]
 *
 * components:
 *   schemas:
 *     Cart:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         userId: { type: string, format: uuid }
 *         subtotal: { type: number }
 *         discountTotal: { type: number }
 *         itemCount: { type: integer }
 *         currency: { type: string }
 *         items: { type: array, items: { $ref: '#/components/schemas/CartItem' } }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CartItem:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         variantId: { type: string, format: uuid }
 *         quantity: { type: integer }
 *         productId: { type: string, format: uuid }
 *         productName: { type: string }
 *         productThumbnail: { type: string, nullable: true }
 *         variantSku: { type: string }
 *         colorName: { type: string, nullable: true }
 *         sizeName: { type: string, nullable: true }
 *         originalPrice: { type: number }
 *         unitPrice: { type: number, description: Price after any active discount }
 *         discountAmount: { type: number }
 *         lineTotal: { type: number }
 *         stock: { type: integer }
 *         isAvailable: { type: boolean }
 *         unavailableReason: { type: string, nullable: true }
 *
 * /cart/{userId}:
 *   get:
 *     tags: [Cart]
 *     summary: Get (or create) the user's cart
 *     parameters: [{ in: path, name: userId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Cart]
 *     summary: Clear the cart
 *     parameters: [{ in: path, name: userId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: Cleared } }
 *
 * /cart/{userId}/items:
 *   post:
 *     tags: [Cart]
 *     summary: Add an item to the cart
 *     parameters: [{ in: path, name: userId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [variantId, quantity]
 *             properties:
 *               variantId: { type: string, format: uuid }
 *               quantity: { type: integer, minimum: 1, maximum: 999 }
 *     responses:
 *       200: { description: OK }
 *       400: { description: Insufficient stock / inactive product or variant }
 *       404: { description: Variant not found }
 *
 * /cart/{userId}/items/{itemId}:
 *   put:
 *     tags: [Cart]
 *     summary: Update the quantity of a cart item
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: itemId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { type: object, required: [quantity], properties: { quantity: { type: integer, minimum: 1, maximum: 999 } } } } }
 *     responses: { 200: { description: OK }, 400: { description: Insufficient stock }, 404: { description: Item not found } }
 *   delete:
 *     tags: [Cart]
 *     summary: Remove an item from the cart
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: itemId, required: true, schema: { type: string, format: uuid } }
 *     responses: { 200: { description: OK }, 404: { description: Item not found } }
 */
export {};
