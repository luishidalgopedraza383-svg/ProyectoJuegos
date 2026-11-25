import { useCallback, useState } from 'react';

const STORAGE_KEY = 'pj_sidebar_hidden';

/** Preferencia de la barra lateral, compartida por la tienda y el panel. */
export function useSidebarVisibility() {
  const [hidden, setHidden] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggle = useCallback(() => {
    setHidden((previous) => {
      const next = !previous;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Sin localStorage el cambio solo dura la sesión actual.
      }
      return next;
    });
  }, []);

  return { hidden, toggle };
}
