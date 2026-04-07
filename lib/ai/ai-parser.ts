// Simple AI-like parser for transaction text - Ported from Native Android Logic
export interface ParsedTransaction {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  categoryId: string;
  notes: string;
}

// Keywords untuk detect income
const incomeKeywords = [
  'gaji', 'terima', 'dapat', 'bonus', 'transfer masuk', 'pendapatan',
  'salary', 'income', 'receive', 'paid', 'earning', 'masuk'
];

interface CategoryRule {
  categoryId: string;
  keywords: string[];
  priority: number;
}

const incomeRules: CategoryRule[] = [
  { categoryId: '1', priority: 100, keywords: ['gaji', 'salary'] },
  { categoryId: '2', priority: 100, keywords: ['bonus', 'thr', 'hadiah', 'reward'] },
  { categoryId: '3', priority: 100, keywords: ['investasi', 'saham', 'dividen', 'crypto'] },
  { categoryId: '4', priority: 50, keywords: ['freelance', 'project', 'sampingan'] }
];

const expenseRules: CategoryRule[] = [
  { categoryId: '9', priority: 100, keywords: ['tagihan', 'listrik', 'pulsa', 'wifi', 'internet', 'air', 'pdam', 'subscription', 'netflix', 'spotify'] },
  { categoryId: '10', priority: 100, keywords: ['kesehatan', 'dokter', 'obat', 'apotek', 'rumah sakit', 'medical', 'vitamin'] },
  { categoryId: '11', priority: 100, keywords: ['pendidikan', 'sekolah', 'kuliah', 'kursus', 'buku', 'les'] },
  { categoryId: '5', priority: 90, keywords: ['makan', 'food', 'resto', 'warteg', 'kopi', 'cafe', 'lunch', 'dinner', 'breakfast', 'nasi', 'ayam', 'bakso', 'soto'] },
  { categoryId: '6', priority: 80, keywords: ['transport', 'bensin', 'grab', 'gojek', 'taxi', 'parkir', 'tol', 'fuel'] },
  { categoryId: '8', priority: 70, keywords: ['hiburan', 'nonton', 'game', 'movie', 'bioskop', 'entertainment', 'main'] },
  { categoryId: '7', priority: 50, keywords: ['belanja', 'beli', 'shopping', 'shopee', 'tokopedia', 'mall', 'baju', 'sepatu'] }
];

// Extract number from text - Ported from Java Implementation
function extractAmount(text: string): number {
  const lowerText = text.toLowerCase().trim();
  
  // Regex pattern derived from TransactionParser.java
  // Replaced simplified version with robust one: (?:rp\s*)?([\d]+(?:[.,][\d]+)?)\s*(ribu|rb|k|juta|jt|m|ratus)?
  const regex = /(?:rp\s*)?([\d]+(?:[.,][\d]+)?)\s*(ribu|rb|k|juta|jt|m|ratus)?/gi;
  let match;
  let maxAmount = 0;
  let foundWithUnit = false;

  while ((match = regex.exec(lowerText)) !== null) {
    let numberStr = match[1].replace(/,/g, '.');
    const unit = match[2];
    
    // In case of dot thousands separator (ID style: 25.000), fix it
    if (numberStr.includes('.') && numberStr.split('.').pop()?.length === 3) {
      numberStr = numberStr.replace(/\./g, '');
    }

    let number = parseFloat(numberStr);
    if (isNaN(number)) continue;

    // Apply multiplier
    if (unit) {
      const u = unit.toLowerCase();
      if (['ribu', 'rb', 'k'].includes(u)) number *= 1000;
      else if (['juta', 'jt', 'm'].includes(u)) number *= 1000000;
      else if (u === 'ratus') number *= 100;
    }

    // Priority logic from Native
    if (unit) {
      if (!foundWithUnit || number > maxAmount) {
        maxAmount = number;
        foundWithUnit = true;
      }
    } else if (number >= 1000) {
      if (!foundWithUnit && number > maxAmount) {
        maxAmount = number;
      }
    } else if (maxAmount === 0 && !foundWithUnit) {
      maxAmount = number;
    }
  }

  return maxAmount;
}

// Detect transaction type
function detectType(text: string): 'INCOME' | 'EXPENSE' {
  const lowerText = text.toLowerCase();
  for (const keyword of incomeKeywords) {
    if (lowerText.includes(keyword)) return 'INCOME';
  }
  return 'EXPENSE';
}

// Detect category with confidence matching
function detectCategory(text: string, type: 'INCOME' | 'EXPENSE'): string {
  const lowerText = text.toLowerCase();
  const rules = type === 'INCOME' ? incomeRules : expenseRules;
  
  let bestCategoryId = type === 'INCOME' ? '4' : '12'; // Defaults
  let highestConfidence = 0;

  // Sort rules by priority
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    let matchCount = 0;
    for (const kw of rule.keywords) {
      if (lowerText.includes(kw)) matchCount++;
    }

    if (matchCount > 0) {
      // Logic from Java: (priority * matches) / 2
      const confidence = (rule.priority * matchCount) / 2;
      if (confidence > highestConfidence) {
        highestConfidence = confidence;
        bestCategoryId = rule.categoryId;
      }
      
      // Stop early if high confidence match found
      if (confidence >= 80 && rule.priority >= 90) break;
    }
  }

  return bestCategoryId;
}

// Clean text to extract description (Notes) - Ported from Java
function extractNotes(text: string): string {
  let cleaned = text;
  
  // Remove amount with units
  cleaned = cleaned.replace(/\b\d+[.,]?\d*\s*(ribu|rb|k|juta|jt|m|ratus)\b/gi, '');
  
  // Remove large numbers
  cleaned = cleaned.replace(/\b\d{4,}[.,]?\d*\b/g, '');
  
  // Remove common action words
  cleaned = cleaned.replace(/\b(beli|bayar|untuk|ke|di|dari|terima|dapat|rp|idr)\b/gi, '');
  
  // Clean up extra spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  if (!cleaned) return 'Transaksi';
  
  // Capitalize
  return cleaned.charAt(0) ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : 'Transaksi';
}

// Main parser function
export function parseTransactionText(text: string): ParsedTransaction | null {
  if (!text.trim()) return null;

  const amount = extractAmount(text);
  if (amount === 0) return null;

  const type = detectType(text);
  const categoryId = detectCategory(text, type);
  const notes = extractNotes(text);

  return {
    amount,
    type,
    categoryId,
    notes,
  };
}

export const quickAddExamples = [
  'Beli kopi 25 ribu',
  'Gaji masuk 5 juta',
  'Makan siang 50rb di restoran'
];
