import { Share } from 'react-native';
import type { Transaction } from '../store/useFinanceStore';
import { feedback } from '../components/feedback';

function escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

export function transactionsToCsv(transactions: Transaction[]): string {
    const header = 'Tarih,Tür,Yöntem,Kategori,Tutar,Not';
    const rows = transactions.map((t) => {
        const type = t.type === 'income' ? 'Gelir' : 'Gider';
        const method = t.method === 'cash' ? 'Nakit' : 'Kart';
        return [
            escapeCsv(t.date),
            escapeCsv(type),
            escapeCsv(method),
            escapeCsv(t.category),
            String(t.amount),
            escapeCsv(t.note ?? ''),
        ].join(',');
    });
    return [header, ...rows].join('\n');
}

export async function shareTransactionsCsv(transactions: Transaction[]): Promise<void> {
    if (transactions.length === 0) {
        feedback.info('Dışa aktarılacak işlem yok.');
        return;
    }

    const csv = transactionsToCsv(transactions);
    try {
        await Share.share({
            message: csv,
            title: 'Finans işlemleri (CSV)',
        });
    } catch {
        feedback.error('Dışa aktarma iptal edildi veya başarısız.');
    }
}
