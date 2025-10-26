// chatStore.ts
import { create } from 'zustand';
import type { UserWithOnline } from '../types/index';

interface ChatState {
  assignedTelesale: Record<string, UserWithOnline | null>;
  setAssignedTelesale: (userId: string, telesale: UserWithOnline) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  assignedTelesale: {},
  setAssignedTelesale: (userId, telesale) =>
    set((state) => ({
      assignedTelesale: { ...state.assignedTelesale, [userId]: telesale },
    })),
}));
