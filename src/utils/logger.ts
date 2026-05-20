import { logConfig, type LogCategory, type LogLevel } from '../config/logConfig';

function isLevelEnabled(level: LogLevel): boolean {
    return logConfig.enabled && logConfig.levels[level];
}

function isCategoryEnabled(category: LogCategory): boolean {
    return logConfig.enabled && logConfig.categories[category];
}

function shouldLog(category: LogCategory, level: LogLevel): boolean {
    return isLevelEnabled(level) && isCategoryEnabled(category);
}

function prefix(category: LogCategory): string {
    return `[Finans:${category}]`;
}

export type Logger = {
    log: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    debug: (...args: unknown[]) => void;
};

export function createLogger(category: LogCategory): Logger {
    const write =
        (level: LogLevel, method: 'log' | 'warn' | 'error' | 'debug') =>
        (...args: unknown[]) => {
            if (!shouldLog(category, level)) return;
            console[method](prefix(category), ...args);
        };

    return {
        log: write('log', 'log'),
        warn: write('warn', 'warn'),
        error: write('error', 'error'),
        debug: write('debug', 'debug'),
    };
}

/** Promise .catch için: `promise.catch(logCatch('session'))` */
export function logCatch(category: LogCategory, level: LogLevel = 'error') {
    return (reason: unknown) => {
        createLogger(category)[level](reason);
    };
}

/** Sık kullanılan kategoriler */
export const logger = {
    general: createLogger('general'),
    auth: createLogger('auth'),
    firebaseSync: createLogger('firebase_sync'),
    firebasePush: createLogger('firebase_push'),
    notifications: createLogger('notifications'),
    session: createLogger('session'),
    reports: createLogger('reports'),
    pinMigration: createLogger('pin_migration'),
} as const;
