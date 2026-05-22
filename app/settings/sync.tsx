import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, RefreshCw, Copy, Cloud, Upload, Download } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useFinanceStore } from '../../src/store/useFinanceStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useAppTheme } from '../../src/theme/useAppTheme';
import { Spacing, Radius } from '../../src/theme';
import { isFirebaseConfigured } from '../../src/config/firebase';
import { FIRESTORE_SCHEMA_VERSION } from '../../src/services/firebase/financeRepository';
import { syncNowUpload, syncNowPull } from '../../src/hooks/useFirebaseSync';
import { feedback } from '../../src/components/feedback';
import { logCatch } from '../../src/utils/logger';

export default function SyncSettingsScreen() {
    const router = useRouter();
    const { theme } = useAppTheme();
    const user = useAuthStore((s) => s.user);
    const {
        isSyncing,
        lastSyncAt,
        hasPendingCloudSync,
        syncError,
        cloudUpdatedAt,
    } = useFinanceStore();
    const [isUploading, setIsUploading] = useState(false);
    const [isPulling, setIsPulling] = useState(false);

    const firebaseReady = isFirebaseConfigured();
    const busy = isSyncing || isUploading || isPulling;

    const handleUpload = async () => {
        if (!firebaseReady || !user?.uid) return;
        setIsUploading(true);
        try {
            await syncNowUpload();
            feedback.success('Veriler buluta kaydedildi.');
        } catch {
            feedback.error('Buluta yükleme başarısız.');
        } finally {
            setIsUploading(false);
        }
    };

    const handlePull = async () => {
        if (!firebaseReady || !user?.uid) return;
        setIsPulling(true);
        try {
            await syncNowPull();
        } catch {
            feedback.error('Buluttan indirme başarısız.');
        } finally {
            setIsPulling(false);
        }
    };

    const handleCopyError = async () => {
        if (!syncError) return;
        try {
            await Clipboard.setStringAsync(syncError);
            feedback.success('Hata mesajı kopyalandı.');
        } catch {
            feedback.error('Kopyalanamadı.');
        }
    };

    const formatTime = (iso: string | null) => {
        if (!iso) return '—';
        try {
            return format(new Date(iso), 'd MMMM yyyy, HH:mm', { locale: tr });
        } catch {
            return iso;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Senkronizasyon</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    <Cloud size={32} color={theme.primary} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                        Bulut yedek depo
                    </Text>
                    <Text style={[styles.row, { color: theme.textSecondary }]}>
                        Veriler önce cihazınızda tutulur. Firestore yedek kopyadır.
                    </Text>
                    <Text style={[styles.row, { color: theme.textSecondary }]}>
                        Şema: v{FIRESTORE_SCHEMA_VERSION}
                    </Text>
                    <Text style={[styles.row, { color: theme.textSecondary }]}>
                        Son bulut kaydı: {formatTime(lastSyncAt)}
                    </Text>
                    <Text style={[styles.row, { color: theme.textSecondary }]}>
                        Bulut sürümü: {formatTime(cloudUpdatedAt)}
                    </Text>
                    <Text style={[styles.row, { color: theme.textSecondary }]}>
                        Yedeklenmemiş değişiklik: {hasPendingCloudSync ? 'Evet' : 'Hayır'}
                    </Text>
                    {syncError && (
                        <Text style={[styles.errorText, { color: theme.danger }]}>
                            {syncError}
                        </Text>
                    )}
                </View>

                <TouchableOpacity
                    style={[
                        styles.primaryBtn,
                        { backgroundColor: theme.primary },
                        busy && styles.disabled,
                    ]}
                    onPress={() => handleUpload().catch(logCatch('firebase_sync'))}
                    disabled={busy || !firebaseReady}
                >
                    {isUploading || isSyncing ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Upload size={20} color="#FFF" />
                            <Text style={styles.primaryBtnText}>Buluta yükle</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.secondaryBtn,
                        { borderColor: theme.border, backgroundColor: theme.surface },
                        busy && styles.disabled,
                    ]}
                    onPress={() => handlePull().catch(logCatch('firebase_sync'))}
                    disabled={busy || !firebaseReady}
                >
                    {isPulling ? (
                        <ActivityIndicator color={theme.primary} />
                    ) : (
                        <>
                            <Download size={20} color={theme.primary} />
                            <Text style={[styles.secondaryBtnText, { color: theme.text }]}>
                                Buluttan indir
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {syncError && (
                    <TouchableOpacity
                        style={[styles.secondaryBtn, { borderColor: theme.border }]}
                        onPress={() => handleCopyError().catch(logCatch('general'))}
                    >
                        <Copy size={18} color={theme.text} />
                        <Text style={[styles.secondaryBtnText, { color: theme.text }]}>
                            Hata mesajını kopyala
                        </Text>
                    </TouchableOpacity>
                )}

                <Text style={[styles.hint, { color: theme.textSecondary }]}>
                    Giriş yaptığınızda veriler bir kez buluttan indirilir. Oturum
                    boyunca internet gerekmez. Değişiklikler uygulama kapanırken veya
                    «Buluta yükle» ile yedeklenir. Uygulamayı silerseniz yerel önbellek
                    sıfırlanır; tekrar girişte veriler buluttan gelir.
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 56,
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
    },
    backBtn: { padding: Spacing.xs, marginRight: Spacing.sm },
    title: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: Spacing.lg, gap: Spacing.md },
    card: {
        padding: Spacing.lg,
        borderRadius: Radius.lg,
        alignItems: 'center',
        gap: Spacing.sm,
    },
    cardTitle: { fontSize: 18, fontWeight: '600' },
    row: { fontSize: 14, alignSelf: 'stretch', textAlign: 'center' },
    errorText: { fontSize: 13, marginTop: Spacing.sm, textAlign: 'center' },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        height: 48,
        borderRadius: Radius.md,
    },
    primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        height: 44,
        borderRadius: Radius.md,
        borderWidth: 1,
    },
    secondaryBtnText: { fontSize: 15, fontWeight: '500' },
    disabled: { opacity: 0.6 },
    hint: { fontSize: 13, lineHeight: 20, marginTop: Spacing.sm },
});
