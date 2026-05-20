/**
 * Uygulama log ayarları — tüm console çıktıları buradan yönetilir.
 * Geliştirme sırasında ilgili kategoriyi true yapın; üretimde genelde kapalı kalır.
 */

export type LogCategory =
    | 'general'
    | 'auth'
    | 'firebase_sync'
    | 'firebase_push'
    | 'notifications'
    | 'session'
    | 'reports'
    | 'pin_migration';

export type LogLevel = 'log' | 'warn' | 'error' | 'debug';

export const logConfig = {
    /** false → hiçbir kategori log yazmaz */
    enabled: __DEV__,

    /** Kategori bazlı aç/kapa */
    categories: {
        general: false,
        auth: true,
        firebase_sync: true,
        firebase_push: false,
        notifications: true,
        session: true,
        reports: true,
        pin_migration: false,
    } satisfies Record<LogCategory, boolean>,

    /** Seviye bazlı aç/kapa (error genelde açık bırakılır) */
    levels: {
        log: true,
        warn: true,
        error: true,
        debug: false,
    } satisfies Record<LogLevel, boolean>,
} as const;
