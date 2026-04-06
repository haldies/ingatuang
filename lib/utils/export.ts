import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { storage } from '../storage/storage-adapter';
import type { Transaction } from '../storage/storage-adapter';

export type ExportPeriod = 'all' | 'current-month' | 'last-3-months' | 'last-6-months' | 'last-year' | 'custom';

async function transactionsToCSV(transactions: Transaction[]): Promise<string> {

  const categories = await storage.getCategories();
  const categoryMap = new Map(categories.map(c => [c.id, c]));
  
  const header = 'Tanggal,Kategori,Tipe,Jumlah,Catatan\n';

  const rows = transactions.map(t => {
    const date = new Date(t.date).toLocaleDateString('id-ID');
    const category = categoryMap.get(t.categoryId)?.name || 'Unknown';
    const type = t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran';
    const amount = t.amount;
    const notes = (t.notes || '').replace(/,/g, ';').replace(/\n/g, ' '); // Escape commas and newlines
    
    return `${date},${category},${type},${amount},"${notes}"`;
  }).join('\n');
  
  return header + rows;
}

function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: ExportPeriod,
  customDate?: Date
): Transaction[] {
  const now = new Date();
  
  switch (period) {
    case 'all':
      return transactions;
      
    case 'current-month': {
      const year = now.getFullYear();
      const month = now.getMonth();
      return transactions.filter(t => {
        const date = new Date(t.date);
        return date.getFullYear() === year && date.getMonth() === month;
      });
    }
    
    case 'last-3-months': {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      return transactions.filter(t => {
        const date = new Date(t.date);
        return date >= threeMonthsAgo && date <= now;
      });
    }
    
    case 'last-6-months': {
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      return transactions.filter(t => {
        const date = new Date(t.date);
        return date >= sixMonthsAgo && date <= now;
      });
    }
    
    case 'last-year': {
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      return transactions.filter(t => {
        const date = new Date(t.date);
        return date >= oneYearAgo && date <= now;
      });
    }
    
    case 'custom': {
      if (!customDate) return [];
      const year = customDate.getFullYear();
      const month = customDate.getMonth();
      return transactions.filter(t => {
        const date = new Date(t.date);
        return date.getFullYear() === year && date.getMonth() === month;
      });
    }
    
    default:
      return transactions;
  }
}

function generateFilename(period: ExportPeriod, customDate?: Date): string {
  const now = new Date();
  let filename = 'transactions';
  
  if (period === 'current-month') {
    filename += `-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  } else if (period === 'custom' && customDate) {
    filename += `-${customDate.getFullYear()}-${String(customDate.getMonth() + 1).padStart(2, '0')}`;
  } else if (period !== 'all') {
    filename += `-${period}`;
  }
  
  filename += '.csv';
  return filename;
}

export async function exportTransactions(
  period: ExportPeriod,
  customDate?: Date
): Promise<{ success: boolean; message: string; count: number }> {
  try {
    console.log('📤 [Export] Starting export...', { period, customDate });
    
    const allTransactions = await storage.getTransactions();
    console.log('📤 [Export] Total transactions:', allTransactions.length);
  
    const filteredTransactions = filterTransactionsByPeriod(allTransactions, period, customDate);
    console.log('📤 [Export] Filtered transactions:', filteredTransactions.length);
    
    if (filteredTransactions.length === 0) {
      return {
        success: false,
        message: 'Tidak ada data untuk periode yang dipilih',
        count: 0,
      };
    }
    
    const csvContent = await transactionsToCSV(filteredTransactions);
    console.log('📤 [Export] CSV generated, length:', csvContent.length);
    
    const filename = generateFilename(period, customDate);
    console.log('📤 [Export] Filename:', filename);
    
    const file = new File(Paths.cache, filename);
    await file.create();
    await file.write(csvContent);
    console.log('📤 [Export] File created:', file.uri);
    
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return {
        success: false,
        message: 'Sharing tidak tersedia di device ini',
        count: filteredTransactions.length,
      };
    }

    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Data Transaksi',
      UTI: 'public.comma-separated-values-text',
    });
    
    console.log('📤 [Export] Export successful');
    return {
      success: true,
      message: `${filteredTransactions.length} transaksi berhasil diexport`,
      count: filteredTransactions.length,
    };
  } catch (error) {
    console.error('📤 [Export] Export error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal export data',
      count: 0,
    };
  }
}
