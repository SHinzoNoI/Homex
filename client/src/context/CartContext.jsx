import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getCart, addToCart, updateCartItem, removeFromCart, applyCoupon as applyCouponAPI, removeCoupon as removeCouponAPI, clearCart as clearCartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();
const LOCAL_CART_KEY = 'hx_cart_local';

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null); // null = not loaded
  const [isOpen, setIsOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Local cart for guests
  const [localItems, setLocalItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LOCAL_CART_KEY)) || []; } catch { return []; }
  });

  const isAuth = isAuthenticated();

  // Load server cart when authenticated
  useEffect(() => {
    if (isAuth) {
      loadCart();
    } else {
      setCart(null);
    }
  }, [isAuth]);

  // Persist local cart
  useEffect(() => {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(localItems));
  }, [localItems]);

  const loadCart = async () => {
    try {
      setSyncing(true);
      const res = await getCart();
      setCart(res.data.data);
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally { setSyncing(false); }
  };

  const addItem = useCallback(async (product) => {
    if (!isAuth) {
      // Guest: local cart
      setLocalItems(prev => {
        const existing = prev.find(i => i._id === product._id);
        if (existing) {
          if (existing.quantity >= product.stock) { toast.error('Max stock reached'); return prev; }
          return prev.map(i => i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i);
        }
        return [...prev, { ...product, quantity: 1 }];
      });
      toast.success(`${product.name} added to cart`);
      return;
    }

    // Optimistic update
    const prev = cart;
    try {
      setSyncing(true);
      const res = await addToCart({ productId: product._id, quantity: 1 });
      setCart(res.data.data);
      toast.success(`${product.name} added to cart`);
    } catch (err) {
      setCart(prev);
      toast.error(err.response?.data?.message || 'Failed to add item');
    } finally { setSyncing(false); }
  }, [isAuth, cart]);

  const updateQty = useCallback(async (productId, quantity) => {
    if (!isAuth) {
      if (quantity < 1) {
        setLocalItems(prev => prev.filter(i => i._id !== productId));
      } else {
        setLocalItems(prev => prev.map(i => i._id === productId ? { ...i, quantity } : i));
      }
      return;
    }

    const prev = cart;
    try {
      setSyncing(true);
      const res = await updateCartItem(productId, { quantity });
      setCart(res.data.data);
    } catch (err) {
      setCart(prev);
      toast.error(err.response?.data?.message || 'Failed to update quantity');
    } finally { setSyncing(false); }
  }, [isAuth, cart]);

  const removeItem = useCallback(async (productId) => {
    if (!isAuth) {
      setLocalItems(prev => prev.filter(i => i._id !== productId));
      return;
    }
    const prev = cart;
    try {
      setSyncing(true);
      const res = await removeFromCart(productId);
      setCart(res.data.data);
    } catch (err) {
      setCart(prev);
      toast.error('Failed to remove item');
    } finally { setSyncing(false); }
  }, [isAuth, cart]);

  const applyCouponCode = useCallback(async (code) => {
    if (!isAuth) return { success: false, message: 'Login required to apply coupon' };
    try {
      const res = await applyCouponAPI({ code });
      setCart(res.data.data);
      return { success: true, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Invalid coupon' };
    }
  }, [isAuth, cart]);

  const removeCouponCode = useCallback(async () => {
    if (!isAuth) return;
    try {
      const res = await removeCouponAPI();
      setCart(res.data.data);
    } catch (err) { console.error(err); }
  }, [isAuth]);

  const clearCartData = useCallback(async () => {
    setLocalItems([]);
    if (isAuth) {
      try {
        await clearCartAPI();
        setCart(prev => ({ ...prev, items: [], subtotal: 0, totalWeight: 0, deliveryCharge: 0, gstAmount: 0, grandTotal: 0, discountAmount: 0, couponCode: '' }));
      } catch (err) { console.error(err); }
    }
  }, [isAuth]);

  // Expose unified interface
  const items = isAuth ? (cart?.items || []) : localItems;
  const localTotal = localItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = isAuth ? (cart?.grandTotal || 0) : localTotal;
  const subtotal = isAuth ? (cart?.subtotal || 0) : localTotal;
  const deliveryCharge = isAuth ? (cart?.deliveryCharge || 0) : 0;
  const gstAmount = isAuth ? (cart?.gstAmount || 0) : 0;
  const discountAmount = isAuth ? (cart?.discountAmount || 0) : 0;
  const totalWeight = isAuth ? (cart?.totalWeight || 0) : 0;
  const couponCode = isAuth ? (cart?.couponCode || '') : '';
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, cart, count, total, subtotal, deliveryCharge, gstAmount, discountAmount, totalWeight, couponCode,
      isOpen, setIsOpen, syncing, loadCart,
      addItem, updateQty, removeItem, clearCart: clearCartData,
      applyCouponCode, removeCouponCode,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
