import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TimerSessionData } from './useTimerStore';

export interface HistoryEntry {
  id: string;
  session: TimerSessionData;
  status: 'completed' | 'completed_overtime' | 'abandoned';
  sessionDate: string; // YYYY-MM-DD
  createdAt: string;
}

interface HistoryState {
  entries: HistoryEntry[];
  addEntry: (session: TimerSessionData, status: 'completed' | 'completed_overtime' | 'abandoned') => void;
  removeEntry: (id: string) => void;
  clearAll: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],

      addEntry: (session, status) => set((state) => ({
        entries: [
          {
            id: crypto.randomUUID(),
            session,
            status,
            sessionDate: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
          },
          ...state.entries,
        ],
      })),

      removeEntry: (id) => set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
      })),

      clearAll: () => set({ entries: [] }),
    }),
    {
      name: 'deepflow-history',
    }
  )
);
