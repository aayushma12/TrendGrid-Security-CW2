/** Mirrors NDH.Trendgrid.Api standard response shapes. */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}

export interface ApiFieldError {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors: ApiFieldError[];
  timestamp: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: "ADMIN" | "USER" | "EDITOR";
  isActive: boolean;
  avatarUrl?: string;
  mfaEnabled: boolean;
  /** "totp" | "email" | undefined — which second factor is active, if any. */
  mfaMethod?: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokensPayload {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  permissions: string[];
  /** Soft signal only — the API never blocks login on this, it's here for the
   *  frontend to prompt a change. See PASSWORD_MAX_AGE_DAYS on the API. */
  passwordExpired: boolean;
}

/** Returned by POST /auth/login instead of tokens when the account has MFA
 *  enrolled — `mfaToken` is a short-lived (5min) challenge JWT, exchanged for
 *  real tokens via POST /auth/mfa/verify. */
export interface MfaChallenge {
  mfaRequired: true;
  mfaToken: string;
  /** Tells the login form whether to prompt for an authenticator code or
   *  tell the user a code was emailed (with a resend option). */
  mfaMethod: "totp" | "email";
}

export type LoginResult = AuthTokensPayload | MfaChallenge;

export const isMfaChallenge = (result: LoginResult): result is MfaChallenge =>
  (result as MfaChallenge).mfaRequired === true;

export interface CategoryDto {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  parentCategoryId: string | null;
  parent?: { id: string; name: string } | null;
  childrenCount?: number;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors NDH.Trendgrid.Api ProductStatusValue. */
export type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

/** Mirrors NDH.Trendgrid.Api ImageSlot. */
export type ProductImageSlot = "thumbnail" | "extra1" | "extra2" | "extra3";

export interface ProductImageDto {
  slot: ProductImageSlot;
  url: string;
  publicId: string;
}

export interface ProductColor {
  name: string;
  hexCode: string;
}

export interface ProductCharacteristicDto {
  id: string;
  name: string;
  value: string;
  position: number;
}

export interface ProductVariantImageDto {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  position: number;
}

export interface ProductVariantDto {
  id: string;
  productId: string;
  color: string | null;
  size: string | null;
  sku: string;
  barcode: string | null;
  price: number;
  discountPrice: number | null;
  stock: number;
  lowStockThreshold: number | null;
  isActive: boolean;
  images: ProductVariantImageDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductDto {
  id: string;
  name: string;
  description: string | null;
  shortDescription: string | null;

  /** Structured image array — up to 4 slots. Only populated slots are included. */
  images: ProductImageDto[];

  basePrice: number;
  discountPrice: number | null;
  currency: string;

  category?: { id: string; name: string } | null;
  brand?: string | null;

  status: ProductStatus;
  isActive: boolean;
  isFeatured: boolean;
  isRecommended: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;

  sizes?: string[];
  colors?: ProductColor[];
  tags?: string[];
  labels?: string[];
  collections?: string[];

  characteristics?: ProductCharacteristicDto[];
  variants?: ProductVariantDto[];
  variantsCount?: number;

  createdAt: string;
  updatedAt: string;
}

/** Mirrors NDH.Trendgrid.Api OrderStatusValue — full 12-state lifecycle. */
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "READY_FOR_SHIPMENT"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | "REFUNDED"
  | "FAILED";

/** Mirrors NDH.Trendgrid.Api PaymentStatusValue. */
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface OrderAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface OrderItemDto {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantSku: string;
  colorName: string | null;
  sizeName: string | null;
  imageUrl: string | null;
  originalPrice: number;
  unitPrice: number;
  discountAmount: number;
  quantity: number;
  lineTotal: number;
}

/** One immutable, append-only entry in an order's audit trail. */
export interface OrderStatusHistoryEntryDto {
  id: string;
  status: OrderStatus;
  /** User id of the admin who made the change, or "SYSTEM" for automated transitions. */
  updatedBy: string;
  note: string | null;
  updatedAt: string;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  trackingNumber: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;

  subtotal: number;
  discountAmount: number;
  couponCode: string | null;
  couponDiscount: number;
  shippingCharge: number;
  taxAmount: number;
  grandTotal: number;
  currency: string;

  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  customerNote: string | null;

  items: OrderItemDto[];
  statusHistory: OrderStatusHistoryEntryDto[];

  estimatedDelivery: string | null;

  placedAt: string;
  confirmedAt: string | null;
  processingAt: string | null;
  packedAt: string | null;
  readyForShipmentAt: string | null;
  shippedAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  returnedAt: string | null;
  returnReason: string | null;
  refundedAt: string | null;
  failedAt: string | null;

  isDeleted: boolean;
  deletedAt: string | null;

  createdAt: string;
  updatedAt: string;
}

/** Mirrors NDH.Trendgrid.Api CouponTypeValue. */
export type CouponType = "PERCENTAGE" | "FIXED";

/** Mirrors NDH.Trendgrid.Api CouponPublicStatus. */
export type CouponStatus = "ACTIVE" | "EXPIRED" | "INACTIVE";

export interface CouponDto {
  id: string;
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  minimumPurchase: number | null;
  maximumDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isDeleted: boolean;
  status: CouponStatus;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors NDH.Trendgrid.Api BannerPlacementValue. */
export type BannerPlacement = "ANNOUNCEMENT" | "HERO" | "PROMO";

/** Mirrors NDH.Trendgrid.Api BannerPublicStatus. */
export type BannerStatus = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "INACTIVE";

export interface BannerDto {
  id: string;
  placement: BannerPlacement;
  title: string;
  subtext: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  bgColor: string;
  textColor: string;
  sortOrder: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  isDeleted: boolean;
  status: BannerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CartItemDto {
  id: string;
  variantId: string;
  quantity: number;
  productId: string;
  productName: string;
  productThumbnail: string | null;
  variantSku: string;
  colorName: string | null;
  sizeName: string | null;
  originalPrice: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
  stock: number;
  isAvailable: boolean;
  unavailableReason: string | null;
}

export interface CartDto {
  id: string;
  userId: string;
  items: CartItemDto[];
  subtotal: number;
  discountTotal: number;
  itemCount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutLineDto {
  variantId: string;
  productId: string;
  productName: string;
  productThumbnail: string | null;
  variantSku: string;
  colorName: string | null;
  sizeName: string | null;
  quantity: number;
  originalPrice: number;
  unitPrice: number;
  discountAmount: number;
  lineDiscount: number;
  lineTotal: number;
}

export interface CheckoutSummaryDto {
  items: CheckoutLineDto[];
  subtotal: number;
  discountAmount: number;
  couponCode: string | null;
  couponDiscount: number;
  shippingCharge: number;
  taxAmount: number;
  grandTotal: number;
  currency: string;
}

/** Mirrors NDH.Trendgrid.Api UserRole. */
export type UserRole = "ADMIN" | "USER" | "EDITOR";

/** UserResponseDto has the exact same shape as AuthUser. */
export type UserDto = AuthUser;

/** Mirrors NDH.Trendgrid.Api ReviewStatusValue. */
export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN" | "DELETED";

export interface ReviewImageDto {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  position: number;
}

export interface ReviewSummaryDto {
  productId: string;
  averageRating: number;
  totalReviews: number;
  breakdown: { "1": number; "2": number; "3": number; "4": number; "5": number };
}

export interface ReviewDto {
  id: string;
  productId: string;
  userId: string;
  orderId: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  status: ReviewStatus;
  adminReply: string | null;
  adminRepliedAt: string | null;
  images: ReviewImageDto[];
  createdAt: string;
  updatedAt: string;
}

/** Mirrors NDH.Trendgrid.Api homepage feature — CMS-editable homepage sections. */
export type HomeFieldType = "text" | "textarea" | "image";

export interface HomeField {
  key: string;
  label: string;
  type: HomeFieldType;
  value: string;
}

export interface HomeRepeaterFieldDef {
  key: string;
  label: string;
  type: HomeFieldType;
}

export interface HomeRepeater {
  key: string;
  label: string;
  itemNoun: string;
  itemFields: HomeRepeaterFieldDef[];
  items: Record<string, string>[];
}

export interface HomeSectionContent {
  note?: string;
  fields: HomeField[];
  repeaters: HomeRepeater[];
}

export interface HomepageSectionDto {
  id: string;
  key: string;
  name: string;
  description: string | null;
  visible: boolean;
  sortOrder: number;
  content: HomeSectionContent;
  createdAt: string;
  updatedAt: string;
}
