/**
 * @openapi
 * tags: [{ name: Coupons, description: Discount coupon codes (unique, usage-limited, expiring) }]
 *
 * components:
 *   schemas:
 *     Coupon:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         code: { type: string, example: 'SUMMER20' }
 *         description: { type: string, nullable: true }
 *         type: { type: string, enum: [PERCENTAGE, FIXED] }
 *         value: { type: number }
 *         minimumPurchase: { type: number, nullable: true }
 *         maximumDiscount: { type: number, nullable: true, description: 'Caps a percentage discount' }
 *         usageLimit: { type: integer, nullable: true, description: 'null = unlimited' }
 *         usageCount: { type: integer }
 *         perUserLimit: { type: integer, nullable: true }
 *         startDate: { type: string, format: date-time }
 *         endDate: { type: string, format: date-time }
 *         isActive: { type: boolean }
 *         isDeleted: { type: boolean }
 *         status: { type: string, enum: [ACTIVE, INACTIVE, EXPIRED] }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CreateCouponBody:
 *       type: object
 *       required: [code, type, value, startDate, endDate]
 *       properties:
 *         code: { type: string, minLength: 3, maxLength: 32, example: 'SUMMER20' }
 *         description: { type: string, maxLength: 500 }
 *         type: { type: string, enum: [PERCENTAGE, FIXED] }
 *         value: { type: number }
 *         minimumPurchase: { type: number }
 *         maximumDiscount: { type: number }
 *         usageLimit: { type: integer }
 *         perUserLimit: { type: integer }
 *         startDate: { type: string, format: date-time }
 *         endDate: { type: string, format: date-time }
 *         isActive: { type: boolean, default: true }
 *
 * /coupons:
 *   get:
 *     tags: [Coupons]
 *     summary: List coupons
 *     parameters:
 *       - { in: query, name: type, schema: { type: string, enum: [PERCENTAGE, FIXED] } }
 *       - { in: query, name: isActive, schema: { type: boolean } }
 *       - { in: query, name: search, schema: { type: string } }
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Coupons]
 *     summary: Create a coupon
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/CreateCouponBody' } } } }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Percentage out of range / start after end }
 *       409: { description: Duplicate code }
 *
 * /coupons/validate:
 *   get:
 *     tags: [Coupons]
 *     summary: Validate a coupon against a cart total (dry-run, no side effects)
 *     parameters:
 *       - { in: query, name: code, required: true, schema: { type: string } }
 *       - { in: query, name: cartTotal, required: true, schema: { type: number, minimum: 0 } }
 *     responses:
 *       200:
 *         description: Valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     coupon: { $ref: '#/components/schemas/Coupon' }
 *                     discount: { type: number }
 *                     grandTotalAfter: { type: number }
 *       400: { description: Expired / inactive / minimum purchase not met / usage limit reached }
 *       404: { description: Coupon not found }
 *
 * /coupons/{id}:
 *   get:    { tags: [Coupons], summary: Get coupon, parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }], responses: { 200: { description: OK }, 404: { description: Not found } } }
 *   put:    { tags: [Coupons], summary: Update coupon, parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }], responses: { 200: { description: OK }, 400: { description: Rule violation }, 404: { description: Not found }, 409: { description: Duplicate } } }
 *   delete: { tags: [Coupons], summary: Soft-delete coupon, parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }], responses: { 204: { description: Deleted }, 404: { description: Not found } } }
 */
export {};
