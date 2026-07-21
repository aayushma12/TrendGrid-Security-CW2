/**
 * @openapi
 * tags:
 *   - name: Homepage
 *     description: Storefront homepage CMS — section order, visibility, and editable content
 *
 * components:
 *   schemas:
 *     HomeField:
 *       type: object
 *       properties:
 *         key: { type: string }
 *         label: { type: string }
 *         type: { type: string, enum: [text, textarea, image] }
 *         value: { type: string }
 *     HomeRepeaterFieldDef:
 *       type: object
 *       properties:
 *         key: { type: string }
 *         label: { type: string }
 *         type: { type: string, enum: [text, textarea, image] }
 *     HomeRepeater:
 *       type: object
 *       properties:
 *         key: { type: string }
 *         label: { type: string }
 *         itemNoun: { type: string }
 *         itemFields: { type: array, items: { $ref: '#/components/schemas/HomeRepeaterFieldDef' } }
 *         items: { type: array, items: { type: object, additionalProperties: { type: string } } }
 *     HomeSectionContent:
 *       type: object
 *       properties:
 *         note: { type: string }
 *         fields: { type: array, items: { $ref: '#/components/schemas/HomeField' } }
 *         repeaters: { type: array, items: { $ref: '#/components/schemas/HomeRepeater' } }
 *     HomepageSection:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         key: { type: string, example: 'sec_hero' }
 *         name: { type: string, example: 'Hero' }
 *         description: { type: string, nullable: true }
 *         visible: { type: boolean }
 *         sortOrder: { type: integer }
 *         content: { $ref: '#/components/schemas/HomeSectionContent' }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *
 * /homepage:
 *   get:
 *     tags: [Homepage]
 *     summary: List visible homepage sections (storefront)
 *     description: Public read — only visible:true sections, ordered by sortOrder. Used to render the live homepage.
 *     security: []
 *     responses: { 200: { description: OK } }
 *
 * /homepage/admin:
 *   get:
 *     tags: [Homepage]
 *     summary: List every homepage section (admin CMS)
 *     description: Includes hidden sections, ordered by sortOrder.
 *     responses: { 200: { description: OK } }
 *
 * /homepage/reorder:
 *   patch:
 *     tags: [Homepage]
 *     summary: Reorder homepage sections
 *     description: Body must contain every existing section id, each exactly once. sortOrder is set to the array index.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order]
 *             properties:
 *               order: { type: array, items: { type: string, format: uuid } }
 *     responses:
 *       200: { description: OK }
 *       400: { description: order does not exactly match the existing section ids }
 *
 * /homepage/{id}:
 *   get:
 *     tags: [Homepage]
 *     summary: Get a single section (admin)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *
 * /homepage/{id}/content:
 *   put:
 *     tags: [Homepage]
 *     summary: Replace a section's content (fields + repeaters)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/HomeSectionContent' }
 *     responses: { 200: { description: OK }, 404: { description: Not found }, 422: { description: Validation failed } }
 *
 * /homepage/{id}/visibility:
 *   patch:
 *     tags: [Homepage]
 *     summary: Show or hide a section
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, required: [visible], properties: { visible: { type: boolean } } }
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *
 * /homepage/{id}/image:
 *   post:
 *     tags: [Homepage]
 *     summary: Upload an image asset for this section's content
 *     description: >
 *       Uploads to Cloudinary and returns { url, publicId }. Does not modify the
 *       section's content — copy `url` into the target field/repeater item's
 *       `value` and save it via PUT /homepage/{id}/content.
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema: { type: object, required: [image], properties: { image: { type: string, format: binary } } }
 *     responses: { 200: { description: OK }, 400: { description: Invalid file }, 404: { description: Not found } }
 */
export {};
