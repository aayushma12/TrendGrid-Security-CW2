/**
 * @openapi
 * tags: [{ name: Wishlist, description: Persistent per-user saved-products list }]
 *
 * components:
 *   schemas:
 *     Wishlist:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         userId: { type: string, format: uuid }
 *         itemCount: { type: integer }
 *         items: { type: array, items: { $ref: '#/components/schemas/WishlistItem' } }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     WishlistItem:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         productId: { type: string, format: uuid }
 *         productName: { type: string }
 *         productThumbnail: { type: string, nullable: true }
 *         basePrice: { type: number }
 *         discountPrice: { type: number, nullable: true }
 *         currency: { type: string }
 *         isActive: { type: boolean }
 *         inStock: { type: boolean }
 *         addedAt: { type: string, format: date-time }
 *
 * /wishlist/{userId}:
 *   get:
 *     tags: [Wishlist]
 *     summary: Get (or create) the user's wishlist
 *     parameters: [{ in: path, name: userId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Wishlist]
 *     summary: Clear the wishlist
 *     parameters: [{ in: path, name: userId, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: Cleared } }
 *
 * /wishlist/{userId}/items:
 *   post:
 *     tags: [Wishlist]
 *     summary: Save a product to the wishlist
 *     parameters: [{ in: path, name: userId, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties: { productId: { type: string, format: uuid } }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Product not found }
 *       409: { description: Already saved }
 *
 * /wishlist/{userId}/items/{productId}:
 *   delete:
 *     tags: [Wishlist]
 *     summary: Remove a product from the wishlist
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: productId, required: true, schema: { type: string, format: uuid } }
 *     responses: { 200: { description: OK }, 404: { description: Item not found } }
 */
export {};
