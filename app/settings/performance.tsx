import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Zap } from 'lucide-react-native';
import { useAppSettingsStore } from '../../src/store/useAppSettingsStore';
import { useAppTheme } from '../../src/theme/useAppTheme';
import { Spacing, Radius } from '../../src/theme';

export default function PerformanceSettingsScreen() {
    const router = useRouter();
    const { theme } = useAppTheme();
    const {
        syncDebounceMs,
        syncOnCellular,
        reconcileNotificationsOnRemoteSync,
        lowPowerMode,
        historyPageSize,
        setSyncDebounceMs,
        setSyncOnCellular,
        setReconcileNotificationsOnRemoteSync,
        setLowPowerMode,
        setHistoryPageSize,
    } = useAppSettingsStore();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Performans</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.section, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Senkron</Text>

                    <View style={styles.row}>
                        <View style={styles.rowText}>
                            <Text style={[styles.label, { color: theme.text }]}>
                                Mobil veri ile senkron
                            </Text>
                            <Text style={[styles.hint, { color: theme.textSecondary }]}>
                                Kapalıyken yalnızca Wi‑Fi’de yükleme yapılır
                            </Text>
                        </View>
                        <Switch
                            value={syncOnCellular}
                            onValueChange={setSyncOnCellular}
                            trackColor={{ false: theme.border, true: theme.primary }}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: theme.text }]}>
                            Senkron gecikmesi (ms)
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    color: theme.text,
                                    borderColor: theme.border,
                                    backgroundColor: theme.background,
                                },
                            ]}
                            keyboardType="number-pad"
                            value={String(syncDebounceMs)}
                            onChangeText={(t) => {
                                const n = parseInt(t, 10);
                                if (!Number.isNaN(n)) setSyncDebounceMs(n);
                            }}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={styles.rowText}>
                            <Text style={[styles.label, { color: theme.text }]}>
                                Uzak senkron sonrası bildirimleri yenile
                            </Text>
                        </View>
                        <Switch
                            value={reconcileNotificationsOnRemoteSync}
                            onValueChange={setReconcileNotificationsOnRemoteSync}
                            trackColor={{ false: theme.border, true: theme.primary }}
                        />
                    </View>
                </View>

                <View style={[styles.section, { backgroundColor: theme.surface }]}>
                    <View style={styles.sectionHeader}>
                        <Zap size={20} color={theme.secondary} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Arayüz
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.rowText}>
                            <Text style={[styles.label, { color: theme.text }]}>
                                Düşük güç modu
                            </Text>
                            <Text style={[styles.hint, { color: theme.textSecondary }]}>
                                Takvim işaretlemelerini sadeleştirir
                            </Text>
                        </View>
                        <Switch
                            value={lowPowerMode}
                            onValueChange={setLowPowerMode}
                            trackColor={{ false: theme.border, true: theme.primary }}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={[styles.label, { color: theme.text }]}>
                            Geçmiş listesi ilk yükleme
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    color: theme.text,
                                    borderColor: theme.border,
                                    backgroundColor: theme.background,
                                },
                            ]}
                            keyboardType="number-pad"
                            value={String(historyPageSize)}
                            onChangeText={(t) => {
                                const n = parseInt(t, 10);
                                if (!Number.isNaN(n)) setHistoryPageSize(n);
                            }}
                        />
                    </View>
                </View>
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
    section: {
        borderRadius: Radius.lg,
        padding: Spacing.md,
        gap: Spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    sectionTitle: { fontSize: 16, fontWeight: '600' },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.md,
    },
    rowText: { flex: 1 },
    label: { fontSize: 15, fontWeight: '500' },
    hint: { fontSize: 12, marginTop: 2 },
    field: { gap: Spacing.xs },
    input: {
        height: 44,
        borderWidth: 1,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.md,
        fontSize: 16,
    },
});
