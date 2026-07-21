/**
 * @openapi
 * tags:
 *   - name: Settings
 *     description: Admin-editable store commerce settings (tax, shipping, COD)
 *
 * components:
 *   schemas:
 *     StoreSettings:
 *       type: object
 *       properties:
 *         taxRate: { type: number, example: 0.13, description: Fraction (0–1) }
 *         shippingFlatRate: { type: number, example: 150 }
 *         freeShippingThreshold: { type: number, example: 5000 }
 *         codEnabled: { type: boolean }
 *         currency: { type: string, example: NPR }
 *         updatedAt: { type: string, format: date-time, nullable: true }
 *
 * /settings:
 *   get:
 *     tags: [Settings]
 *     summary: Get effective store settings
 *     description: Saved settings when present, environment defaults otherwise.
 *     responses:
 *       200:
 *         description: Store settings
 *   put:
 *     tags: [Settings]
 *     summary: Update store settings (admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/StoreSettings' }
 *     responses:
 *       200:
 *         description: Updated settings
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export {};
