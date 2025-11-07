import { create } from 'zustand';
import type { UserWithOnline } from '../types/index';

interface ChatState {
  assignedTelesale: Record<string, UserWithOnline | null>;
  labels: Record<string, string>; // <-- thêm labels vào đây
  setAssignedTelesale: (userId: string, telesale: UserWithOnline) => void;
  setLabel: (userId: string, label: string) => void;
  getLabel: (userId: string) => string | undefined;
}

export const useChatStore = create<ChatState>((set, get) => ({
  assignedTelesale: {},
  labels: {}, // <-- khởi tạo labels
  setAssignedTelesale: (userId, telesale) =>
    set((state) => ({
      assignedTelesale: { ...state.assignedTelesale, [userId]: telesale },
    })),
  setLabel: (userId, label) =>
    set((state) => ({
      labels: { ...state.labels, [userId]: label }, // labels đã có trong state
    })),
  getLabel: (userId) => get().labels[userId],
}));