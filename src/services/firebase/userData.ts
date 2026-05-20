import { doc, setDoc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from '../../config/firebase';
import type { Transaction, Reminder } from '../../store/useFinanceStore';
import { remindersForCloud } from '../../utils/cloudSnapshot';

export interface UserFinanceData {
    transactions: Transaction[];
    reminders: Reminder[];
    incomeCategories: string[];
    expenseCategories: string[];
    updatedAt: string;
}

export const DEFAULT_FINANCE_DATA: UserFinanceData = {
    transactions: [],
    reminders: [],
    incomeCategories: ['Maaş', 'Satış', 'Bonus', 'Faiz', 'Diğer'],
    expenseCategories: ['Gıda', 'Ulaşım', 'Eğlence', 'Kira', 'Fatura', 'Genel'],
    updatedAt: new Date(0).toISOString(),
};

function financeDocRef(userId: string) {
    const db = getFirebaseDb();
    if (!db) throw new Error('Firestore kullanılamıyor.');
    return doc(db, 'users', userId, 'data', 'finance');
}

function parseFinanceDoc(raw: Partial<UserFinanceData>): UserFinanceData {
    return {
        transactions: raw.transactions ?? [],
        reminders: remindersForCloud(
            (raw.reminders ?? []).map((r) => ({
                ...r,
                time: r.time ?? '09:00',
            }))
        ),
        incomeCategories:
            raw.incomeCategories ?? DEFAULT_FINANCE_DATA.incomeCategories,
        expenseCategories:
            raw.expenseCategories ?? DEFAULT_FINANCE_DATA.expenseCategories,
        updatedAt: raw.updatedAt ?? new Date().toISOString(),
    };
}

export async function saveUserFinance(
    userId: string,
    data: Omit<UserFinanceData, 'updatedAt'>,
    options?: { ifRemoteOlderThan?: string }
): Promise<string> {
    if (!isFirebaseConfigured()) return new Date().toISOString();

    const ref = financeDocRef(userId);
    const updatedAt = new Date().toISOString();

    if (options?.ifRemoteOlderThan) {
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const remote = snap.data() as Partial<UserFinanceData>;
            const remoteAt = remote.updatedAt ?? '';
            if (remoteAt > options.ifRemoteOlderThan) {
                throw new Error('REMOTE_NEWER_THAN_LOCAL');
            }
        }
    }

    await setDoc(ref, {
        ...data,
        reminders: remindersForCloud(data.reminders as Reminder[]),
        updatedAt,
    });
    return updatedAt;
}

export async function clearUserFinance(userId: string): Promise<void> {
    await saveUserFinance(userId, {
        transactions: [],
        reminders: [],
        incomeCategories: DEFAULT_FINANCE_DATA.incomeCategories,
        expenseCategories: DEFAULT_FINANCE_DATA.expenseCategories,
    });
}

export type FinanceSnapshotMeta = {
    /** Firestore'da users/{uid}/data/finance belgesi var mı */
    exists: boolean;
};

export function subscribeToUserFinance(
    userId: string,
    onUpdate: (data: UserFinanceData, meta: FinanceSnapshotMeta) => void
): Unsubscribe {
    const db = getFirebaseDb();
    if (!db) {
        onUpdate(DEFAULT_FINANCE_DATA, { exists: false });
        return () => {};
    }

    return onSnapshot(
        financeDocRef(userId),
        (snapshot) => {
            if (!snapshot.exists()) {
                onUpdate(
                    {
                        ...DEFAULT_FINANCE_DATA,
                        updatedAt: new Date(0).toISOString(),
                    },
                    { exists: false }
                );
                return;
            }
            onUpdate(parseFinanceDoc(snapshot.data() as Partial<UserFinanceData>), {
                exists: true,
            });
        },
        () => {
            // Ağ hatasında yerel önbelleği boş varsayılanla ezme — yükleme zaman aşımı devreye girer
        }
    );
}
