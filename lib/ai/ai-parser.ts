// Simple AI-like parser for transaction text
export interface ParsedTransaction {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  categoryId: string;
  notes: string;
}

// Keywords untuk detect income
const incomeKeywords = [
  'gaji', 'terima', 'dapat', 'bonus', 'transfer masuk', 'pendapatan',
  'salary', 'income', 'receive', 'paid', 'earning'
];

// Keywords untuk detect expense categories
const categoryKeywords: Record<string, string[]> = {
  'makanan': ['makan', 'minum', 'kopi', 'cafe', 'restoran', 'warteg', 'food', 'coffee', 'lunch', 'dinner', 'breakfast', 'sarapan', 'nasi', 'ayam', 'soto', 'bakso'],
  'transport': ['transport', 'bensin', 'parkir', 'tol', 'ojek', 'grab', 'gojek', 'taxi', 'fuel', 'parking', 'motor', 'mobil'],
  'belanja': ['beli', 'belanja', 'shopping', 'shop', 'buy', 'purchase', 'toko', 'mall', 'baju', 'sepatu', 'celana'],
  'tagihan': ['bayar', 'tagihan', 'listrik', 'air', 'internet', 'wifi', 'bill', 'payment', 'subscription', 'pulsa', 'token'],
  'hiburan': ['nonton', 'film', 'game', 'hiburan', 'movie', 'entertainment', 'concert', 'spotify', 'netflix', 'youtube', 'main'],
  'kesehatan': ['dokter', 'obat', 'rumah sakit', 'apotek', 'health', 'medical', 'doctor', 'medicine', 'vitamin', 'checkup'],
  'pendidikan': ['sekolah', 'kuliah', 'kursus', 'buku', 'education', 'course', 'training', 'les', 'belajar'],
  'gaji': ['gaji', 'salary', 'income', 'pendapatan'],
  'bonus': ['bonus', 'thr', 'reward', 'hadiah'],
  'investasi': ['investasi', 'saham', 'reksadana', 'crypto', 'investment', 'dividen'],
};

// Extract number from text
function extractAmount(text: string): number {
  // Remove common words
  const cleanText = text.toLowerCase()
    .replace(/ribu|rb|k/gi, '000')
    .replace(/juta|jt|m/gi, '000000')
    .replace(/rp\.?|idr/gi, '');

  // Find numbers
  const numbers = cleanText.match(/\d+\.?\d*/g);
  
  if (numbers && numbers.length > 0) {
    // Get the largest number (usually the amount)
    const amounts = numbers.map(n => parseFloat(n.replace(/\./g, '')));
    return Math.max(...amounts);
  }

  return 0;
}

// Detect transaction type
function detectType(text: string): 'INCOME' | 'EXPENSE' {
  const lowerText = text.toLowerCase();
  
  // Check for income keywords
  for (const keyword of incomeKeywords) {
    if (lowerText.includes(keyword)) {
      return 'INCOME';
    }
  }
  
  // Default to expense
  return 'EXPENSE';
}

// Detect category
function detectCategory(text: string, type: 'INCOME' | 'EXPENSE'): string {
  const lowerText = text.toLowerCase();
  
  if (type === 'INCOME') {
    // Check for specific income categories
    if (lowerText.includes('bonus') || lowerText.includes('thr')) return 'bonus';
    if (lowerText.includes('investasi') || lowerText.includes('saham') || lowerText.includes('dividen')) return 'investasi';
    return 'gaji'; // Default income category
  }
  
  // Check each category
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return category;
      }
    }
  }
  
  // Default to lainnya
  return 'lainnya';
}

// Main parser function
export function parseTransactionText(text: string): ParsedTransaction | null {
  if (!text.trim()) {
    return null;
  }

  const amount = extractAmount(text);
  
  if (amount === 0) {
    return null;
  }

  const type = detectType(text);
  const categoryId = detectCategory(text, type);

  return {
    amount,
    type,
    categoryId,
    notes: text.trim(),
  };
}

// Format examples for UI
export const quickAddExamples = [
  'Beli kopi 25 ribu',
  'Makan siang 50rb di restoran'
];
