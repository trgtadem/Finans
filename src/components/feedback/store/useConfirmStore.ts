import { create } from 'zustand';

export interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
}

interface ConfirmState extends ConfirmOptions {
    visible: boolean;
    show: (options: ConfirmOptions) => void;
    hide: () => void;
}

const defaults = {
    title: '',
    message: '',
    confirmText: 'Onayla',
    cancelText: 'İptal',
    destructive: false,
    onConfirm: () => {},
    onCancel: undefined as (() => void) | undefined,
};

export const useConfirmStore = create<ConfirmState>((set) => ({
    ...defaults,
    visible: false,
    show: (options) =>
        set({
            ...defaults,
            ...options,
            visible: true,
        }),
    hide: () => set({ visible: false }),
}));
