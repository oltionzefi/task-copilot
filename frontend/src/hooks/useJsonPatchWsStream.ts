import { useEffect, useState, useRef } from 'react';
import { applyPatch } from 'rfc6902';
import type { Operation } from 'rfc6902';

type WsJsonPatchMsg = { JsonPatch: Operation[] };
type WsFinishedMsg = { finished: boolean };
type WsMsg = WsJsonPatchMsg | WsFinishedMsg;

interface UseJsonPatchStreamOptions<T> {
  /**
   * Called once when the stream starts to inject initial data
   */
  injectInitialEntry?: (data: T) => void;
  /**
   * Filter/deduplicate patches before applying them
   */
  deduplicatePatches?: (patches: Operation[]) => Operation[];
}

interface UseJsonPatchStreamResult<T> {
  data: T | undefined;
  isConnected: boolean;
  error: string | null;
}

/**
 * Generic hook for consuming WebSocket streams that send JSON messages with patches
 */
export const useJsonPatchWsStream = <T extends object>(
  endpoint: string | undefined,
  enabled: boolean,
  initialData: () => T,
  options?: UseJsonPatchStreamOptions<T>
): UseJsonPatchStreamResult<T> => {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const dataRef = useRef<T | undefined>(undefined);
  const retryTimerRef = useRef<number | null>(null);
  const retryAttemptsRef = useRef<number>(0);
  const [retryNonce, setRetryNonce] = useState(0);
  const finishedRef = useRef<boolean>(false);

  const injectInitialEntry = options?.injectInitialEntry;
  const deduplicatePatches = options?.deduplicatePatches;

  function scheduleReconnect() {
    if (retryTimerRef.current) return; // already scheduled
    // Exponential backoff with cap: 1s, 2s, 4s, 8s (max), then stay at 8s
    const attempt = retryAttemptsRef.current;
    const delay = Math.min(8000, 1000 * Math.pow(2, attempt));
    retryTimerRef.current = window.setTimeout(() => {
      retryTimerRef.current = null;
      setRetryNonce((n) => n + 1);
    }, delay);
  }

  useEffect(() => {
    // Close existing connection if endpoint changes or disabled
    if (wsRef.current) {
      const ws = wsRef.current;
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      ws.close();
      wsRef.current = null;
    }

    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    if (!enabled || !endpoint) {
      // Reset state when disabled
      retryAttemptsRef.current = 0;
      finishedRef.current = false;
      setData(undefined);
      setIsConnected(false);
      setError(null);
      dataRef.current = undefined;
      return;
    }

    // Initialize data
    if (!dataRef.current) {
      dataRef.current = initialData();

      // Inject initial entry if provided
      if (injectInitialEntry) {
        injectInitialEntry(dataRef.current);
      }
    }

    // Reset finished flag for new connection
    finishedRef.current = false;

    // Convert HTTP endpoint to WebSocket endpoint
    const wsEndpoint = endpoint.replace(/^http/, 'ws');
    const ws = new WebSocket(wsEndpoint);

    ws.onopen = () => {
      setError(null);
      setIsConnected(true);
      // Reset backoff on successful connection
      retryAttemptsRef.current = 0;
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg: WsMsg = JSON.parse(event.data);

        // Handle JsonPatch messages (same as SSE json_patch event)
        if ('JsonPatch' in msg) {
          const patches: Operation[] = msg.JsonPatch;
          const filtered = deduplicatePatches
            ? deduplicatePatches(patches)
            : patches;

          const current = dataRef.current;
          if (!filtered.length || !current) return;

          // Deep clone the current state before mutating it
          const next = structuredClone(current);

          // Apply patch (mutates the clone in place)
          applyPatch(next, filtered);

          dataRef.current = next;
          setData(next);
        }

        // Handle finished messages ({finished: true})
        // Treat finished as terminal - do NOT reconnect
        if ('finished' in msg) {
          finishedRef.current = true;
          ws.close(1000, 'finished');
          wsRef.current = null;
          setIsConnected(false);
        }
      } catch (err) {
        console.error('Failed to process WebSocket message:', err);
        setError('Failed to process stream update');
      }
    };

    ws.onerror = () => {
      setError('Connection failed');
    };

    ws.onclose = (evt) => {
      setIsConnected(false);
      
      // Only clear wsRef if this is still the current WebSocket
      if (wsRef.current === ws) {
        wsRef.current = null;
      }

      // Do not reconnect if we received a finished message or clean close
      if (finishedRef.current || (evt?.code === 1000 && evt?.wasClean)) {
        return;
      }

      // Do not reconnect if disabled or endpoint changed
      // (the effect cleanup will handle it)
      if (!enabled || !endpoint) {
        return;
      }

      // Otherwise, reconnect on unexpected/error closures
      retryAttemptsRef.current += 1;
      scheduleReconnect();
    };

    wsRef.current = ws;

    return () => {
      if (wsRef.current === ws) {
        // Clear all event handlers first to prevent callbacks after cleanup
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;

        // Close regardless of state
        ws.close();
        wsRef.current = null;
      }
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      finishedRef.current = false;
      dataRef.current = undefined;
      setData(undefined);
    };
  }, [
    endpoint,
    enabled,
    initialData,
    injectInitialEntry,
    deduplicatePatches,
    retryNonce,
  ]);

  return { data, isConnected, error };
};
