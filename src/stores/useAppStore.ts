import { create } from 'zustand';
import type { Profile, Activity } from '@/types';

interface AppState {
  currentUser: Profile | null;
  feedFilter: string;
  setCurrentUser: (user: Profile | null) => void;
  setFeedFilter: (filter: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  feedFilter: '전체',
  setCurrentUser: (user) => set({ currentUser: user }),
  setFeedFilter: (filter) => set({ feedFilter: filter }),
}));
