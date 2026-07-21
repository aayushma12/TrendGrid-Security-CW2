import { Router, Request, Response } from 'express';

import { success } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { env } from '../config/env';

import healthRoutes from './healthRoutes';
import userRoutes from '../features/user/route';
import categoryRoutes from '../features/category/route';
import authRoutes from '../features/auth/route';


import productRoutes from '../features/product/route';
import couponRoutes from '../features/coupon/route';
import bannerRoutes from '../features/banner/route';
import cartRoutes from '../features/cart/route';
import wishlistRoutes from '../features/wishlist/route';
import checkoutRoutes from '../features/checkout/route';
import orderRoutes from '../features/order/route';
import reviewRoutes from '../features/review/route';
import homepageRoutes from '../features/homepage/route';
import settingsRoutes from '../features/settings/route';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    success(res, { name: 'NDH.Trendgrid.Api', version: env.apiVersion }, 'NDH Trendgrid API');
  }),
);

router.use('/health', healthRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/auth', authRoutes);


router.use('/products', productRoutes);

// Commerce
router.use('/coupons', couponRoutes);
router.use('/banners', bannerRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/orders', orderRoutes);
router.use('/reviews', reviewRoutes);

// Content
router.use('/homepage', homepageRoutes);
router.use('/settings', settingsRoutes);

export default router;
