import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Wallet,
    TrendingUp,
    TrendingDown,
    CalendarRange,
    ReceiptText,
    Download,
    BarChart3,
} from 'lucide-react-native';
import { format, parseISO, startOfMonth, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import Constants from 'expo-constants';
import { useFinanceStore, Transaction } from '../../src/store/useFinanceStore';
import { Spacing, Radius } from '../../src/theme';
import { useAppTheme } from '../../src/theme/useAppTheme';

type RangeKey = 'all' | '30d' | '90d' | 'month';
type StatementRow = Transaction & { balanceAfter: number };

const rangeOptions: Array<{ key: RangeKey; label: string }> = [
    { key: 'month', label: 'Bu Ay' },
    { key: '30d', label: '30 Gün' },
    { key: '90d', label: '90 Gün' },
    { key: 'all', label: 'Tümü' },
];

const signedAmount = (item: Transaction) => (item.type === 'income' ? item.amount : -item.amount);

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getRangeStart(range: RangeKey): Date | null {
    const now = new Date();

    if (range === 'month') {
        return startOfMonth(now);
    }

    if (range === '30d') {
        return subDays(now, 30);
    }

    if (range === '90d') {
        return subDays(now, 90);
    }

    return null;
}

export default function ReportsScreen() {
    const router = useRouter();
    const { transactions } = useFinanceStore();
    const { theme } = useAppTheme();
    const [selectedRange, setSelectedRange] = useState<RangeKey>('month');
    const [isExporting, setIsExporting] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    };

    const rangeStart = useMemo(() => getRangeStart(selectedRange), [selectedRange]);
    const selectedRangeLabel = useMemo(
        () => rangeOptions.find((option) => option.key === selectedRange)?.label ?? 'Tümü',
        [selectedRange]
    );
    const periodText = useMemo(() => {
        if (!rangeStart) {
            return 'Tüm kayıtlar';
        }

        return `${format(rangeStart, 'dd.MM.yyyy')} - ${format(new Date(), 'dd.MM.yyyy')}`;
    }, [rangeStart]);

    const filteredTransactions = useMemo(() => {
        return transactions
            .filter((item) => {
                if (!rangeStart) return true;
                return parseISO(item.date) >= rangeStart;
            })
            .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    }, [transactions, rangeStart]);

    const openingBalance = useMemo(() => {
        if (!rangeStart) {
            return 0;
        }

        return transactions.reduce((acc, item) => {
            const itemDate = parseISO(item.date);
            if (itemDate < rangeStart) {
                return acc + signedAmount(item);
            }
            return acc;
        }, 0);
    }, [transactions, rangeStart]);

    const summary = useMemo(() => {
        return filteredTransactions.reduce(
            (acc, item) => {
                if (item.type === 'income') {
                    acc.income += item.amount;
                } else {
                    acc.expense += item.amount;
                }
                acc.count += 1;
                return acc;
            },
            { income: 0, expense: 0, count: 0 }
        );
    }, [filteredTransactions]);

    const net = summary.income - summary.expense;
    const closingBalance = openingBalance + net;

    const monthlyRows = useMemo(() => {
        const monthlyMap = new Map<string, { income: number; expense: number; count: number }>();

        filteredTransactions.forEach((item) => {
            const key = format(parseISO(item.date), 'yyyy-MM');
            const bucket = monthlyMap.get(key) ?? { income: 0, expense: 0, count: 0 };

            if (item.type === 'income') {
                bucket.income += item.amount;
            } else {
                bucket.expense += item.amount;
            }

            bucket.count += 1;
            monthlyMap.set(key, bucket);
        });

        return Array.from(monthlyMap.entries())
            .sort(([a], [b]) => (a < b ? 1 : -1))
            .map(([key, value]) => {
                const monthDate = parseISO(`${key}-01T00:00:00`);
                const monthLabel = format(monthDate, 'LLLL yyyy', { locale: tr });
                const monthNet = value.income - value.expense;

                return {
                    key,
                    monthLabel,
                    ...value,
                    net: monthNet,
                };
            });
    }, [filteredTransactions]);

    const statementRows = useMemo<StatementRow[]>(() => {
        const asc = [...filteredTransactions].sort(
            (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()
        );

        let runningBalance = openingBalance;

        const withBalanceAsc = asc.map((item) => {
            runningBalance += signedAmount(item);
            return {
                ...item,
                balanceAfter: runningBalance,
            };
        });

        return withBalanceAsc.reverse();
    }, [filteredTransactions, openingBalance]);

    const flowDistribution = useMemo(() => {
        const totalFlow = summary.income + summary.expense;

        if (totalFlow <= 0) {
            return {
                incomeRatio: 0,
                expenseRatio: 0,
                incomePercent: 0,
                expensePercent: 0,
            };
        }

        const incomeRatio = summary.income / totalFlow;
        const expenseRatio = summary.expense / totalFlow;

        return {
            incomeRatio,
            expenseRatio,
            incomePercent: Math.round(incomeRatio * 100),
            expensePercent: Math.round(expenseRatio * 100),
        };
    }, [summary.income, summary.expense]);

    const expenseCategoryRows = useMemo(() => {
        const categoryMap = new Map<string, number>();

        filteredTransactions.forEach((item) => {
            if (item.type !== 'expense') return;
            categoryMap.set(item.category, (categoryMap.get(item.category) ?? 0) + item.amount);
        });

        return Array.from(categoryMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([category, amount]) => ({
                category,
                amount,
                ratio: summary.expense > 0 ? amount / summary.expense : 0,
            }));
    }, [filteredTransactions, summary.expense]);

    const buildPdfHtml = () => {
        const generatedAt = format(new Date(), 'dd.MM.yyyy HH:mm');

        const monthlyTableRows =
            monthlyRows.length === 0
                ? '<tr><td colspan="5">Seçili dönem için kayıt bulunamadı.</td></tr>'
                : monthlyRows
                    .map(
                        (row) => `
                        <tr>
                            <td>${escapeHtml(row.monthLabel)}</td>
                            <td>${formatCurrency(row.income)}</td>
                            <td>${formatCurrency(row.expense)}</td>
                            <td>${formatCurrency(row.net)}</td>
                            <td>${row.count}</td>
                        </tr>`
                    )
                    .join('');

        const statementTableRows =
            statementRows.length === 0
                ? '<tr><td colspan="6">Ekstre için işlem bulunamadı.</td></tr>'
                : statementRows
                    .map((item) => {
                        const methodLabel = item.method === 'cash' ? 'Nakit' : 'Kart';
                        const incomeValue = item.type === 'income' ? formatCurrency(item.amount) : '-';
                        const expenseValue = item.type === 'expense' ? formatCurrency(item.amount) : '-';
                        const notePart = item.note ? ` - ${item.note}` : '';

                        return `
                        <tr>
                            <td>${format(parseISO(item.date), 'dd.MM.yyyy HH:mm')}</td>
                            <td>${escapeHtml(item.category + notePart)}</td>
                            <td>${methodLabel}</td>
                            <td>${incomeValue}</td>
                            <td>${expenseValue}</td>
                            <td>${formatCurrency(item.balanceAfter)}</td>
                        </tr>`;
                    })
                    .join('');

        return `
        <!doctype html>
        <html>
            <head>
                <meta charset="utf-8" />
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        color: #1f2937;
                        padding: 18px;
                    }

                    h1 {
                        margin: 0 0 6px;
                        font-size: 24px;
                    }

                    h2 {
                        margin: 28px 0 10px;
                        font-size: 16px;
                    }

                    .meta {
                        color: #4b5563;
                        font-size: 12px;
                        margin-bottom: 14px;
                    }

                    .cards {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                        margin: 12px 0 18px;
                    }

                    .card {
                        border: 1px solid #d1d5db;
                        border-radius: 8px;
                        padding: 10px;
                    }

                    .label {
                        font-size: 11px;
                        color: #6b7280;
                        text-transform: uppercase;
                        margin-bottom: 4px;
                    }

                    .value {
                        font-size: 16px;
                        font-weight: bold;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 11px;
                    }

                    th,
                    td {
                        border: 1px solid #e5e7eb;
                        padding: 6px;
                        text-align: left;
                        vertical-align: top;
                    }

                    th {
                        background: #f3f4f6;
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <h1>Finans Raporu</h1>
                <div class="meta">Dönem: ${escapeHtml(selectedRangeLabel)} | Aralık: ${escapeHtml(periodText)} | Oluşturulma: ${generatedAt}</div>

                <div class="cards">
                    <div class="card">
                        <div class="label">Açılış Bakiyesi</div>
                        <div class="value">${formatCurrency(openingBalance)}</div>
                    </div>
                    <div class="card">
                        <div class="label">Kapanış Bakiyesi</div>
                        <div class="value">${formatCurrency(closingBalance)}</div>
                    </div>
                    <div class="card">
                        <div class="label">Toplam Gelir</div>
                        <div class="value">${formatCurrency(summary.income)}</div>
                    </div>
                    <div class="card">
                        <div class="label">Toplam Gider</div>
                        <div class="value">${formatCurrency(summary.expense)}</div>
                    </div>
                </div>

                <h2>Gelir Gider Tablosu</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Dönem</th>
                            <th>Gelir</th>
                            <th>Gider</th>
                            <th>Net</th>
                            <th>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>${monthlyTableRows}</tbody>
                </table>

                <h2>Detaylı Ekstre</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Tarih</th>
                            <th>Açıklama</th>
                            <th>Yöntem</th>
                            <th>Gelir</th>
                            <th>Gider</th>
                            <th>Bakiye</th>
                        </tr>
                    </thead>
                    <tbody>${statementTableRows}</tbody>
                </table>
            </body>
        </html>`;
    };

    const handleExportPdf = async () => {
        if (statementRows.length === 0) {
            Alert.alert('Bilgi', 'PDF oluşturmak için seçili dönemde en az bir işlem olmalıdır.');
            return;
        }

        const appOwnership = Constants.appOwnership;
        const executionEnvironment = (Constants as unknown as { executionEnvironment?: string }).executionEnvironment;
        const isExpoGo = appOwnership === 'expo' || executionEnvironment === 'storeClient';

        if (isExpoGo) {
            Alert.alert(
                'PDF Kullanılamıyor',
                'Bu özellik Expo Go içinde desteklenmiyor. PDF dışa aktarma için development build veya native build kullanın.'
            );
            return;
        }

        try {
            setIsExporting(true);
            const printModule = await import('expo-print');
            const sharingModule = await import('expo-sharing');
            const printToFileAsync =
                printModule.printToFileAsync ?? printModule.default?.printToFileAsync;
            const isAvailableAsync =
                sharingModule.isAvailableAsync ?? sharingModule.default?.isAvailableAsync;
            const shareAsync = sharingModule.shareAsync ?? sharingModule.default?.shareAsync;

            if (typeof printToFileAsync !== 'function') {
                throw new Error('PRINT_UNAVAILABLE');
            }

            const html = buildPdfHtml();
            const { uri } = await printToFileAsync({ html });
            const canShare = typeof isAvailableAsync === 'function' ? await isAvailableAsync() : false;

            if (canShare && typeof shareAsync === 'function') {
                await shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Ekstre PDF paylaş',
                });
            } else {
                const message = Platform.OS === 'web'
                    ? 'PDF oluşturuldu, tarayıcı indirmeleri kontrol edebilirsiniz.'
                    : `PDF oluşturuldu: ${uri}`;
                Alert.alert('PDF Hazır', message);
            }
        } catch (error) {
            console.log('PDF export failed', error);
            const reason = error instanceof Error ? error.message : String(error);

            if (reason.includes('Cannot find native module') || reason.includes('PRINT_UNAVAILABLE')) {
                Alert.alert(
                    'PDF Kullanılamıyor',
                    'Bu cihazda PDF modülleri erişilebilir değil. Development build veya native build ile tekrar deneyin.'
                );
            } else {
                Alert.alert('Hata', 'PDF oluşturulurken bir sorun oluştu.');
            }
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Raporlarım</Text>
            </View>

            <View style={styles.rangeRow}>
                {rangeOptions.map((range) => {
                    const isActive = selectedRange === range.key;

                    return (
                        <TouchableOpacity
                            key={range.key}
                            style={[
                                styles.rangeChip,
                                {
                                    backgroundColor: isActive ? theme.primary : theme.surface,
                                    borderColor: isActive ? theme.primary : theme.border,
                                },
                            ]}
                            onPress={() => setSelectedRange(range.key)}
                        >
                            <Text style={[styles.rangeText, { color: isActive ? '#FFF' : theme.textSecondary }]}>{range.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.cardsRow}>
                <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.iconBadge, { backgroundColor: theme.primarySoft }]}>
                        <Wallet size={16} color={theme.primary} />
                    </View>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Açılış Bakiyesi</Text>
                    <Text style={[styles.statValue, { color: theme.text }]}>{formatCurrency(openingBalance)}</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.iconBadge, { backgroundColor: theme.successSoft }]}>
                        <TrendingUp size={16} color={theme.success} />
                    </View>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Toplam Gelir</Text>
                    <Text style={[styles.statValue, { color: theme.success }]}>{formatCurrency(summary.income)}</Text>
                </View>
            </View>

            <View style={styles.cardsRow}>
                <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.iconBadge, { backgroundColor: theme.dangerSoft }]}>
                        <TrendingDown size={16} color={theme.danger} />
                    </View>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Toplam Gider</Text>
                    <Text style={[styles.statValue, { color: theme.danger }]}>{formatCurrency(summary.expense)}</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.iconBadge, { backgroundColor: theme.warningSoft }]}>
                        <CalendarRange size={16} color={theme.warning} />
                    </View>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Kapanış Bakiyesi</Text>
                    <Text style={[styles.statValue, { color: closingBalance >= 0 ? theme.success : theme.danger }]}>{formatCurrency(closingBalance)}</Text>
                </View>
            </View>

            <View style={[styles.netCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.netLabel, { color: theme.textSecondary }]}>Dönem Neti</Text>
                <Text style={[styles.netValue, { color: net >= 0 ? theme.success : theme.danger }]}>{formatCurrency(net)}</Text>
                <Text style={[styles.netHint, { color: theme.textSecondary }]}>{summary.count} işlem üzerinden hesaplandı</Text>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Grafikler</Text>
                <Text style={[styles.sectionSubTitle, { color: theme.textSecondary }]}>Hızlı analiz</Text>
            </View>

            <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.chartTitleRow}>
                    <BarChart3 size={16} color={theme.primary} />
                    <Text style={[styles.chartTitle, { color: theme.text }]}>Gelir / Gider Akış Dağılımı</Text>
                </View>
                <Text style={[styles.chartHint, { color: theme.textSecondary }]}>Seçili dönemdeki toplam para hareketinin oranı</Text>

                <View style={[styles.stackedBarTrack, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    {flowDistribution.incomePercent + flowDistribution.expensePercent === 0 ? (
                        <View style={[styles.emptyStack, { backgroundColor: theme.surface }]} />
                    ) : (
                        <>
                            <View
                                style={[
                                    styles.stackedBarSegment,
                                    styles.leftSegment,
                                    {
                                        width: `${flowDistribution.incomePercent}%`,
                                        backgroundColor: theme.success,
                                    },
                                ]}
                            />
                            <View
                                style={[
                                    styles.stackedBarSegment,
                                    styles.rightSegment,
                                    {
                                        width: `${flowDistribution.expensePercent}%`,
                                        backgroundColor: theme.danger,
                                    },
                                ]}
                            />
                        </>
                    )}
                </View>

                <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
                        <Text style={[styles.legendText, { color: theme.textSecondary }]}>Gelir %{flowDistribution.incomePercent}</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: theme.danger }]} />
                        <Text style={[styles.legendText, { color: theme.textSecondary }]}>Gider %{flowDistribution.expensePercent}</Text>
                    </View>
                </View>
            </View>

            <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.chartTitleRow}>
                    <BarChart3 size={16} color={theme.primary} />
                    <Text style={[styles.chartTitle, { color: theme.text }]}>Gider Kategori Dağılımı</Text>
                </View>
                <Text style={[styles.chartHint, { color: theme.textSecondary }]}>En yüksek 6 gider kategorisi</Text>

                {expenseCategoryRows.length === 0 ? (
                    <Text style={[styles.emptyChartText, { color: theme.textSecondary }]}>Grafik için seçili dönemde gider kaydı bulunamadı.</Text>
                ) : (
                    expenseCategoryRows.map((row) => (
                        <View key={row.category} style={styles.categoryChartRow}>
                            <View style={styles.categoryChartTop}>
                                <Text style={[styles.categoryName, { color: theme.text }]}>{row.category}</Text>
                                <Text style={[styles.categoryAmount, { color: theme.textSecondary }]}>{formatCurrency(row.amount)}</Text>
                            </View>
                            <View style={[styles.progressTrack, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        {
                                            width: `${Math.max(3, Math.round(row.ratio * 100))}%`,
                                            backgroundColor: theme.primary,
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={[styles.categoryRatio, { color: theme.textSecondary }]}>%{Math.round(row.ratio * 100)}</Text>
                        </View>
                    ))
                )}
            </View>

            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Gelir Gider Tablosu</Text>
                <Text style={[styles.sectionSubTitle, { color: theme.textSecondary }]}>Aylık özet</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tableWrap, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                <View>
                    <View style={[styles.tableHeader, { borderBottomColor: theme.border, backgroundColor: theme.background }]}> 
                        <Text style={[styles.cell, styles.monthCell, { color: theme.textSecondary }]}>Dönem</Text>
                        <Text style={[styles.cell, styles.moneyCell, { color: theme.textSecondary }]}>Gelir</Text>
                        <Text style={[styles.cell, styles.moneyCell, { color: theme.textSecondary }]}>Gider</Text>
                        <Text style={[styles.cell, styles.moneyCell, { color: theme.textSecondary }]}>Net</Text>
                        <Text style={[styles.cell, styles.countCell, { color: theme.textSecondary }]}>İşlem</Text>
                    </View>

                    {monthlyRows.length === 0 ? (
                        <View style={styles.emptyTable}>
                            <Text style={{ color: theme.textSecondary }}>Seçili dönem için kayıt bulunamadı.</Text>
                        </View>
                    ) : (
                        monthlyRows.map((row) => (
                            <View key={row.key} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                                <Text style={[styles.cell, styles.monthCell, { color: theme.text }]}>{row.monthLabel}</Text>
                                <Text style={[styles.cell, styles.moneyCell, { color: theme.success }]}>{formatCurrency(row.income)}</Text>
                                <Text style={[styles.cell, styles.moneyCell, { color: theme.danger }]}>{formatCurrency(row.expense)}</Text>
                                <Text style={[styles.cell, styles.moneyCell, { color: row.net >= 0 ? theme.success : theme.danger }]}>{formatCurrency(row.net)}</Text>
                                <Text style={[styles.cell, styles.countCell, { color: theme.text }]}>{row.count}</Text>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Detaylı Ekstre</Text>
                <View style={styles.sectionActions}>
                    <View style={styles.sectionTag}>
                        <ReceiptText size={14} color={theme.primary} />
                        <Text style={[styles.sectionSubTitle, { color: theme.textSecondary }]}>Tarih bazlı hareketler</Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.exportButton,
                            {
                                backgroundColor: isExporting ? theme.border : theme.primary,
                            },
                        ]}
                        onPress={handleExportPdf}
                        disabled={isExporting}
                    >
                        <Download size={14} color="#FFF" />
                        <Text style={styles.exportButtonText}>{isExporting ? 'Hazırlanıyor' : 'PDF'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tableWrap, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                <View>
                    <View style={[styles.tableHeader, { borderBottomColor: theme.border, backgroundColor: theme.background }]}> 
                        <Text style={[styles.cell, styles.dateCell, { color: theme.textSecondary }]}>Tarih</Text>
                        <Text style={[styles.cell, styles.descCell, { color: theme.textSecondary }]}>Açıklama</Text>
                        <Text style={[styles.cell, styles.methodCell, { color: theme.textSecondary }]}>Yöntem</Text>
                        <Text style={[styles.cell, styles.moneyCell, { color: theme.textSecondary }]}>Gelir</Text>
                        <Text style={[styles.cell, styles.moneyCell, { color: theme.textSecondary }]}>Gider</Text>
                        <Text style={[styles.cell, styles.moneyCell, { color: theme.textSecondary }]}>Bakiye</Text>
                    </View>

                    {statementRows.length === 0 ? (
                        <View style={styles.emptyTable}>
                            <Text style={{ color: theme.textSecondary }}>Ekstre için işlem bulunamadı.</Text>
                        </View>
                    ) : (
                        statementRows.map((item) => {
                            const methodLabel = item.method === 'cash' ? 'Nakit' : 'Kart';
                            const incomeValue = item.type === 'income' ? formatCurrency(item.amount) : '-';
                            const expenseValue = item.type === 'expense' ? formatCurrency(item.amount) : '-';
                            const notePart = item.note ? ` - ${item.note}` : '';

                            return (
                                <View key={item.id} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                                    <Text style={[styles.cell, styles.dateCell, { color: theme.text }]}>
                                        {format(parseISO(item.date), 'dd.MM.yyyy HH:mm')}
                                    </Text>
                                    <Text style={[styles.cell, styles.descCell, { color: theme.text }]} numberOfLines={1}>
                                        {item.category}{notePart}
                                    </Text>
                                    <Text style={[styles.cell, styles.methodCell, { color: theme.textSecondary }]}>{methodLabel}</Text>
                                    <Text style={[styles.cell, styles.moneyCell, { color: item.type === 'income' ? theme.success : theme.textSecondary }]}>{incomeValue}</Text>
                                    <Text style={[styles.cell, styles.moneyCell, { color: item.type === 'expense' ? theme.danger : theme.textSecondary }]}>{expenseValue}</Text>
                                    <Text style={[styles.cell, styles.moneyCell, { color: item.balanceAfter >= 0 ? theme.success : theme.danger }]}>{formatCurrency(item.balanceAfter)}</Text>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingBottom: Spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 1,
    },
    backBtn: {
        marginRight: Spacing.md,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    rangeRow: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    rangeChip: {
        borderWidth: 1,
        borderRadius: Radius.full,
        paddingHorizontal: Spacing.md,
        height: 34,
        justifyContent: 'center',
    },
    rangeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    cardsRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        paddingHorizontal: Spacing.lg,
        marginTop: Spacing.md,
    },
    statCard: {
        flex: 1,
        borderWidth: 1,
        borderRadius: Radius.lg,
        padding: Spacing.md,
    },
    iconBadge: {
        width: 28,
        height: 28,
        borderRadius: Radius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    statLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    netCard: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        borderWidth: 1,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        alignItems: 'center',
    },
    netLabel: {
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    netValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: 4,
    },
    netHint: {
        fontSize: 12,
    },
    sectionHeader: {
        paddingHorizontal: Spacing.lg,
        marginTop: Spacing.xl,
        marginBottom: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionSubTitle: {
        fontSize: 12,
        fontWeight: '600',
    },
    sectionTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    sectionActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    exportButton: {
        height: 30,
        paddingHorizontal: Spacing.sm,
        borderRadius: Radius.full,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    exportButtonText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '700',
    },
    chartCard: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.sm,
        borderWidth: 1,
        borderRadius: Radius.lg,
        padding: Spacing.md,
    },
    chartTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    chartTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    chartHint: {
        fontSize: 12,
        marginBottom: Spacing.sm,
    },
    stackedBarTrack: {
        height: 16,
        borderRadius: Radius.full,
        borderWidth: 1,
        overflow: 'hidden',
        flexDirection: 'row',
    },
    stackedBarSegment: {
        height: '100%',
    },
    leftSegment: {
        borderTopLeftRadius: Radius.full,
        borderBottomLeftRadius: Radius.full,
    },
    rightSegment: {
        borderTopRightRadius: Radius.full,
        borderBottomRightRadius: Radius.full,
    },
    emptyStack: {
        width: '100%',
        height: '100%',
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Spacing.sm,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: Radius.full,
    },
    legendText: {
        fontSize: 12,
        fontWeight: '600',
    },
    emptyChartText: {
        fontSize: 12,
    },
    categoryChartRow: {
        marginTop: Spacing.sm,
    },
    categoryChartTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    categoryName: {
        fontSize: 12,
        fontWeight: '600',
    },
    categoryAmount: {
        fontSize: 12,
    },
    progressTrack: {
        height: 10,
        borderRadius: Radius.full,
        borderWidth: 1,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: Radius.full,
    },
    categoryRatio: {
        fontSize: 11,
        textAlign: 'right',
        marginTop: 2,
    },
    tableWrap: {
        marginHorizontal: Spacing.lg,
        borderWidth: 1,
        borderRadius: Radius.lg,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    cell: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.sm,
        fontSize: 12,
    },
    monthCell: {
        width: 140,
    },
    dateCell: {
        width: 128,
    },
    descCell: {
        width: 220,
    },
    methodCell: {
        width: 84,
    },
    moneyCell: {
        width: 120,
    },
    countCell: {
        width: 70,
    },
    emptyTable: {
        padding: Spacing.lg,
        alignItems: 'center',
    },
});
