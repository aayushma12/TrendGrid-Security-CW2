/**
 * @openapi
 * tags: [{ name: Reviews, description: Product reviews (delivered-only, one per product per user, moderated) }]
 *
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         productId: { type: string, format: uuid }
 *         userId: { type: string, format: uuid }
 *         orderId: { type: string, format: uuid, nullable: true }
 *         rating: { type: integer, minimum: 1, maximum: 5 }
 *         title: { type: string, nullable: true }
 *         comment: { type: string, nullable: true }
 *         status: { type: string, enum: [PENDING, APPROVED, REJECTED, HIDDEN, DELETED] }
 *         adminReply: { type: string, nullable: true }
 *         adminRepliedAt: { type: string, format: date-time, nullable: true }
 *         images:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id: { type: string, format: uuid }
 *               imageUrl: { type: string }
 *               imagePublicId: { type: string }
 *               position: { type: integer }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     ReviewSummary:
 *       type: object
 *       properties:
 *         productId: { type: string, format: uuid }
 *         averageRating: { type: number, example: 4.35 }
 *         totalReviews: { type: integer }
 *         breakdown:
 *           type: object
 *           properties:
 *             '1': { type: integer }
 *             '2': { type: integer }
 *             '3': { type: integer }
 *             '4': { type: integer }
 *             '5': { type: integer }
 *
 * /reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: List reviews
 *     parameters:
 *       - { in: query, name: productId, schema: { type: string, format: uuid } }
 *       - { in: query, name: userId,    schema: { type: string, format: uuid } }
 *       - { in: query, name: status,    schema: { type: string, enum: [PENDING, APPROVED, REJECTED, HIDDEN, DELETED] } }
 *       - { in: query, name: rating,    schema: { type: integer, minimum: 1, maximum: 5 } }
 *       - { in: query, name: sortBy,    schema: { type: string, enum: [createdAt, updatedAt, rating] } }
 *     responses: { 200: { description: OK } }
 *
 *   post:
 *     tags: [Reviews]
 *     summary: Submit a review
 *     description: |
 *       User MUST have a DELIVERED order containing this product. One review per (product, user).
 *       Starts in PENDING and requires admin approval to be visible in summaries.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, userId, rating]
 *             properties:
 *               productId: { type: string, format: uuid }
 *               userId: { type: string, format: uuid }
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               title: { type: string, maxLength: 150 }
 *               comment: { type: string, maxLength: 2000 }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Not eligible / invalid rating }
 *       404: { description: Product not found }
 *       409: { description: Already reviewed }
 *
 * /reviews/{id}:
 *   get:    { tags: [Reviews], summary: Get review, parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }], responses: { 200: { description: OK }, 404: { description: Not found } } }
 *   put:    { tags: [Reviews], summary: Update review (returns to PENDING), parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }], responses: { 200: { description: OK }, 404: { description: Not found } } }
 *   delete: { tags: [Reviews], summary: Hard-delete review, parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }], responses: { 204: { description: Deleted }, 404: { description: Not found } } }
 *
 * /reviews/{id}/images:
 *   post:
 *     tags: [Reviews]
 *     summary: Add images (multipart, field "images", up to 5)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema: { type: object, required: [images], properties: { images: { type: array, items: { type: string, format: binary } } } }
 *     responses: { 200: { description: OK }, 400: { description: Missing files }, 404: { description: Not found } }
 *
 * /reviews/{id}/images/{imageId}:
 *   delete:
 *     tags: [Reviews]
 *     summary: Remove a review image
 *     parameters:
 *       - { in: path, name: id,      required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: imageId, required: true, schema: { type: string, format: uuid } }
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *
 * /reviews/{id}/approve:
 *   patch: { tags: [Reviews], summary: Admin — approve review, parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }], responses: { 200: { description: OK }, 404: { description: Not found } } }
 * /reviews/{id}/reject:
 *   patch: { tags: [Reviews], summary: Admin — reject review, parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }], responses: { 200: { description: OK }, 404: { description: Not found } } }
 * /reviews/{id}/hide:
 *   patch: { tags: [Reviews], summary: Admin — hide an approved review, parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }], responses: { 200: { description: OK }, 404: { description: Not found } } }
 * /reviews/{id}/restore:
 *   patch: { tags: [Reviews], summary: Admin — restore a hidden/rejected review to APPROVED, parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }], responses: { 200: { description: OK }, 404: { description: Not found } } }
 * /reviews/{id}/reply:
 *   post:
 *     tags: [Reviews]
 *     summary: Admin — reply to a review
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [reply], properties: { reply: { type: string, maxLength: 2000 } } }
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *
 * /reviews/summary/{productId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Product review summary (average, count, 1..5 breakdown — APPROVED only)
 *     parameters: [{ in: path, name: productId, required: true, schema: { type: string, format: uuid } }]
 *     responses:
 *       200:
 *         description: OK
 *         content: { application/json: { schema: { type: object, properties: { data: { $ref: '#/components/schemas/ReviewSummary' } } } } }
 *       404: { description: Product not found }
 */
export {};
