import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastState {
    toast: ToastItem | null;
    show: (message: string, type?: ToastType) => void;
    hide: () => void;
}

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set, get) => ({
    toast: null,
    show: (message, type = 'info') => {
        if (hideTimer) clearTimeout(hideTimer);
        const id = `${Date.now()}`;
        set({ toast: { id, message, type } });
        hideTimer = setTimeout(() => {
            if (get().toast?.id === id) set({ toast: null });
        }, 3200);
    },
    hide: () => {
        if (hideTimer) clearTimeout(hideTimer);
        set({ toast: null });
    },
}));
