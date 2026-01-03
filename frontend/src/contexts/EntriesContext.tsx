import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  ReactNode,
  useEffect,
  useRef,
} from 'react';
import type { PatchTypeWithKey } from '@/hooks/useConversationHistory';

interface EntriesContextType {
  entries: PatchTypeWithKey[];
  setEntries: (entries: PatchTypeWithKey[]) => void;
  reset: () => void;
  attemptId: string | null;
  setAttemptId: (id: string) => void;
}

const EntriesContext = createContext<EntriesContextType | null>(null);

interface EntriesProviderProps {
  children: ReactNode;
}

const STORAGE_KEY_PREFIX = 'conversation-history:';

const saveToStorage = (attemptId: string, entries: PatchTypeWithKey[]) => {
  try {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${attemptId}`,
      JSON.stringify(entries)
    );
  } catch (e) {
    console.warn('Failed to persist conversation history to localStorage', e);
  }
};

const loadFromStorage = (attemptId: string): PatchTypeWithKey[] | null => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${attemptId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load conversation history from localStorage', e);
  }
  return null;
};

const clearStorage = (attemptId: string) => {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${attemptId}`);
  } catch (e) {
    console.warn('Failed to clear conversation history from localStorage', e);
  }
};

export const EntriesProvider = ({ children }: EntriesProviderProps) => {
  const [attemptId, setAttemptIdState] = useState<string | null>(null);
  const [entries, setEntriesState] = useState<PatchTypeWithKey[]>([]);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (attemptId && !isInitialized.current) {
      const stored = loadFromStorage(attemptId);
      if (stored) {
        setEntriesState(stored);
      }
      isInitialized.current = true;
    }
  }, [attemptId]);

  const setEntries = useCallback(
    (newEntries: PatchTypeWithKey[]) => {
      setEntriesState(newEntries);
      if (attemptId) {
        saveToStorage(attemptId, newEntries);
      }
    },
    [attemptId]
  );

  const reset = useCallback(() => {
    setEntriesState([]);
    if (attemptId) {
      clearStorage(attemptId);
    }
  }, [attemptId]);

  const setAttemptId = useCallback((id: string) => {
    isInitialized.current = false;
    setAttemptIdState(id);
  }, []);

  const value = useMemo(
    () => ({
      entries,
      setEntries,
      reset,
      attemptId,
      setAttemptId,
    }),
    [entries, setEntries, reset, attemptId, setAttemptId]
  );

  return (
    <EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>
  );
};

export const useEntries = (): EntriesContextType => {
  const context = useContext(EntriesContext);
  if (!context) {
    throw new Error('useEntries must be used within an EntriesProvider');
  }
  return context;
};
