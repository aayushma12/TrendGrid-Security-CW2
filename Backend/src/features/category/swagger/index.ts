/**
 * @openapi
 * tags:
 *   - name: Categories
 *     description: Fashion e-commerce category management (hierarchical)
 *
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         name: { type: string, example: 'Men' }
 *         description: { type: string, nullable: true }
 *         imageUrl: { type: string, nullable: true, description: 'Cloudinary secure_url' }
 *         imagePublicId: { type: string, nullable: true, description: 'Cloudinary public_id' }
 *         parentCategoryId: { type: string, format: uuid, nullable: true }
 *         parent:
 *           type: object
 *           nullable: true
 *           properties:
 *             id: { type: string, format: uuid }
 *             name: { type: string }
 *         childrenCount: { type: integer, example: 3 }
 *         isFeatured: { type: boolean, example: false }
 *         isActive: { type: boolean, example: true }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *
 *     CreateCategoryBody:
 *       type: object
 *       required: [name]
 *       properties:
 *         name: { type: string, minLength: 2, maxLength: 100, example: 'T-Shirts' }
 *         description: { type: string, maxLength: 500, example: 'Casual and formal t-shirts' }
 *         parentCategoryId: { type: string, format: uuid }
 *         isFeatured: { type: boolean, default: false }
 *         isActive: { type: boolean, default: true }
 *
 *     UpdateCategoryBody:
 *       type: object
 *       description: |
 *         At least one field required. Image is NOT modifiable here — use POST /categories/{id}/image.
 *       properties:
 *         name: { type: string, minLength: 2, maxLength: 100 }
 *         description: { type: string, maxLength: 500, nullable: true }
 *         parentCategoryId: { type: string, format: uuid, nullable: true }
 *         isFeatured: { type: boolean }
 *         isActive: { type: boolean }
 *
 *     UpdateCategoryStatusBody:
 *       type: object
 *       required: [isActive]
 *       properties:
 *         isActive: { type: boolean }
 *
 *     UpdateCategoryFeatureBody:
 *       type: object
 *       required: [isFeatured]
 *       properties:
 *         isFeatured: { type: boolean }
 *
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: List categories
 *     security: []
 *     description: |
 *       Paginated list. Supports search by name, filter by isActive / isFeatured / parentCategoryId,
 *       and sort by createdAt / updatedAt / name.
 *       Pass `parentCategoryId=null` to fetch only top-level categories.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Case-insensitive match on name
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: isFeatured
 *         schema: { type: boolean }
 *       - in: query
 *         name: parentCategoryId
 *         schema: { type: string }
 *         description: A UUID, or the literal string "null" for top-level categories
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, updatedAt, name], default: createdAt }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Categories retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Category' }
 *       422: { description: Validation failed, content: { application/json: { schema: { $ref: '#/components/schemas/ApiErrorResponse' } } } }
 *   post:
 *     tags: [Categories]
 *     summary: Create a category
 *     description: |
 *       Creates a new category. Name must be unique (case-insensitive).
 *       If parentCategoryId is provided, the parent must exist.
 *       You can optionally attach an image in the same request.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 100, example: 'T-Shirts' }
 *               description: { type: string, maxLength: 500, example: 'Casual and formal t-shirts' }
 *               parentCategoryId: { type: string, format: uuid }
 *               isFeatured: { type: boolean, default: false }
 *               isActive: { type: boolean, default: true }
 *               image: { type: string, format: binary, description: 'Optional category image' }
 *     responses:
 *       201:
 *         description: Category created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Category' }
 *       400: { description: Parent category not found }
 *       409: { description: Duplicate name }
 *       422: { description: Validation failed }
 *
 * /categories/tree:
 *   get:
 *     tags: [Categories]
 *     summary: Get hierarchical category tree
 *     security: []
 *     responses:
 *       200: { description: Category tree retrieved successfully }
 *
 * /categories/featured:
 *   get:
 *     tags: [Categories]
 *     summary: List featured categories
 *     security: []
 *     responses:
 *       200: { description: Featured categories retrieved successfully }
 *
 * /categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get a category by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Category retrieved successfully. }
 *       404: { description: Category not found }
 *
 *   put:
 *     tags: [Categories]
 *     summary: Update a category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 100 }
 *               description: { type: string, maxLength: 500, nullable: true }
 *               parentCategoryId: { type: string, format: uuid, nullable: true }
 *               isFeatured: { type: boolean }
 *               isActive: { type: boolean }
 *               image: { type: string, format: binary, description: 'Optional new category image' }
 *     responses:
 *       200: { description: Category updated successfully. }
 *       400: { description: Invalid parent / self-parent / cycle }
 *       404: { description: Category not found }
 *       409: { description: Duplicate name }
 *       422: { description: Validation failed }
 *
 *   delete:
 *     tags: [Categories]
 *     summary: Delete a category
 *     description: Fails if the category has sub-categories. Removes the Cloudinary image if present.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Deleted. }
 *       400: { description: Category has children }
 *       404: { description: Category not found }
 *
 * /categories/{id}/status:
 *   patch:
 *     tags: [Categories]
 *     summary: Toggle a category's active status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateCategoryStatusBody' }
 *     responses:
 *       200: { description: Category status updated successfully. }
 *       404: { description: Category not found }
 *       422: { description: Validation failed }
 *
 * /categories/{id}/feature:
 *   patch:
 *     tags: [Categories]
 *     summary: Toggle a category's featured flag
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateCategoryFeatureBody' }
 *     responses:
 *       200: { description: Category feature flag updated successfully. }
 *       404: { description: Category not found }
 *       422: { description: Validation failed }
 *
 * /categories/{id}/products:
 *   get:
 *     tags: [Categories]
 *     summary: List products in a category
 *     description: |
 *       Same query parameters as GET /products (page, limit, search, brandId, status, sortBy, sortOrder,
 *       flag filters, etc.). The URL categoryId always wins over any categoryId in the query.
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *       - { in: query, name: page,    schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,   schema: { type: integer, default: 10, maximum: 100 } }
 *       - { in: query, name: search,  schema: { type: string } }
 *       - { in: query, name: brandId, schema: { type: string, format: uuid } }
 *       - { in: query, name: status,  schema: { type: string, enum: [DRAFT, PUBLISHED, ARCHIVED] } }
 *       - { in: query, name: sortBy,  schema: { type: string, enum: [name, basePrice, createdAt, updatedAt] } }
 *       - { in: query, name: sortOrder, schema: { type: string, enum: [asc, desc] } }
 *     responses:
 *       200: 
 *         description: "OK. Returns `{ mode: 'grouped', groups: [...] }` for root categories, or `{ mode: 'flat', items: [...], meta: {...} }` for subcategories."
 *       404: { description: Category not found }
 *
 * /categories/{id}/image:
 *   post:
 *     tags: [Categories]
 *     summary: Upload or replace a category's image
 *     description: |
 *       Uploads via the centralized Cloudinary service.
 *       - Multer memory storage
 *       - Max 5 MB
 *       - Allowed formats: jpg, jpeg, png, webp (MIME validated)
 *       - Applies quality=auto and fetch_format=auto transformations
 *       - Stored under fashion-store/categories
 *       - If the category already has an image, the previous asset is deleted from Cloudinary after the new one is stored.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Category image uploaded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Category' }
 *       400: { description: Missing/invalid file, wrong MIME, or file too large }
 *       404: { description: Category not found }
 *       500: { description: Cloudinary upload failed }
 *
 *   delete:
 *     tags: [Categories]
 *     summary: Remove a category's image
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Category image removed successfully. }
 *       400: { description: Category has no image }
 *       404: { description: Category not found }
 */
export {};
