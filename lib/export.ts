import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getTransactions, type Transaction } from './storage';

export type ExportPeriod = 'all' | 'current-month' | 'last-3-months' | 'last-6-months' | 'last-year' | 'custom';

// Convert transactions to CSV format
function transactionsToCSV(transactions: Transaction[]): string {
  // CSV Header
  const header = 'Tanggal,Kategori,Tipe,Jumlah,Catatan\n';
  
  // CSV Rows
  const rows = transactions.map(t => {
    const date = new Date(t.date).toLocaleDateString('id-ID');
    const category = t.categoryName || '';
    const type = t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran';
    const amount = t.amount;
    const note = (t.note || '').replace(/,/g, ';').replace(/\n/g, ' '); // Escape commas and newlines
    
    return `${date},${category},${type},${amount},"${note}"`;
  }).join('\n');
  
  return header + rows;
}

// Filter transactions by period
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

// Generate filename based on period
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

// Export transactions to CSV file
export async function exportTransactions(
  period: ExportPeriod,
  customDate?: Date
): Promise<{ success: boolean; message: string; count: number }> {
  try {
    // Get all transactions
    const allTransactions = await getTransactions();
    
    // Filter by period
    const filteredTransactions = filterTransactionsByPeriod(allTransactions, period, customDate);
    
    if (filteredTransactions.length === 0) {
      return {
        success: false,
        message: 'Tidak ada data untuk periode yang dipilih',
        count: 0,
      };
    }
    
    // Convert to CSV
    const csvContent = transactionsToCSV(filteredTransactions);
    
    // Generate filename
    const filename = generateFilename(period, customDate);
    
    // Use new File API with Paths (Expo SDK 54+)
    const file = new File(Paths.cache, filename);
    await file.create();
    await file.write(csvContent);
    
    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return {
        success: false,
        message: 'Sharing tidak tersedia di device ini',
        count: filteredTransactions.length,
      };
    }
    
    // Share the file
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Data Transaksi',
      UTI: 'public.comma-separated-values-text',
    });
    
    return {
      success: true,
      message: `${filteredTransactions.length} transaksi berhasil diexport`,
      count: filteredTransactions.length,
    };
  } catch (error) {
    console.error('Export error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Gagal export data',
      count: 0,
    };
  }
}
