import { setFinanceStorageUserId } from './financeStorage';

/** Döngüsel import önlemek için store lazy yüklenir */
async function getFinanceStore() {
    const { useFinanceStore } = await import('./useFinanceStore');
    return useFinanceStore;
}

export async function rehydrateFinanceStore(): Promise<void> {
    const useFinanceStore = await getFinanceStore();
    await useFinanceStore.persist.rehydrate();
    useFinanceStore.getState().setCloudDataReady(true);
}

/** Kullanıcı oturumu: önbelleği yükle (yalnızca hesap değişiminde sıfırla). */
export async function startFinanceSession(
    uid: string,
    options?: { reset?: boolean }
): Promise<void> {
    setFinanceStorageUserId(uid);
    const useFinanceStore = await getFinanceStore();
    const store = useFinanceStore.getState();
    if (options?.reset) {
        store.resetData();
    }
    await useFinanceStore.persist.rehydrate();
    store.setCloudDataReady(true);
}

export async function clearFinanceSession(): Promise<void> {
    setFinanceStorageUserId(null);
    const useFinanceStore = await getFinanceStore();
    useFinanceStore.getState().resetData();
    useFinanceStore.getState().setCloudDataReady(false);
    await rehydrateFinanceStore();
}

export { setFinanceStorageUserId };
