import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import type { FirebaseApp } from 'firebase/app';
import { logger } from '../utils/logger';

const APP_CHECK_DEBUG_TOKEN = process.env.EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN ?? '';
const RECAPTCHA_SITE_KEY = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY ?? '';

/** Geliştirmede debug token ile birlikte kullanılan geçici reCAPTCHA (yalnızca debug modunda). */
const DEV_RECAPTCHA_PLACEHOLDER = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXJiZCvI';

let initialized = false;

/**
 * App Check — Expo: kök `.env` içinde EXPO_PUBLIC_* değişkenleri.
 * Debug: Console'da kayıtlı token + EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN
 */
export function initFirebaseAppCheck(app: FirebaseApp): void {
    if (initialized) return;

    const hasDebug = Boolean(APP_CHECK_DEBUG_TOKEN);
    const hasProductionKey = Boolean(RECAPTCHA_SITE_KEY);

    if (!hasDebug && !hasProductionKey) {
        logger.general.log('App Check atlandı — EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN veya RECAPTCHA_SITE_KEY yok');
        return;
    }

    try {
        if (hasDebug) {
            (globalThis as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN =
                APP_CHECK_DEBUG_TOKEN;
            logger.general.log('App Check debug token yüklendi');
        }

        const siteKey =
            RECAPTCHA_SITE_KEY || (hasDebug && __DEV__ ? DEV_RECAPTCHA_PLACEHOLDER : '');

        if (!siteKey) {
            logger.general.log('App Check atlandı — reCAPTCHA site key gerekli');
            return;
        }

        initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(siteKey),
            isTokenAutoRefreshEnabled: true,
        });
        initialized = true;
        logger.general.log(
            hasDebug ? 'Firebase App Check başlatıldı (debug)' : 'Firebase App Check başlatıldı'
        );
    } catch (err) {
        logger.general.warn('App Check başlatılamadı', err);
    }
}
