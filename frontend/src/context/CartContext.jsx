import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

// Cada cuenta tiene su propio carrito. Así, al cerrar sesión como comprador 1
// y entrar como comprador 2, no aparecen los juegos que dejó el primero.
const storageKey = (ownerId) => `pj_cart:${ownerId || 'guest'}`;

// Lee el carrito guardado en localStorage (sobrevive a recargas y a la ida
// y vuelta por el login). Cualquier dato corrupto se descarta.
const loadStored = (ownerId) => {
  try {
    const raw = window.localStorage.getItem(storageKey(ownerId));
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
};

// El stock llega distinto según el endpoint: el público lo trae como `stock`
// y el del punto de venta dentro de `inventory`. null = sin límite conocido.
const readStock = (game) => {
  const raw = game.stock ?? game.inventory?.quantity ?? game.inventory?.[0]?.quantity;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
};

/**
 * Carrito de compras compartido por la tienda, la página /carrito y el punto
 * de venta. Se guarda en el navegador por cuenta (los invitados tienen su
 * propio carrito); al cobrar, el backend valida stock, precios y saldo de la
 * tarjeta de todas formas.
 */
export function CartProvider({ children }) {
  const { profile, loading: authLoading } = useAuth();
  const ownerId = profile?.id || null;
  const [items, setItems] = useState([]);
  // undefined = todavía no se ha cargado la clave de esta cuenta. Evita
  // guardar el carrito anterior con la clave nueva al cambiar de usuario.
  const [loadedOwner, setLoadedOwner] = useState(undefined);

  useEffect(() => {
    if (authLoading) return;
    setItems(loadStored(ownerId));
    setLoadedOwner(ownerId);
  }, [ownerId, authLoading]);

  useEffect(() => {
    if (loadedOwner === undefined || loadedOwner !== ownerId) return;
    try {
      window.localStorage.setItem(storageKey(ownerId), JSON.stringify(items));
    } catch {
      // localStorage puede no estar disponible (modo privado): el carrito
      // duraría solo lo que viva la pestaña.
    }
  }, [items, loadedOwner, ownerId]);

  // Agrega unidades; si el juego ya está, suma. skipIfExists evita duplicar
  // cuando el punto de venta recibe el juego por ?game= (compra directa).
  const addItem = useCallback((game, { quantity = 1, skipIfExists = false } = {}) => {
    setItems((current) => {
      const found = current.find((item) => item.videoGameId === game.id);
      if (found) {
        if (skipIfExists) return current;
        return current.map((item) => (item.videoGameId === game.id
          ? { ...item, quantity: Math.min(item.quantity + quantity, item.stock ?? item.quantity + quantity) }
          : item));
      }
      const stock = readStock(game);
      return [...current, {
        videoGameId: game.id,
        title: game.title,
        price: Number(game.price),
        quantity: Math.max(1, Math.min(quantity, stock ?? quantity)),
        stock,
        imageUrl: game.imageUrl || null,
      }];
    });
  }, []);

  // Cambia la cantidad; 0 (o stock superado) elimina la línea.
  const setQuantity = useCallback((videoGameId, quantity) => {
    setItems((current) => current
      .map((item) => {
        if (item.videoGameId !== videoGameId) return item;
        const capped = Math.min(quantity, item.stock ?? quantity);
        return { ...item, quantity: Math.max(0, capped) };
      })
      .filter((item) => item.quantity > 0));
  }, []);

  const removeItem = useCallback((videoGameId) => {
    setItems((current) => current.filter((item) => item.videoGameId !== videoGameId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  // Restaura una instantánea (se usa para deshacer el vaciado optimista
  // cuando el cobro falla en el backend).
  const restore = useCallback((snapshot) => {
    setItems(Array.isArray(snapshot) ? snapshot : []);
  }, []);

  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value = useMemo(() => ({
    items, addItem, setQuantity, removeItem, clear, restore, count, total,
  }), [items, addItem, setQuantity, removeItem, clear, restore, count, total]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return context;
}
