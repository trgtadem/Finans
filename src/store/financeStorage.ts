import AsyncStorage from '@react-native-async-storage/async-storage';

let activeUserId: string | null = null;

export function getFinanceStorageKey(): string {
    return activeUserId ? `finance-storage-${activeUserId}` : 'finance-storage-local';
}

export function setFinanceStorageUserId(uid: string | null): void {
    activeUserId = uid;
}

/** Zustand persist için kullanıcıya özel AsyncStorage adaptörü */
export function createFinancePersistStorage() {
    return {
        getItem: async (_name: string): Promise<string | null> => {
            return AsyncStorage.getItem(getFinanceStorageKey());
        },
        setItem: async (_name: string, value: string): Promise<void> => {
            await AsyncStorage.setItem(getFinanceStorageKey(), value);
        },
        removeItem: async (_name: string): Promise<void> => {
            await AsyncStorage.removeItem(getFinanceStorageKey());
        },
    };
}
