import {
    collection,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    onSnapshot,
    writeBatch,
    getDocs,
    Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from '../../config/firebase';
import type { Transaction, Reminder } from '../../store/useFinanceStore';
import { remindersForCloud } from '../../utils/cloudSnapshot';
import {
    DEFAULT_FINANCE_DATA,
    type UserFinanceData,
    type FinanceSnapshotMeta,
    subscribeToUserFinance as subscribeLegacy,
    saveUserFinance as saveLegacy,
    clearUserFinance as clearLegacy,
} from './userData';
import { logger } from '../../utils/logger';

export const FIRESTORE_SCHEMA_VERSION = 2;
const SCHEMA_VERSION = FIRESTORE_SCHEMA_VERSION;

export type { UserFinanceData, FinanceSnapshotMeta };

export type FinanceSubscribeOptions = {
    onError?: (message: string) => void;
};

/** v2 save sırasında getDocs önlemek için son bilinen uzak id listesi */
const remoteIdCache = new Map<string, { txIds: Set<string>; remIds: Set<string> }>();

function userRef(userId: string) {
    const db = getFirebaseDb();
    if (!db) throw new Error('Firestore kullanılamıyor.');
    return { db, userId };
}

function mapFirestoreError(err: unknown): string {
    const code =
        err && typeof err === 'object' && 'code' in err
            ? String((err as { code: string }).code)
            : '';
    if (code === 'permission-denied') {
        return 'Firestore erişim reddedildi. Güvenlik kurallarını (v2 alt koleksiyonlar) kontrol edin.';
    }
    if (code === 'unavailable') {
        return 'Firestore şu an kullanılamıyor. İnternet bağlantınızı kontrol edin.';
    }
    return err instanceof Error ? err.message : 'Bulut verisi alınamadı.';
}

async function getStoredSchemaVersion(userId: string): Promise<number> {
    const { db, userId: uid } = userRef(userId);
    const snap = await getDoc(doc(db, 'users', uid, 'meta', 'schema'));
    if (!snap.exists()) return 1;
    return (snap.data().version as number) ?? 1;
}

async function loadLegacyFinanceDoc(userId: string): Promise<UserFinanceData | null> {
    const { db, userId: uid } = userRef(userId);
    const snap = await getDoc(doc(db, 'users', uid, 'data', 'finance'));
    if (!snap.exists()) return null;
    const raw = snap.data() as Partial<UserFinanceData>;
    return {
        transactions: raw.transactions ?? [],
        reminders: remindersForCloud(
            (raw.reminders ?? []).map((r) => ({ ...r, time: r.time ?? '09:00' }))
        ),
        incomeCategories: raw.incomeCategories ?? DEFAULT_FINANCE_DATA.incomeCategories,
        expenseCategories: raw.expenseCategories ?? DEFAULT_FINANCE_DATA.expenseCategories,
        monthlyExpenseBudget: raw.monthlyExpenseBudget ?? null,
        updatedAt: raw.updatedAt ?? new Date(0).toISOString(),
    };
}

async function migrateLegacyToV2(userId: string, legacy: UserFinanceData): Promise<void> {
    const { db, userId: uid } = userRef(userId);
    const batch = writeBatch(db);

    for (const t of legacy.transactions) {
        batch.set(doc(db, 'users', uid, 'transactions', t.id), t);
    }
    for (const r of legacy.reminders) {
        batch.set(doc(db, 'users', uid, 'reminders', r.id), r);
    }
    batch.set(doc(db, 'users', uid, 'settings', 'main'), {
        incomeCategories: legacy.incomeCategories,
        expenseCategories: legacy.expenseCategories,
        monthlyExpenseBudget: legacy.monthlyExpenseBudget ?? null,
        updatedAt: legacy.updatedAt,
    });
    batch.set(doc(db, 'users', uid, 'meta', 'schema'), {
        version: SCHEMA_VERSION,
        migratedAt: new Date().toISOString(),
    });

    await batch.commit();
    remoteIdCache.set(userId, {
        txIds: new Set(legacy.transactions.map((t) => t.id)),
        remIds: new Set(legacy.reminders.map((r) => r.id)),
    });
    logger.firebaseSync.log('Firestore v2 alt koleksiyon migrasyonu tamamlandı');
}

async function ensureSchema(userId: string): Promise<'legacy' | 'v2'> {
    const version = await getStoredSchemaVersion(userId);
    if (version >= SCHEMA_VERSION) return 'v2';

    const legacy = await loadLegacyFinanceDoc(userId);
    if (legacy) {
        await migrateLegacyToV2(userId, legacy);
        return 'v2';
    }

    await setDoc(doc(getFirebaseDb()!, 'users', userId, 'meta', 'schema'), {
        version: SCHEMA_VERSION,
        migratedAt: new Date().toISOString(),
    });
    return 'v2';
}

export async function saveUserFinance(
    userId: string,
    data: Omit<UserFinanceData, 'updatedAt'>,
    options?: { ifRemoteOlderThan?: string }
): Promise<string> {
    if (!isFirebaseConfigured()) return new Date().toISOString();

    const mode = await getStoredSchemaVersion(userId);
    if (mode < SCHEMA_VERSION) {
        return saveLegacy(userId, data, options);
    }

    const { db, userId: uid } = userRef(userId);
    const updatedAt = new Date().toISOString();
    const settingsRef = doc(db, 'users', uid, 'settings', 'main');

    if (options?.ifRemoteOlderThan) {
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
            const remoteAt = (snap.data().updatedAt as string) ?? '';
            if (remoteAt > options.ifRemoteOlderThan) {
                throw new Error('REMOTE_NEWER_THAN_LOCAL');
            }
        }
    }

    const batch = writeBatch(db);
    const newTxIds = new Set(data.transactions.map((t) => t.id));
    const newRemIds = new Set(data.reminders.map((r) => r.id));

    const cached = remoteIdCache.get(userId);
    if (cached) {
        for (const id of cached.txIds) {
            if (!newTxIds.has(id)) {
                batch.delete(doc(db, 'users', uid, 'transactions', id));
            }
        }
        for (const id of cached.remIds) {
            if (!newRemIds.has(id)) {
                batch.delete(doc(db, 'users', uid, 'reminders', id));
            }
        }
    } else {
        const [existingTx, existingRem] = await Promise.all([
            getDocs(collection(db, 'users', uid, 'transactions')),
            getDocs(collection(db, 'users', uid, 'reminders')),
        ]);
        for (const d of existingTx.docs) {
            if (!newTxIds.has(d.id)) batch.delete(d.ref);
        }
        for (const d of existingRem.docs) {
            if (!newRemIds.has(d.id)) batch.delete(d.ref);
        }
    }

    for (const t of data.transactions) {
        batch.set(doc(db, 'users', uid, 'transactions', t.id), t);
    }
    for (const r of data.reminders) {
        batch.set(doc(db, 'users', uid, 'reminders', r.id), r);
    }
    batch.set(settingsRef, {
        incomeCategories: data.incomeCategories,
        expenseCategories: data.expenseCategories,
        monthlyExpenseBudget: data.monthlyExpenseBudget ?? null,
        updatedAt,
    });

    await batch.commit();

    remoteIdCache.set(userId, { txIds: newTxIds, remIds: newRemIds });
    return updatedAt;
}

export function subscribeToUserFinance(
    userId: string,
    onUpdate: (data: UserFinanceData, meta: FinanceSnapshotMeta) => void,
    options?: FinanceSubscribeOptions
): Unsubscribe {
    const reportError = (err: unknown) => {
        const message = mapFirestoreError(err);
        logger.firebaseSync.error('subscribeToUserFinance', err);
        options?.onError?.(message);
    };

    if (!isFirebaseConfigured()) {
        onUpdate(DEFAULT_FINANCE_DATA, { exists: false });
        return () => {};
    }

    let cancelled = false;
    let unsubs: Unsubscribe[] = [];
    let mergeTimer: ReturnType<typeof setTimeout> | null = null;

    const partial: {
        transactions?: Transaction[];
        reminders?: Reminder[];
        settings?: Partial<UserFinanceData>;
        exists: boolean;
    } = { exists: false };

    const listenersReady = {
        transactions: false,
        reminders: false,
        settings: false,
    };

    const updateIdCache = () => {
        if (partial.transactions && partial.reminders) {
            remoteIdCache.set(userId, {
                txIds: new Set(partial.transactions.map((t) => t.id)),
                remIds: new Set(partial.reminders.map((r) => r.id)),
            });
        }
    };

    const emit = () => {
        if (!listenersReady.transactions || !listenersReady.reminders || !listenersReady.settings) {
            return;
        }

        updateIdCache();

        onUpdate(
            {
                transactions: partial.transactions ?? [],
                reminders: remindersForCloud(
                    (partial.reminders ?? []).map((r) => ({
                        ...r,
                        time: r.time ?? '09:00',
                    }))
                ),
                incomeCategories:
                    partial.settings?.incomeCategories ?? DEFAULT_FINANCE_DATA.incomeCategories,
                expenseCategories:
                    partial.settings?.expenseCategories ?? DEFAULT_FINANCE_DATA.expenseCategories,
                monthlyExpenseBudget: partial.settings?.monthlyExpenseBudget ?? null,
                updatedAt: partial.settings?.updatedAt ?? new Date(0).toISOString(),
            },
            { exists: partial.exists }
        );
    };

    const scheduleEmit = () => {
        if (mergeTimer) clearTimeout(mergeTimer);
        mergeTimer = setTimeout(emit, 80);
    };

    (async () => {
        try {
            const mode = await ensureSchema(userId);
            if (cancelled) return;

            if (mode === 'legacy') {
                const unsub = subscribeLegacy(userId, (data, meta) => onUpdate(data, meta));
                unsubs = [unsub];
                return;
            }

            const { db, userId: uid } = userRef(userId);

            unsubs.push(
                onSnapshot(
                    collection(db, 'users', uid, 'transactions'),
                    (snap) => {
                        partial.transactions = snap.docs.map((d) => d.data() as Transaction);
                        partial.exists = partial.exists || snap.size > 0;
                        listenersReady.transactions = true;
                        scheduleEmit();
                    },
                    reportError
                )
            );

            unsubs.push(
                onSnapshot(
                    collection(db, 'users', uid, 'reminders'),
                    (snap) => {
                        partial.reminders = snap.docs.map((d) => d.data() as Reminder);
                        partial.exists = partial.exists || snap.size > 0;
                        listenersReady.reminders = true;
                        scheduleEmit();
                    },
                    reportError
                )
            );

            unsubs.push(
                onSnapshot(
                    doc(db, 'users', uid, 'settings', 'main'),
                    (snap) => {
                        if (snap.exists()) {
                            const d = snap.data();
                            partial.settings = {
                                incomeCategories: d.incomeCategories as string[],
                                expenseCategories: d.expenseCategories as string[],
                                monthlyExpenseBudget:
                                    (d.monthlyExpenseBudget as number | null) ?? null,
                                updatedAt: d.updatedAt as string,
                            };
                            partial.exists = true;
                        } else {
                            partial.settings = {
                                incomeCategories: DEFAULT_FINANCE_DATA.incomeCategories,
                                expenseCategories: DEFAULT_FINANCE_DATA.expenseCategories,
                                monthlyExpenseBudget: null,
                                updatedAt: new Date(0).toISOString(),
                            };
                        }
                        listenersReady.settings = true;
                        scheduleEmit();
                    },
                    reportError
                )
            );
        } catch (err) {
            reportError(err);
        }
    })();

    return () => {
        cancelled = true;
        if (mergeTimer) clearTimeout(mergeTimer);
        unsubs.forEach((u) => u());
    };
}

export async function clearUserFinance(userId: string): Promise<void> {
    if (!isFirebaseConfigured()) return;

    remoteIdCache.delete(userId);

    const version = await getStoredSchemaVersion(userId);
    if (version < SCHEMA_VERSION) {
        await clearLegacy(userId);
        return;
    }

    const { db, userId: uid } = userRef(userId);
    const batch = writeBatch(db);

    const [txSnap, remSnap] = await Promise.all([
        getDocs(collection(db, 'users', uid, 'transactions')),
        getDocs(collection(db, 'users', uid, 'reminders')),
    ]);

    txSnap.docs.forEach((d) => batch.delete(d.ref));
    remSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.set(doc(db, 'users', uid, 'settings', 'main'), {
        incomeCategories: DEFAULT_FINANCE_DATA.incomeCategories,
        expenseCategories: DEFAULT_FINANCE_DATA.expenseCategories,
        monthlyExpenseBudget: null,
        updatedAt: new Date().toISOString(),
    });

    await batch.commit();
}

export type SettingsPatch = Partial<{
    incomeCategories: string[];
    expenseCategories: string[];
    monthlyExpenseBudget: number | null;
}>;

async function bumpSettingsUpdatedAt(userId: string): Promise<string> {
    const { db, userId: uid } = userRef(userId);
    const updatedAt = new Date().toISOString();
    await setDoc(
        doc(db, 'users', uid, 'settings', 'main'),
        { updatedAt },
        { merge: true }
    );
    return updatedAt;
}

function touchTxCache(userId: string, id: string, add: boolean) {
    const cached = remoteIdCache.get(userId);
    if (!cached) return;
    if (add) cached.txIds.add(id);
    else cached.txIds.delete(id);
}

function touchRemCache(userId: string, id: string, add: boolean) {
    const cached = remoteIdCache.get(userId);
    if (!cached) return;
    if (add) cached.remIds.add(id);
    else cached.remIds.delete(id);
}

export async function upsertTransaction(userId: string, tx: Transaction): Promise<string> {
    if (!isFirebaseConfigured()) return new Date().toISOString();
    await ensureSchema(userId);
    const { db, userId: uid } = userRef(userId);
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', uid, 'transactions', tx.id), tx);
    const updatedAt = new Date().toISOString();
    batch.set(
        doc(db, 'users', uid, 'settings', 'main'),
        { updatedAt },
        { merge: true }
    );
    await batch.commit();
    touchTxCache(userId, tx.id, true);
    return updatedAt;
}

export async function deleteTransactionDoc(userId: string, id: string): Promise<string> {
    if (!isFirebaseConfigured()) return new Date().toISOString();
    const { db, userId: uid } = userRef(userId);
    await deleteDoc(doc(db, 'users', uid, 'transactions', id));
    touchTxCache(userId, id, false);
    return bumpSettingsUpdatedAt(userId);
}

export async function upsertReminder(userId: string, reminder: Reminder): Promise<string> {
    if (!isFirebaseConfigured()) return new Date().toISOString();
    await ensureSchema(userId);
    const { db, userId: uid } = userRef(userId);
    const cloudReminder = remindersForCloud([reminder])[0];
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', uid, 'reminders', reminder.id), cloudReminder);
    const updatedAt = new Date().toISOString();
    batch.set(
        doc(db, 'users', uid, 'settings', 'main'),
        { updatedAt },
        { merge: true }
    );
    await batch.commit();
    touchRemCache(userId, reminder.id, true);
    return updatedAt;
}

export async function deleteReminderDoc(userId: string, id: string): Promise<string> {
    if (!isFirebaseConfigured()) return new Date().toISOString();
    const { db, userId: uid } = userRef(userId);
    await deleteDoc(doc(db, 'users', uid, 'reminders', id));
    touchRemCache(userId, id, false);
    return bumpSettingsUpdatedAt(userId);
}

export async function patchSettings(userId: string, patch: SettingsPatch): Promise<string> {
    if (!isFirebaseConfigured()) return new Date().toISOString();
    const { db, userId: uid } = userRef(userId);
    const updatedAt = new Date().toISOString();
    await setDoc(
        doc(db, 'users', uid, 'settings', 'main'),
        { ...patch, updatedAt },
        { merge: true }
    );
    return updatedAt;
}

export async function fetchUserFinanceOnce(userId: string): Promise<UserFinanceData> {
    if (!isFirebaseConfigured()) return DEFAULT_FINANCE_DATA;

    const mode = await getStoredSchemaVersion(userId);
    if (mode < SCHEMA_VERSION) {
        const legacy = await loadLegacyFinanceDoc(userId);
        if (legacy) return legacy;
        return DEFAULT_FINANCE_DATA;
    }

    const { db, userId: uid } = userRef(userId);
    const [txSnap, remSnap, settingsSnap] = await Promise.all([
        getDocs(collection(db, 'users', uid, 'transactions')),
        getDocs(collection(db, 'users', uid, 'reminders')),
        getDoc(doc(db, 'users', uid, 'settings', 'main')),
    ]);

    const settings = settingsSnap.exists()
        ? settingsSnap.data()
        : {
              incomeCategories: DEFAULT_FINANCE_DATA.incomeCategories,
              expenseCategories: DEFAULT_FINANCE_DATA.expenseCategories,
              monthlyExpenseBudget: null,
              updatedAt: new Date(0).toISOString(),
          };

    const data: UserFinanceData = {
        transactions: txSnap.docs.map((d) => d.data() as Transaction),
        reminders: remindersForCloud(
            remSnap.docs.map((d) => {
                const r = d.data() as Reminder;
                return { ...r, time: r.time ?? '09:00' };
            })
        ),
        incomeCategories:
            (settings.incomeCategories as string[]) ?? DEFAULT_FINANCE_DATA.incomeCategories,
        expenseCategories:
            (settings.expenseCategories as string[]) ?? DEFAULT_FINANCE_DATA.expenseCategories,
        monthlyExpenseBudget: (settings.monthlyExpenseBudget as number | null) ?? null,
        updatedAt: (settings.updatedAt as string) ?? new Date(0).toISOString(),
    };

    remoteIdCache.set(userId, {
        txIds: new Set(data.transactions.map((t) => t.id)),
        remIds: new Set(data.reminders.map((r) => r.id)),
    });

    return data;
}

export { DEFAULT_FINANCE_DATA };
