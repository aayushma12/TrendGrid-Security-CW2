/**
 * @openapi
 * tags:
 *   - name: Products
 *     description: Fashion e-commerce products (thumbnail, gallery, characteristics, variants, flags)
 *
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         name: { type: string }
 *         description: { type: string, nullable: true }
 *         shortDescription: { type: string, nullable: true }
 *         images: { type: array, items: { $ref: '#/components/schemas/ProductImage' } }
 *         basePrice: { type: number, format: float }
 *         discountPrice: { type: number, format: float, nullable: true }
 *         currency: { type: string, example: 'NPR' }
 *         category: { type: object, nullable: true, properties: { id: { type: string, format: uuid }, name: { type: string } } }
 *         brand: { type: object, nullable: true, properties: { id: { type: string, format: uuid }, name: { type: string } } }
 *         status: { type: string, enum: [DRAFT, PUBLISHED, ARCHIVED] }
 *         isActive: { type: boolean }
 *         isFeatured: { type: boolean }
 *         isRecommended: { type: boolean }
 *         isTrending: { type: boolean }
 *         isBestSeller: { type: boolean }
 *         isNewArrival: { type: boolean }
 *         availableSizes: { type: array, items: { type: object, properties: { id: { type: string }, name: { type: string }, position: { type: integer } } } }
 *         availableColors: { type: array, items: { type: object, properties: { id: { type: string }, name: { type: string }, hexCode: { type: string } } } }
 *         tags: { type: array, items: { type: object, properties: { id: { type: string }, name: { type: string } } } }
 *         labels: { type: array, items: { type: object, properties: { id: { type: string }, name: { type: string }, color: { type: string, nullable: true } } } }
 *         collections: { type: array, items: { type: object, properties: { id: { type: string }, name: { type: string } } } }
  *         gallery: { type: array, items: { $ref: '#/components/schemas/GalleryImage' } }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *
 *     ProductImage:
 *       type: object
 *       properties:
 *         slot: { type: string, enum: [thumbnail, extra1, extra2, extra3] }
 *         imageUrl: { type: string }
 *         imagePublicId: { type: string }
 *

 *
 *     CreateProductBody:
 *       type: object
 *       required: [name, basePrice, categoryId]
 *       properties:
 *         name: { type: string, minLength: 2, maxLength: 200 }
 *         description: { type: string, maxLength: 10000 }
 *         shortDescription: { type: string, maxLength: 500 }
 *         basePrice: { type: number, format: float }
 *         discountPrice: { type: number, format: float }
 *         currency: { type: string, example: 'NPR' }
 *         categoryId: { type: string, format: uuid }
 *         brandId: { type: string, format: uuid }
 *         status: { type: string, enum: [DRAFT, PUBLISHED, ARCHIVED], default: DRAFT }
 *         isActive: { type: boolean, default: true }
 *         isFeatured: { type: boolean }
 *         isRecommended: { type: boolean }
 *         isTrending: { type: boolean }
 *         isBestSeller: { type: boolean }
 *         isNewArrival: { type: boolean }
 *         availableSizeIds: { type: array, items: { type: string, format: uuid } }
 *         availableColorIds: { type: array, items: { type: string, format: uuid } }
 *         tagIds: { type: array, items: { type: string, format: uuid } }
 *         labelIds: { type: array, items: { type: string, format: uuid } }
 *         collectionIds: { type: array, items: { type: string, format: uuid } }
 *
 *     UpdateProductBody:
 *       type: object
 *       description: At least one field. Image endpoints handle thumbnail/gallery.
 *       properties:
 *         name: { type: string }
 *         description: { type: string, nullable: true }
 *         shortDescription: { type: string, nullable: true }
 *         basePrice: { type: number }
 *         discountPrice: { type: number, nullable: true }
 *         currency: { type: string }
 *         categoryId: { type: string, format: uuid }
 *         brandId: { type: string, format: uuid, nullable: true }
 *         status: { type: string, enum: [DRAFT, PUBLISHED, ARCHIVED] }
 *         isActive: { type: boolean }
 *         isFeatured: { type: boolean }
 *         isRecommended: { type: boolean }
 *         isTrending: { type: boolean }
 *         isBestSeller: { type: boolean }
 *         isNewArrival: { type: boolean }
 *
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: List products
 *     security: []
 *     description: |
 *       Paginated. Search on name/shortDescription; filter by categoryId, brandId, status, and any of the
 *       boolean flags (isActive, isFeatured, isRecommended, isTrending, isBestSeller, isNewArrival);
 *       sort by name, basePrice, createdAt, or updatedAt.
 *     parameters:
 *       - { in: query, name: page,          schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,         schema: { type: integer, default: 10, maximum: 100 } }
 *       - { in: query, name: search,        schema: { type: string } }
 *       - { in: query, name: categoryId,    schema: { type: string, format: uuid } }
 *       - { in: query, name: brandId,       schema: { type: string, format: uuid } }
 *       - { in: query, name: status,        schema: { type: string, enum: [DRAFT, PUBLISHED, ARCHIVED] } }
 *       - { in: query, name: priceMin,      schema: { type: number } }
 *       - { in: query, name: priceMax,      schema: { type: number } }
 *       - { in: query, name: isActive,      schema: { type: boolean } }
 *       - { in: query, name: isFeatured,    schema: { type: boolean } }
 *       - { in: query, name: isRecommended, schema: { type: boolean } }
 *       - { in: query, name: isTrending,    schema: { type: boolean } }
 *       - { in: query, name: isBestSeller,  schema: { type: boolean } }
 *       - { in: query, name: isNewArrival,  schema: { type: boolean } }
 *       - { in: query, name: sortBy,        schema: { type: string, enum: [name, basePrice, createdAt, updatedAt] } }
 *       - { in: query, name: sortOrder,     schema: { type: string, enum: [asc, desc] } }
 *     responses:
 *       200: { description: OK }
 *   post:
 *     tags: [Products]
 *     summary: Create a product
 *     description: "Create a product with optional thumbnail image. Send as multipart/form-data."
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, basePrice, categoryId]
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 200 }
 *               description: { type: string, maxLength: 10000 }
 *               shortDescription: { type: string, maxLength: 500 }
 *               basePrice: { type: number, format: float }
 *               discountPrice: { type: number, format: float }
 *               currency: { type: string, example: 'NPR' }
 *               categoryId: { type: string, format: uuid }
 *               brand: { type: string }
 *               status: { type: string, enum: [DRAFT, PUBLISHED, ARCHIVED], default: DRAFT }
 *               isActive: { type: boolean, default: true }
 *               isFeatured: { type: boolean }
 *               isRecommended: { type: boolean }
 *               isTrending: { type: boolean }
 *               isBestSeller: { type: boolean }
 *               isNewArrival: { type: boolean }
 *               image: { type: string, format: binary, description: 'Optional product thumbnail image' }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Missing / invalid catalog reference }
 *       422: { description: Validation failed }
 *
 * /products/featured:
 *   get:
 *     tags: [Products]
 *     summary: List featured products
 *     security: []
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 10 } }
 *     responses:
 *       200: { description: OK }
 *
 * /products/new:
 *   get:
 *     tags: [Products]
 *     summary: List new arrival products
 *     security: []
 *     responses:
 *       200: { description: OK }
 *
 * /products/best-sellers:
 *   get:
 *     tags: [Products]
 *     summary: List best seller products
 *     security: []
 *     responses:
 *       200: { description: OK }
 *
 * /products/search:
 *   get:
 *     tags: [Products]
 *     summary: Search products by name
 *     security: []
 *     parameters:
 *       - { in: query, name: search, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: OK }
 *       400: { description: Search query required }
 *
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product
 *     security: []
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *   put:
 *     tags: [Products]
 *     summary: Update a product
 *     description: "Update product fields with optional thumbnail image. Send as multipart/form-data."
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 200 }
 *               description: { type: string, maxLength: 10000 }
 *               shortDescription: { type: string, maxLength: 500 }
 *               basePrice: { type: number, format: float }
 *               discountPrice: { type: number, format: float }
 *               currency: { type: string }
 *               categoryId: { type: string, format: uuid }
 *               brand: { type: string }
 *               status: { type: string, enum: [DRAFT, PUBLISHED, ARCHIVED] }
 *               isActive: { type: boolean }
 *               isFeatured: { type: boolean }
 *               isRecommended: { type: boolean }
 *               isTrending: { type: boolean }
 *               isBestSeller: { type: boolean }
 *               isNewArrival: { type: boolean }
 *               image: { type: string, format: binary, description: 'Optional new thumbnail image' }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 *   delete: { tags: [Products], summary: Delete product, parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }], responses: { 204: { description: Deleted }, 404: { description: Not found } } }
 *
 * /products/{id}/status:
 *   patch:
 *     tags: [Products]
 *     summary: Change product status
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { type: object, required: [status], properties: { status: { type: string, enum: [DRAFT, PUBLISHED, ARCHIVED] } } } } }
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *
 * /products/{id}/flags/{flag}:
 *   patch:
 *     tags: [Products]
 *     summary: Toggle a boolean flag (isFeatured / isRecommended / isTrending / isBestSeller / isNewArrival / isActive)
 *     parameters:
 *       - { in: path, name: id,   required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: flag, required: true, schema: { type: string, enum: [isFeatured, isRecommended, isTrending, isBestSeller, isNewArrival, isActive] } }
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { type: object, required: [value], properties: { value: { type: boolean } } } } }
 *     responses: { 200: { description: OK }, 400: { description: Invalid flag }, 404: { description: Not found } }
 *
 * /products/{id}/assignments:
 *   patch:
 *     tags: [Products]
 *     summary: Replace a product's catalog assignments (sizes, colors, tags, labels, collections)
 *     description: Each provided array REPLACES that assignment. Omit an array to leave it unchanged.
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               availableSizeIds:  { type: array, items: { type: string, format: uuid } }
 *               availableColorIds: { type: array, items: { type: string, format: uuid } }
 *               tagIds:            { type: array, items: { type: string, format: uuid } }
 *               labelIds:          { type: array, items: { type: string, format: uuid } }
 *               collectionIds:     { type: array, items: { type: string, format: uuid } }
 *     responses: { 200: { description: OK }, 400: { description: Missing catalog id }, 404: { description: Not found } }
 *
 * /products/{id}/images/{slot}:
 *   post:
 *     tags: [Products]
 *     summary: Upload / replace a product image slot (thumbnail, extra1, extra2, extra3)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: slot, required: true, schema: { type: string, enum: [thumbnail, extra1, extra2, extra3] } }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema: { type: object, required: [image], properties: { image: { type: string, format: binary } } }
 *     responses: { 200: { description: OK }, 400: { description: Invalid file }, 404: { description: Not found } }
 *   delete:
 *     tags: [Products]
 *     summary: Remove an image slot
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: slot, required: true, schema: { type: string, enum: [thumbnail, extra1, extra2, extra3] } }
 *     responses: { 200: { description: OK }, 400: { description: No image in slot }, 404: { description: Not found } }
 *
 * /products/{id}/gallery:
 *   get:
 *     tags: [Products]
 *     summary: List gallery images
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *   post:
 *     tags: [Products]
 *     summary: Upload one or more gallery images (max 10, field "images")
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema: { type: object, required: [images], properties: { images: { type: array, items: { type: string, format: binary } } } }
 *     responses: { 201: { description: Created }, 400: { description: Missing files }, 404: { description: Not found } }
 *
 * /products/{id}/gallery/reorder:
 *   patch:
 *     tags: [Products]
 *     summary: Reorder gallery images
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { type: object, required: [order], properties: { order: { type: array, items: { type: string, format: uuid } } } } } }
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *
 * /products/{id}/gallery/{imageId}:
 *   delete:
 *     tags: [Products]
 *     summary: Remove a gallery image
 *     parameters:
 *       - { in: path, name: id,      required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: imageId, required: true, schema: { type: string, format: uuid } }
 *     responses: { 204: { description: Deleted }, 404: { description: Not found } }
 *

 * /products/{id}/characteristics:
 *   get:
 *     tags: [Products]
 *     summary: List characteristics (spec sheet rows) for a product
 *     security: []
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: OK }, 404: { description: Product not found } }
 *   post:
 *     tags: [Products]
 *     summary: Add a characteristic
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, value]
 *             properties:
 *               name: { type: string, minLength: 1, maxLength: 100 }
 *               value: { type: string, minLength: 1, maxLength: 500 }
 *               position: { type: integer, minimum: 0 }
 *     responses: { 201: { description: Created }, 404: { description: Product not found }, 409: { description: Duplicate name } }
 *
 * /products/{id}/characteristics/{charId}:
 *   put:
 *     tags: [Products]
 *     summary: Update a characteristic
 *     parameters:
 *       - { in: path, name: id,     required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: charId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               value: { type: string }
 *               position: { type: integer, minimum: 0 }
 *     responses: { 200: { description: OK }, 404: { description: Not found }, 409: { description: Duplicate name } }
 *   delete:
 *     tags: [Products]
 *     summary: Remove a characteristic
 *     parameters:
 *       - { in: path, name: id,     required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: charId, required: true, schema: { type: string, format: uuid } }
 *     responses: { 204: { description: Deleted }, 404: { description: Not found } }
 *
 * /products/{id}/variants:
 *   get:
 *     tags: [Products]
 *     summary: List variants (sellable SKUs — color/size/price/stock) for a product
 *     security: []
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     responses: { 200: { description: OK }, 404: { description: Product not found } }
 *   post:
 *     tags: [Products]
 *     summary: Create a variant
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string, format: uuid } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sku, price]
 *             properties:
 *               color: { type: string }
 *               size: { type: string }
 *               sku: { type: string, minLength: 2, maxLength: 100 }
 *               barcode: { type: string, maxLength: 100 }
 *               price: { type: number, format: float }
 *               discountPrice: { type: number, format: float }
 *               stock: { type: integer, minimum: 0, default: 0 }
 *               lowStockThreshold: { type: integer, minimum: 0 }
 *               isActive: { type: boolean, default: true }
 *     responses:
 *       201: { description: Created }
 *       404: { description: Product not found }
 *       409: { description: Duplicate SKU, barcode, or color/size combo }
 *
 * /products/{id}/variants/{variantId}:
 *   get:
 *     tags: [Products]
 *     summary: Get a variant
 *     security: []
 *     parameters:
 *       - { in: path, name: id,        required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: variantId, required: true, schema: { type: string, format: uuid } }
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *   put:
 *     tags: [Products]
 *     summary: Update a variant
 *     parameters:
 *       - { in: path, name: id,        required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: variantId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               color: { type: string, nullable: true }
 *               size: { type: string, nullable: true }
 *               sku: { type: string }
 *               barcode: { type: string, nullable: true }
 *               price: { type: number }
 *               discountPrice: { type: number, nullable: true }
 *               stock: { type: integer, minimum: 0 }
 *               lowStockThreshold: { type: integer, minimum: 0, nullable: true }
 *               isActive: { type: boolean }
 *     responses: { 200: { description: OK }, 404: { description: Not found }, 409: { description: Duplicate SKU, barcode, or combo } }
 *   delete:
 *     tags: [Products]
 *     summary: Delete a variant (and its images)
 *     parameters:
 *       - { in: path, name: id,        required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: variantId, required: true, schema: { type: string, format: uuid } }
 *     responses: { 204: { description: Deleted }, 404: { description: Not found } }
 *
 * /products/{id}/variants/{variantId}/images:
 *   post:
 *     tags: [Products]
 *     summary: Upload one or more variant images (max 10, field "images")
 *     parameters:
 *       - { in: path, name: id,        required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: variantId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema: { type: object, required: [images], properties: { images: { type: array, items: { type: string, format: binary } } } }
 *     responses: { 201: { description: Created }, 400: { description: Missing files }, 404: { description: Not found } }
 *
 * /products/{id}/variants/{variantId}/images/{imageId}:
 *   delete:
 *     tags: [Products]
 *     summary: Remove a variant image
 *     parameters:
 *       - { in: path, name: id,        required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: variantId, required: true, schema: { type: string, format: uuid } }
 *       - { in: path, name: imageId,   required: true, schema: { type: string, format: uuid } }
 *     responses: { 204: { description: Deleted }, 404: { description: Not found } }
 *
 * /products/{id}/discounts:
 *   get:
 *     tags: [Products]
 *     summary: List discounts for this product
 *     description: Same query params as GET /discounts. The URL productId is forced.
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *       - { in: query, name: type, schema: { type: string, enum: [PERCENTAGE, FIXED] } }
 *       - { in: query, name: isActive, schema: { type: boolean } }
 *       - { in: query, name: sortBy, schema: { type: string, enum: [createdAt, updatedAt, startDate, endDate, value] } }
 *     responses: { 200: { description: OK }, 404: { description: Product not found } }
 *
 * /products/{id}/reviews:
 *   get:
 *     tags: [Products]
 *     summary: List reviews for this product
 *     description: |
 *       Same query params as GET /reviews. Supports status, rating, sortBy, sortOrder.
 *       For the customer-facing storefront pass status=APPROVED.
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *       - { in: query, name: status, schema: { type: string, enum: [PENDING, APPROVED, REJECTED, HIDDEN, DELETED] } }
 *       - { in: query, name: rating, schema: { type: integer, minimum: 1, maximum: 5 } }
 *       - { in: query, name: sortBy, schema: { type: string, enum: [createdAt, updatedAt, rating] } }
 *     responses: { 200: { description: OK }, 404: { description: Product not found } }
 *
 * /products/{id}/reviews/summary:
 *   get:
 *     tags: [Products]
 *     summary: Rating summary for this product (average, total, 1..5 breakdown; APPROVED only)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/ReviewSummary' }
 *       404: { description: Product not found }
 *
 * /products/{id}/orders:
 *   get:
 *     tags: [Products]
 *     summary: List orders that contain this product
 *     description: Admin / analytics. Same filters as GET /orders (status, paymentStatus, userId, from, to).
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *       - { in: query, name: status,        schema: { type: string, enum: [PENDING, CONFIRMED, PACKED, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, RETURNED, REFUNDED] } }
 *       - { in: query, name: paymentStatus, schema: { type: string, enum: [PENDING, PAID, FAILED, REFUNDED] } }
 *       - { in: query, name: userId,        schema: { type: string, format: uuid } }
 *       - { in: query, name: from,          schema: { type: string, format: date-time } }
 *       - { in: query, name: to,            schema: { type: string, format: date-time } }
 *     responses: { 200: { description: OK }, 404: { description: Product not found } }
 */
export {};
