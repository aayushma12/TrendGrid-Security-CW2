/**
 * @openapi
 * tags: [{ name: Banners, description: Promotional banners / special offers (announcement bar, hero, promo strips) }]
 *
 * components:
 *   schemas:
 *     Banner:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         placement: { type: string, enum: [ANNOUNCEMENT, HERO, PROMO] }
 *         title: { type: string, example: 'Summer 2026 Collection' }
 *         subtext: { type: string, nullable: true }
 *         ctaText: { type: string, nullable: true, example: 'Shop now' }
 *         ctaLink: { type: string, nullable: true, example: '/shop' }
 *         bgColor: { type: string, example: '#101828' }
 *         textColor: { type: string, example: '#ffffff' }
 *         sortOrder: { type: integer }
 *         startsAt: { type: string, format: date-time }
 *         expiresAt: { type: string, format: date-time }
 *         isActive: { type: boolean }
 *         isDeleted: { type: boolean }
 *         status: { type: string, enum: [ACTIVE, SCHEDULED, EXPIRED, INACTIVE] }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CreateBannerBody:
 *       type: object
 *       required: [placement, title, startsAt, expiresAt]
 *       properties:
 *         placement: { type: string, enum: [ANNOUNCEMENT, HERO, PROMO] }
 *         title: { type: string }
 *         subtext: { type: string }
 *         ctaText: { type: string }
 *         ctaLink: { type: string }
 *         bgColor: { type: string }
 *         textColor: { type: string }
 *         sortOrder: { type: integer }
 *         startsAt: { type: string, format: date-time }
 *         expiresAt: { type: string, format: date-time }
 *         isActive: { type: boolean }
 *     UpdateBannerBody:
 *       allOf:
 *         - $ref: '#/components/schemas/CreateBannerBody'
 *       description: All fields optional; at least one required.
 *
 * /banners/active:
 *   get:
 *     tags: [Banners]
 *     summary: Get currently-live banners (public, storefront)
 *     parameters:
 *       - in: query
 *         name: placement
 *         schema: { type: string, enum: [ANNOUNCEMENT, HERO, PROMO] }
 *     responses:
 *       200: { description: Active banners }
 *
 * /banners:
 *   get:
 *     tags: [Banners]
 *     summary: List banners (admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: placement
 *         schema: { type: string, enum: [ANNOUNCEMENT, HERO, PROMO] }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: Paginated banner list }
 *   post:
 *     tags: [Banners]
 *     summary: Create a banner (admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateBannerBody' }
 *     responses:
 *       201: { description: Banner created }
 *
 * /banners/{id}:
 *   get:
 *     tags: [Banners]
 *     summary: Get a banner by id (admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Banner }
 *       404: { description: Not found }
 *   put:
 *     tags: [Banners]
 *     summary: Update a banner (admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateBannerBody' }
 *     responses:
 *       200: { description: Banner updated }
 *       404: { description: Not found }
 *   delete:
 *     tags: [Banners]
 *     summary: Soft-delete a banner (admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Deleted }
 *       404: { description: Not found }
 */
export {};
