'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type AppMode = 'bedtime' | 'family';

const STORAGE_KEY = 'storykeeper:mode';

const ModeContext = createContext<AppMode>('bedtime');

export function useMode(): AppMode {
  return useContext(ModeContext);
}

export function useModeLabels() {
  const mode = useMode();
  if (mode === 'family') {
    return {
      storyteller: 'Storyteller',
      storytellerUpper: 'STORYTELLER',
      listener: 'Listener',
      listenerUpper: 'LISTENER',
      brand: 'Moonjar Stories',
      libraryLabel: 'Family stories',
      tellerHint: 'Record a family story',
      listenHint: 'Hear your family’s stories',
    } as const;
  }
  return {
    storyteller: 'Storyteller',
    storytellerUpper: 'STORYTELLER',
    listener: 'Listener',
    listenerUpper: 'LISTENER',
    brand: 'Moonjar Stories',
    libraryLabel: 'Your stories',
    tellerHint: 'Record the next part of the story',
    listenHint: 'Hear your story. Pick what happens next.',
  } as const;
}

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AppMode>('bedtime');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlMode = new URLSearchParams(window.location.search).get('mode');
    if (urlMode === 'bedtime' || urlMode === 'family') {
      window.localStorage.setItem(STORAGE_KEY, urlMode);
      setMode(urlMode);
      return;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'bedtime' || stored === 'family') setMode(stored);
    } catch {
      /* localStorage may not be available */
    }
  }, []);

  return (
    <ModeContext.Provider value={mode}>
      <div data-mode={mode} className="contents">
        {children}
      </div>
    </ModeContext.Provider>
  );
}
