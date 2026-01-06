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
  const isUnmountingRef = useRef<boolean>(false);

  const injectInitialEntry = options?.injectInitialEntry;
  const deduplicatePatches = options?.deduplicatePatches;

  function scheduleReconnect() {
    if (retryTimerRef.current || isUnmountingRef.current) return;
    const attempt = retryAttemptsRef.current;
    const delay = Math.min(8000, 1000 * Math.pow(2, attempt));
    retryTimerRef.current = window.setTimeout(() => {
      retryTimerRef.current = null;
      if (!isUnmountingRef.current) {
        setRetryNonce((n) => n + 1);
      }
    }, delay);
  }

  useEffect(() => {
    isUnmountingRef.current = false;

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

      if (injectInitialEntry) {
        injectInitialEntry(dataRef.current);
      }
    }

    finishedRef.current = false;

    const wsEndpoint = endpoint.replace(/^http/, 'ws');
    const ws = new WebSocket(wsEndpoint);
    const connectTime = Date.now();

    ws.onopen = () => {
      if (isUnmountingRef.current) return;
      setError(null);
      setIsConnected(true);
      retryAttemptsRef.current = 0;
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      if (isUnmountingRef.current) return;
      
      try {
        const msg: WsMsg = JSON.parse(event.data);

        if ('JsonPatch' in msg) {
          const patches: Operation[] = msg.JsonPatch;
          const filtered = deduplicatePatches
            ? deduplicatePatches(patches)
            : patches;

          const current = dataRef.current;
          if (!filtered.length || !current) return;

          const next = structuredClone(current);

          try {
            applyPatch(next, filtered);
            dataRef.current = next;
            setData(next);
          } catch (patchError) {
            console.error('Failed to apply patch:', patchError, filtered);
          }
        }

        if ('finished' in msg) {
          finishedRef.current = true;
          ws.close(1000, 'finished');
          wsRef.current = null;
          setIsConnected(false);
        }
      } catch (err) {
        console.error('Failed to process WebSocket message:', err);
      }
    };

    ws.onerror = () => {
      if (isUnmountingRef.current) return;
      const wasImmediateError = Date.now() - connectTime < 100;
      if (!wasImmediateError) {
        setError('Connection failed');
      }
    };

    ws.onclose = (evt) => {
      if (isUnmountingRef.current) return;
      
      setIsConnected(false);
      
      if (wsRef.current === ws) {
        wsRef.current = null;
      }

      if (finishedRef.current || (evt?.code === 1000 && evt?.wasClean)) {
        return;
      }

      if (!enabled || !endpoint) {
        return;
      }

      const wasImmediateClose = Date.now() - connectTime < 100;
      if (!wasImmediateClose) {
        console.warn('WebSocket closed unexpectedly, reconnecting...', evt);
      }

      retryAttemptsRef.current += 1;
      scheduleReconnect();
    };

    wsRef.current = ws;

    return () => {
      isUnmountingRef.current = true;
      
      if (wsRef.current === ws) {
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
