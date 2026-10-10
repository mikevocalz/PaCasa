import { create } from 'zustand';

/**
 * Where a root-level screen returns to. Pa'Casa Live opens OUTSIDE the tab
 * stack (LOCKED ARCHITECTURE, "CENTER — PA'CASA"): pressing the center action
 * records the screen the patient was on, and closing Pa'Casa Live comes back to
 * exactly that screen — the underlying tab selection never changes.
 *
 * The return route is kept in the store rather than only in the link URL so it
 * survives on native, where there is no window.location to read it back from.
 */
export const useRootScreenStore = create<{
  returnTo: string;
  setReturnTo: (returnTo: string) => void;
}>((set) => ({
  returnTo: '/',
  setReturnTo: (returnTo) => set({ returnTo }),
}));