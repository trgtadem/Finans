/**
 * Uygulama genelinde tek geri bildirim API'si.
 * Toast ve onay diyalogları için yalnızca bu modülü kullanın.
 *
 * @example
 * import { feedback } from '@/components/feedback';
 * feedback.error('Şifre hatalı');
 * feedback.success('Kaydedildi');
 * feedback.confirm({ title: 'Sil', message: '...', onConfirm: () => {} });
 */
import { useToastStore, ToastType } from './store/useToastStore';
import { useConfirmStore, ConfirmOptions } from './store/useConfirmStore';

function showToast(message: string, type: ToastType) {
    useToastStore.getState().show(message, type);
}

export const feedback = {
    success: (message: string) => showToast(message, 'success'),
    error: (message: string) => showToast(message, 'error'),
    info: (message: string) => showToast(message, 'info'),
    warning: (message: string) => showToast(message, 'warning'),
    confirm: (options: ConfirmOptions) => useConfirmStore.getState().show(options),
    hideToast: () => useToastStore.getState().hide(),
};

export type { ConfirmOptions, ToastType };
