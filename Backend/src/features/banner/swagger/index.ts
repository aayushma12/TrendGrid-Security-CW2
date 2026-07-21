/**
 * @openapi
 * tags:
 *   - name: Banners
 *     description: Promotional banners / announcement strips (hero, promo, announcement placements)
 *
 * components:
 *   schemas:
 *     Banner:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         placement: { type: string, enum: [ANNOUNCEMENT, HERO, PROMO] }
 *         title: { type: string }
 *         subtext: { type: string, nullable: true }
 *         ctaText: { type: string, nullable: true }
 *         ctaLink: { type: string, nullable: true }
 *         bgColor: { type: string, example: '#101828' }
 *         textColor: { type: string, example: '#ffffff' }
 *         imageUrl: { type: string, nullable: true }
 *         imagePublicId: { type: string, nullable: true }
 *         sortOrder: { type: integer }
 *         startsAt: { type: string, format: date-time }
 *         expiresAt: { type: string, format: date-time }
 *         isActive: { type: boolean }
 *         isDeleted: { type: boolean }
 *         status: { type: string, enum: [ACTIVE, SCHEDULED, EXPIRED, INACTIVE], description: 'Derived, not stored.' }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *
 *     CreateBannerBody:
 *       type: object
 *       required: [placement, title, startsAt, expiresAt]
 *       properties:
 *         placement: { type: string, enum: [ANNOUNCEMENT, HERO, PROMO] }
 *         title: { type: string, maxLength: 200 }
 *         subtext: { type: string, maxLength: 300 }
 *         ctaText: { type: string, maxLength: 60 }
 *         ctaLink: { type: string, maxLength: 300 }
 *         bgColor: { type: string, example: '#101828' }
 *         textColor: { type: string, example: '#ffffff' }
 *         sortOrder: { type: integer, minimum: 0 }
 *         startsAt: { type: string, format: date-time }
 *         expiresAt: { type: string, format: date-time }
 *         isActive: { type: boolean, default: true }
 *
 *     UpdateBannerBody:
 *       type: object
 *       description: At least one field. Image is handled by its own endpoint.
 *       properties:
 *         placement: { type: string, enum: [ANNOUNCEMENT, HERO, PROMO] }
 *         title: { type: string }
 *         subtext: { type: string, nullable: true }
 *         ctaText: { type: string, nullable: true }
 *         ctaLink: { type: string, nullable: true }
 *         bgColor: { type: string }
 *         textColor: { type: string }
 *         sortOrder: { type: integer, minimum: 0 }
 *         startsAt: { type: string, format: date-time }
 *         expiresAt: { type: string, format: date-time }
 *         isActive: { type: boolean }
 *
 * /banners/active:
 *   get:
 *     tags: [Banners]
 *     summary: List currently-live banners (storefront)
 *     description: Active, not deleted, and within the startsAt/expiresAt window right now. Ordered by sortOrder asc, then newest first.
 *     security: []
 *     parameters:
 *       - { in: query, name: placement, schema: { type: string, enum: [ANNOUNCEMENT, HERO, PROMO] } }
 *     responses: { 200: { description: OK } }
 *
 * /banners:
 *   get:
 *     tags: [Banners]
 *     summary: List banners (admin)
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 10, maximum: 100 } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: placement, schema: { type: string, enum: [ANNOUNCEMENT, HERO, PROMO] } }
 *       - { in: query, name: isActive, schema: { type: boolean } }
 *       - { in: query, name: sortBy, schema: { type: string, enum: [createdAt, updatedAt, startsAt, expiresAt, sortOrder] } }
 *       - { in: query, name: sortOrder, schema: { type: string, enum: [asc, desc] } }
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Banners]
 *     summary: Create a banner
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateBannerBody' }
 *     responses:
 *       201: { description: Created }
 *       400: { description: startsAt after expiresAt, or invalid hex color }
 *       422: { description: Validation failed }
 *
 * /banners/{id}:
 *   get:
 *     tags: [Banners]
 *     summary: Get a banner
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *   put:
 *     tags: [Banners]
 *     summary: Update a banner
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateBannerBody' }
 *     responses:
 *       200: { description: OK }
 *       400: { description: startsAt after expiresAt, or invalid hex color }
 *       404: { description: Not found }
 *   delete:
 *     tags: [Banners]
 *     summary: Soft-delete a banner
 *     description: Banners are kept for audit/history and never hard-deleted.
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 204: { description: Deleted }, 404: { description: Not found } }
 *
 * /banners/{id}/image:
 *   post:
 *     tags: [Banners]
 *     summary: Upload / replace the banner image
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema: { type: object, required: [image], properties: { image: { type: string, format: binary } } }
 *     responses: { 200: { description: OK }, 400: { description: Invalid file }, 404: { description: Not found } }
 *   delete:
 *     tags: [Banners]
 *     summary: Remove the banner image
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: OK }, 400: { description: No image to remove }, 404: { description: Not found } }
 */
export {};
