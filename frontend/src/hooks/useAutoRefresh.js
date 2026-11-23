import { useEffect, useRef } from 'react';

/**
 * Revalida datos operativos sin spinners y sin solapar llamadas en vuelo.
 * @param {() => Promise<void>} reload
 * @param {{intervalMs?: number, onFocus?: boolean}} options
 */
export function useAutoRefresh(reload, { intervalMs = 15000, onFocus = true } = {}) {
  const reloadRef = useRef(reload);
  const inFlight = useRef(false);

  reloadRef.current = reload;

  useEffect(() => {
    const run = async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        await reloadRef.current();
      } catch {
        // El polling es silencioso: no debe borrar el estado de la ultima accion.
      } finally {
        inFlight.current = false;
      }
    };

    const timer = window.setInterval(run, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === 'visible') run();
    };

    if (onFocus) {
      window.addEventListener('focus', run);
      document.addEventListener('visibilitychange', onVisible);
    }

    return () => {
      window.clearInterval(timer);
      if (onFocus) {
        window.removeEventListener('focus', run);
        document.removeEventListener('visibilitychange', onVisible);
      }
    };
  }, [intervalMs, onFocus]);
}
