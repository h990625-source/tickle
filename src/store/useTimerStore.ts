import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'timeUp' | 'completed' | 'abandoned' | 'report';

export interface TimerSessionData {
  taskName: string;
  projectTag: string | null;
  plannedSeconds: number;
  actualSeconds: number; // focus + pause
  focusSeconds: number;
  pauseSeconds: number;
  pauseCount: number;
  extensionCount: number;
  totalExtensionSeconds: number;
  tabLeaveCount: number;
  startedAt: string | null;
  endedAt: string | null;
}

interface TimerState {
  status: TimerStatus;
  session: TimerSessionData;
  hasSaved?: boolean; // true when session already persisted to Supabase
  setTaskName: (name: string) => void;
  setProjectTag: (tag: string | null) => void;
  setPlannedSeconds: (seconds: number) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  markTimeUp: () => void;
  extendTimer: (additionalSeconds: number) => void;
  abandonTimer: () => void;
  completeTimer: () => void;
  recordTabLeave: () => void;
  updateTick: (focusDelta: number, pauseDelta: number) => void;
  resetTimer: () => void;
  goToReport: () => void;
  setHasSaved: (value: boolean) => void;
}

const initialSessionData: TimerSessionData = {
  taskName: '',
  projectTag: null,
  plannedSeconds: 0,
  actualSeconds: 0,
  focusSeconds: 0,
  pauseSeconds: 0,
  pauseCount: 0,
  extensionCount: 0,
  totalExtensionSeconds: 0,
  tabLeaveCount: 0,
  startedAt: null,
  endedAt: null,
};

export const useTimerStore = create<TimerState>()(
  persist(
    (set) => ({
      status: 'idle',
      session: { ...initialSessionData },
      hasSaved: false,

      setTaskName: (name) => set((state) => ({ session: { ...state.session, taskName: name } })),
      setProjectTag: (tag) => set((state) => ({ session: { ...state.session, projectTag: tag } })),
      setPlannedSeconds: (seconds) => set((state) => ({ session: { ...state.session, plannedSeconds: seconds } })),

      startTimer: () => set((state) => ({
        status: 'running',
        session: {
          ...state.session,
          actualSeconds: 0,
          focusSeconds: 0,
          pauseSeconds: 0,
          pauseCount: 0,
          extensionCount: 0,
          totalExtensionSeconds: 0,
          tabLeaveCount: 0,
          startedAt: new Date().toISOString(),
          endedAt: null,
        }
      })),

      pauseTimer: () => set({ status: 'paused' }),

      resumeTimer: () => set((state) => ({
        status: 'running',
        session: { ...state.session, pauseCount: state.session.pauseCount + 1 }
      })),

      markTimeUp: () => set({ status: 'timeUp' }),

      extendTimer: (additionalSeconds) => set((state) => ({
        status: 'running',
        session: {
          ...state.session,
          plannedSeconds: state.session.plannedSeconds + additionalSeconds,
          extensionCount: state.session.extensionCount + 1,
          totalExtensionSeconds: state.session.totalExtensionSeconds + additionalSeconds,
        }
      })),

      abandonTimer: () => set((state) => ({
        status: 'abandoned',
        session: { ...state.session, endedAt: new Date().toISOString() }
      })),

      completeTimer: () => set((state) => ({
        status: 'completed',
        session: { ...state.session, endedAt: new Date().toISOString() }
      })),

      recordTabLeave: () => set((state) => ({
        session: { ...state.session, tabLeaveCount: state.session.tabLeaveCount + 1 }
      })),

      updateTick: (focusDelta, pauseDelta) => set((state) => ({
        session: {
          ...state.session,
          focusSeconds: state.session.focusSeconds + focusDelta,
          pauseSeconds: state.session.pauseSeconds + pauseDelta,
          actualSeconds: state.session.actualSeconds + focusDelta + pauseDelta,
        }
      })),

      goToReport: () => set({ status: 'report' }),

      resetTimer: () => set({ status: 'idle', session: { ...initialSessionData }, hasSaved: false }),
      setHasSaved: (value) => set({ hasSaved: value }),
    }),
    { name: 'deepflow-storage' }
  )
);
