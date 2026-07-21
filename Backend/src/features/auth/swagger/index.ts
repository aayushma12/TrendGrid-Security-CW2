/**
 * @swagger
 * components:
 *   schemas:
 *     LoginBody:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email: { type: string, format: email, example: 'admin@trendgrid.com' }
 *         password: { type: string, format: password, minLength: 6, example: 'Admin123!' }
 *
 *     RegisterBody:
 *       type: object
 *       required: [firstName, lastName, email, password]
 *       properties:
 *         firstName: { type: string, example: 'John' }
 *         lastName: { type: string, example: 'Doe' }
 *         email: { type: string, format: email, example: 'john@example.com' }
 *         phoneNumber: { type: string, example: '+9779800000000' }
 *         password: { type: string, format: password, minLength: 8, example: 'SecurePass1' }
 *
 *     RefreshBody:
 *       type: object
 *       required: [refreshToken]
 *       properties:
 *         refreshToken: { type: string, example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
 *
 *     ChangePasswordBody:
 *       type: object
 *       required: [currentPassword, newPassword]
 *       properties:
 *         currentPassword: { type: string, format: password }
 *         newPassword: { type: string, format: password, minLength: 8 }
 *
 *     AuthTokensResponse:
 *       type: object
 *       properties:
 *         accessToken: { type: string, description: 'JWT access token (15–30 min)' }
 *         refreshToken: { type: string, description: 'JWT refresh token (30 days)' }
 *         user: { type: object }
 *         permissions:
 *           type: array
 *           items: { type: string }
 *           example: ['cart:read', 'orders:read']
 *
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login to obtain access and refresh tokens
 *     description: Public endpoint — no Authorization header required.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginBody'
 *     responses:
 *       200:
 *         description: Logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/AuthTokensResponse' }
 *       400: { description: Validation failed }
 *       401: { description: Invalid email or password / account disabled }
 *
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new customer account
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterBody'
 *     responses:
 *       201:
 *         description: Registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/AuthTokensResponse' }
 *       400: { description: Validation failed }
 *       409: { description: Duplicate email or phone }
 *
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token using a refresh token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshBody'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/AuthTokensResponse' }
 *       401: { description: Invalid or expired refresh token }
 *
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout the current user
 *     responses:
 *       200: { description: Logged out successfully }
 *       401: { description: Authentication required }
 *
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password for the authenticated user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordBody'
 *     responses:
 *       200: { description: Password changed successfully }
 *       400: { description: Validation failed or wrong current password }
 *       401: { description: Authentication required }
 */
export {};
