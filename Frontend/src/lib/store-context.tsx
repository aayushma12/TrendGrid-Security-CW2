"use client";

/**
 * StoreProvider — shared client-side state for the storefront.
 *
 * The shopping cart is server-backed: the real backend has no guest cart
 * (Cart is 1:1 with a user account), so `cart` mirrors whatever is in the
 * signed-in user's cart and every mutation round-trips through /cart. When
 * signed out, the cart is simply empty and `addToCart` asks the caller to
 * sign in first (see `addToCart`'s return value).
 *
 * Wishlist, the cart drawer / search overlay open state, and toasts have no
 * backend equivalent (or don't need one) and stay local to the browser.
 * Mounted once in the (shop) layout — inside AuthProvider — so every
 * storefront page + the chrome (header, drawers, overlays) share one source
 * of truth.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { addCartItem, clearCart as clearCartApi, getCart, removeCartItem, updateCartItem } from "@/lib/api/cart";
import { ApiError } from "@/lib/api/client";
import type { CartDto } from "@/lib/api/types";
import { useAuth } from "@/lib/auth-context";

/* --------------------------------------------------------------- types */

/** Display-friendly adapter over a real cart item — used by the drawer/cart/checkout UI. */
export interface CartLine {
  /** Cart item id — the real, server-assigned identifier for this line. */
  key: string;
  itemId: string;
  productId: string;
  variantId: string;
  name: string;
  price: number;
  color: string;
  size: string;
  qty: number;
  /** Real product thumbnail URL, or null if the product has none. */
  image: string | null;
  isAvailable: boolean;
  unavailableReason: string | null;
}

export interface Toast {
  id: number;
  msg: string;
  duration: number;
}

interface StoreState {
  /* cart (server-backed) */
  cart: CartDto | null;
  cartLoading: boolean;
  lines: CartLine[];
  count: number;
  subtotal: number;
  /** Returns false (and toasts a sign-in prompt) if the shopper isn't logged in. */
  addToCart: (variantId: string, quantity?: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<void>;
  updateQty: (itemId: string, delta: number) => Promise<void>;
  setLineQty: (itemId: string, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;

  /* cart drawer */
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;

  /* search overlay */
  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;

  /* wishlist — local only, no backend feature for this yet */
  wishlist: string[];
  isWishlisted: (id: string) => boolean;
  toggleWishlist: (id: string) => boolean;

  /* toasts */
  toasts: Toast[];
  showToast: (msg: string, duration?: number) => void;
  dismissToast: (id: number) => void;
}

/* --------------------------------------------------------- persistence */

const WISH_KEY = "ndh.wishlist.v1";

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / disabled — ignore */
  }
}

/* ------------------------------------------------------------- context */

const noop = () => {};
const noopAsync = async () => {};
const StoreContext = createContext<StoreState>({
  cart: null,
  cartLoading: false,
  lines: [],
  count: 0,
  subtotal: 0,
  addToCart: async () => false,
  removeItem: noopAsync,
  updateQty: noopAsync,
  setLineQty: noopAsync,
  clearCart: noopAsync,
  refreshCart: noopAsync,
  cartOpen: false,
  openCart: noop,
  closeCart: noop,
  searchOpen: false,
  openSearch: noop,
  closeSearch: noop,
  wishlist: [],
  isWishlisted: () => false,
  toggleWishlist: () => false,
  toasts: [],
  showToast: noop,
  dismissToast: noop,
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  const [cart, setCart] = useState<CartDto | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const toastId = useRef(0);
  const requestId = useRef(0);

  /* hydrate wishlist from storage after mount (avoids SSR mismatch) */
  useEffect(() => {
    setWishlist(loadJSON<string[]>(WISH_KEY, []));
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) saveJSON(WISH_KEY, wishlist);
  }, [wishlist, hydrated]);

  /* ---- toasts (declared early — cart actions below use it) ---- */
  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const showToast = useCallback((msg: string, duration = 2800) => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, msg, duration }]);
  }, []);

  /* ---- cart (server-backed) ---- */
  const refreshCart = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setCart(null);
      return;
    }
    const thisRequest = ++requestId.current;
    setCartLoading(true);
    try {
      const res = await getCart(user.id);
      if (requestId.current === thisRequest) setCart(res.data);
    } catch {
      if (requestId.current === thisRequest) setCart(null);
    } finally {
      if (requestId.current === thisRequest) setCartLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(
    async (variantId: string, quantity = 1): Promise<boolean> => {
      if (!isAuthenticated || !user) {
        showToast("Sign in to add items to your cart");
        return false;
      }
      try {
        const res = await addCartItem(user.id, variantId, quantity);
        setCart(res.data);
        return true;
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : "Could not add to cart");
        return false;
      }
    },
    [isAuthenticated, user, showToast],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!user) return;
      try {
        const res = await removeCartItem(user.id, itemId);
        setCart(res.data);
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : "Could not update cart");
      }
    },
    [user, showToast],
  );

  const setLineQty = useCallback(
    async (itemId: string, qty: number) => {
      if (!user) return;
      const nextQty = Math.max(1, qty);
      try {
        const res = await updateCartItem(user.id, itemId, nextQty);
        setCart(res.data);
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : "Could not update cart");
      }
    },
    [user, showToast],
  );

  const updateQty = useCallback(
    async (itemId: string, delta: number) => {
      if (!user || !cart) return;
      const item = cart.items.find((i) => i.id === itemId);
      if (!item) return;
      const nextQty = item.quantity + delta;
      try {
        const res = nextQty <= 0
          ? await removeCartItem(user.id, itemId)
          : await updateCartItem(user.id, itemId, nextQty);
        setCart(res.data);
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : "Could not update cart");
      }
    },
    [user, cart, showToast],
  );

  const clearCartFn = useCallback(async () => {
    if (!user) return;
    try {
      const res = await clearCartApi(user.id);
      setCart(res.data);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not clear cart");
    }
  }, [user, showToast]);

  /* ---- drawer / overlay ---- */
  const openCart = useCallback(() => {
    setSearchOpen(false);
    setCartOpen(true);
  }, []);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const openSearch = useCallback(() => {
    setCartOpen(false);
    setSearchOpen(true);
  }, []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  /* ---- wishlist ---- */
  const isWishlisted = useCallback(
    (id: string) => wishlist.includes(id),
    [wishlist],
  );
  const toggleWishlist = useCallback((id: string) => {
    let added = false;
    setWishlist((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      added = true;
      return [...prev, id];
    });
    return added;
  }, []);

  /* lock body scroll while a panel is open */
  useEffect(() => {
    if (typeof document === "undefined") return;
    const locked = cartOpen || searchOpen;
    document.body.style.overflow = locked ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen, searchOpen]);

  const lines = useMemo<CartLine[]>(() => {
    if (!cart) return [];
    return cart.items.map((i) => ({
      key: i.id,
      itemId: i.id,
      productId: i.productId,
      variantId: i.variantId,
      name: i.productName,
      price: i.unitPrice,
      color: i.colorName ?? "",
      size: i.sizeName ?? "",
      qty: i.quantity,
      image: i.productThumbnail,
      isAvailable: i.isAvailable,
      unavailableReason: i.unavailableReason,
    }));
  }, [cart]);

  const count = cart?.itemCount ?? 0;
  const subtotal = cart?.subtotal ?? 0;

  const value = useMemo<StoreState>(
    () => ({
      cart,
      cartLoading,
      lines,
      count,
      subtotal,
      addToCart,
      removeItem,
      updateQty,
      setLineQty,
      clearCart: clearCartFn,
      refreshCart,
      cartOpen,
      openCart,
      closeCart,
      searchOpen,
      openSearch,
      closeSearch,
      wishlist,
      isWishlisted,
      toggleWishlist,
      toasts,
      showToast,
      dismissToast,
    }),
    [
      cart,
      cartLoading,
      lines,
      count,
      subtotal,
      addToCart,
      removeItem,
      updateQty,
      setLineQty,
      clearCartFn,
      refreshCart,
      cartOpen,
      openCart,
      closeCart,
      searchOpen,
      openSearch,
      closeSearch,
      wishlist,
      isWishlisted,
      toggleWishlist,
      toasts,
      showToast,
      dismissToast,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
export const useCart = useStore;
export const useUI = useStore;
export const useToast = useStore;
