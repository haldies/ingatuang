// Local storage untuk menyimpan data transaksi
import AsyncStorage from '@react-native-async-storage/async-storage';
import { eventEmitter, EVENTS } from '@/lib/utils/events';

// Storage write lock to prevent race conditions
const writeQueue: (() => Promise<any>)[] = [];
let isWriting = false;

async function processWriteQueue() {
  if (isWriting || writeQueue.length === 0) return;
  isWriting = true;
  const next = writeQueue.shift();
  if (next) {
    try {
      await next();
    } catch (e) {
      console.error('Write queue error:', e);
    }
  }
  isWriting = false;
  processWriteQueue();
}

function queueWrite<T>(writeOp: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    writeQueue.push(async () => {
      try {
        const result = await writeOp();
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
    processWriteQueue();
  });
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'INCOME' | 'EXPENSE';
}

export interface Wallet {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  categoryId: string;
  walletId: string;
  notes?: string;
  createdAt: string;
}

const STORAGE_KEYS = {
  TRANSACTIONS: '@ingat_uang:transactions',
  CATEGORIES: '@ingat_uang:categories',
  SUBSCRIPTIONS: '@ingat_uang:subscriptions',
  SPLIT_BILLS: '@ingat_uang:split_bills',
  WALLETS: '@ingat_uang:wallets',
  SELECTED_WALLET: '@ingat_uang:selected_wallet',
  CURRENCY: '@ingat_uang:currency',
};

// Default categories
const DEFAULT_CATEGORIES: Category[] = [
  // Income - Green shades
  { id: '1', name: 'Gaji', icon: '💰', color: '#10b981', type: 'INCOME' },
  { id: '2', name: 'Bonus', icon: '🎁', color: '#059669', type: 'INCOME' },
  { id: '3', name: 'Investasi', icon: '📈', color: '#34d399', type: 'INCOME' },
  { id: '4', name: 'Lainnya', icon: '💵', color: '#6ee7b7', type: 'INCOME' },
  
  // Expense - Colorful palette
  { id: '5', name: 'Makanan', icon: '🍔', color: '#ef4444', type: 'EXPENSE' }, // Red
  { id: '6', name: 'Transport', icon: '🚗', color: '#f59e0b', type: 'EXPENSE' }, // Orange
  { id: '7', name: 'Belanja', icon: '🛒', color: '#8b5cf6', type: 'EXPENSE' }, // Purple
  { id: '8', name: 'Hiburan', icon: '🎮', color: '#ec4899', type: 'EXPENSE' }, // Pink
  { id: '9', name: 'Tagihan', icon: '📱', color: '#3b82f6', type: 'EXPENSE' }, // Blue
  { id: '10', name: 'Kesehatan', icon: '🏥', color: '#14b8a6', type: 'EXPENSE' }, // Teal
  { id: '11', name: 'Pendidikan', icon: '📚', color: '#f97316', type: 'EXPENSE' }, // Deep Orange
  { id: '13', name: 'Langganan', icon: '📱', color: '#8b5cf6', type: 'EXPENSE' }, // Purple
  { id: '12', name: 'Lainnya', icon: '💸', color: '#6366f1', type: 'EXPENSE' }, // Indigo
];

const DEFAULT_WALLETS: Wallet[] = [
  { id: 'default', name: 'Dompet Utama', icon: 'wallet', color: '#3b82f6', createdAt: new Date().toISOString() },
];

export async function initializeWallets() {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEYS.WALLETS);
    if (!existing) {
      await AsyncStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(DEFAULT_WALLETS));
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_WALLET, 'default');
    }
    
    // Migration: ensure all transactions have a walletId
    const transactionsData = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (transactionsData) {
      const transactions: Transaction[] = JSON.parse(transactionsData);
      let changed = false;
      transactions.forEach(t => {
        if (!t.walletId) {
          t.walletId = 'default';
          changed = true;
        }
      });
      if (changed) {
        await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      }
    }
  } catch (error) {
    console.error('Error initializing wallets:', error);
  }
}

// Initialize default categories and wallets
export async function initializeCategories() {
  try {
    await initializeWallets();
    const existing = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!existing) {
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    }
  } catch (error) {
    console.error('Error initializing categories:', error);
  }
}

// Wallets
export async function getWallets(): Promise<Wallet[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WALLETS);
    return data ? JSON.parse(data) : DEFAULT_WALLETS;
  } catch (error) {
    console.error('Error getting wallets:', error);
    return DEFAULT_WALLETS;
  }
}

export async function getSelectedWalletId(): Promise<string> {
  try {
    const id = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_WALLET);
    return id || 'default';
  } catch (error) {
    return 'default';
  }
}

export async function setSelectedWalletId(id: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_WALLET, id);
}

export async function addWallet(wallet: Wallet): Promise<Wallet> {
  const wallets = await getWallets();
  wallets.push(wallet);
  await AsyncStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
  return wallet;
}

export async function updateWallet(id: string, updates: Partial<Wallet>): Promise<Wallet> {
  const wallets = await getWallets();
  const index = wallets.findIndex(w => w.id === id);
  if (index === -1) throw new Error('Wallet not found');
  wallets[index] = { ...wallets[index], ...updates };
  await AsyncStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
  return wallets[index];
}

export async function deleteWallet(id: string): Promise<void> {
  if (id === 'default') throw new Error('Cannot delete default wallet');
  const wallets = await getWallets();
  const filtered = wallets.filter(w => w.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(filtered));
  
  // Update transactions: move to default wallet
  const transactions = await getTransactions();
  let changed = false;
  transactions.forEach(t => {
    if (t.walletId === id) {
      t.walletId = 'default';
      changed = true;
    }
  });
  if (changed) {
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }
  
  // If selected wallet was deleted, fallback to default
  const selectedId = await getSelectedWalletId();
  if (selectedId === id) {
    await setSelectedWalletId('default');
  }
}

// Categories
export async function getCategories(): Promise<Category[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
  } catch (error) {
    console.error('Error getting categories:', error);
    return DEFAULT_CATEGORIES;
  }
}

export async function getCategoryById(id: string): Promise<Category | undefined> {
  const categories = await getCategories();
  return categories.find(c => c.id === id);
}

export async function addCategory(category: Category): Promise<Category> {
  try {
    const categories = await getCategories();
    categories.push(category);
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    return category;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
  try {
    const categories = await getCategories();
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Category not found');
    
    categories[index] = { ...categories[index], ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    return categories[index];
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    const categories = await getCategories();
    const filtered = categories.filter(c => c.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

// Transactions
export async function getTransactions(): Promise<Transaction[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const transactions = data ? JSON.parse(data) : [];
    console.log('📊 [Storage] getTransactions called');
    console.log('📊 [Storage] Total transactions:', transactions.length);
    if (transactions.length > 0) {
      console.log('📊 [Storage] Latest transaction:', JSON.stringify(transactions[transactions.length - 1], null, 2));
    }
    return transactions;
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
}

export async function getTransactionsByMonth(year: number, month: number): Promise<Transaction[]> {
  console.log('📅 [Storage] getTransactionsByMonth called:', { year, month });
  const allTransactions = await getTransactions();
  console.log('📅 [Storage] All transactions count:', allTransactions.length);
  
  const filtered = allTransactions.filter(t => {
    const date = new Date(t.date);
    const transactionYear = date.getFullYear();
    const transactionMonth = date.getMonth() + 1;
    const matches = transactionYear === year && transactionMonth === month;
    
    if (allTransactions.length < 10) { // Only log details if not too many
      console.log('📅 [Storage] Transaction:', {
        id: t.id,
        date: t.date,
        year: transactionYear,
        month: transactionMonth,
        matches,
        amount: t.amount,
      });
    }
    
    return matches;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  console.log('📅 [Storage] Filtered transactions for', year, month, ':', filtered.length);
  return filtered;
}

export async function addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
  try {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    return await queueWrite(async () => {
      const transactions = await getTransactions();
      transactions.push(newTransaction);
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      return newTransaction;
    }) as unknown as Transaction;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
}

export async function updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
  try {
    const transactions = await getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Transaction not found');
    
    transactions[index] = { ...transactions[index], ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return transactions[index];
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    const transactions = await getTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
}

// Statistics
export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeChange: number;
  expenseChange: number;
  balanceChange: number;
  transactionCount: number;
  totalBalance: number;
}

export async function getDashboardStats(year: number, month: number, walletId?: string): Promise<DashboardStats> {
  const currentTransactions = await getTransactionsByMonth(year, month);
  
  // Previous month
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevTransactions = await getTransactionsByMonth(prevYear, prevMonth);
  
  const filteredCurrent = walletId && walletId !== 'all' 
    ? currentTransactions.filter(t => t.walletId === walletId || (walletId === 'default' && !t.walletId))
    : currentTransactions;
    
  const filteredPrev = walletId && walletId !== 'all'
    ? prevTransactions.filter(t => t.walletId === walletId || (walletId === 'default' && !t.walletId))
    : prevTransactions;
  
  // Total Balance across all time
  const allTransactions = await getTransactions();
  const filteredAll = walletId && walletId !== 'all'
    ? allTransactions.filter(t => t.walletId === walletId || (walletId === 'default' && !t.walletId))
    : allTransactions;
    
  const totalBalance = filteredAll.reduce((sum, t) => {
    return t.type === 'INCOME' ? sum + t.amount : sum - t.amount;
  }, 0);
  
  // Current month stats
  const totalIncome = filteredCurrent
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = filteredCurrent
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalIncome - totalExpense;
  
  // Previous month stats
  const prevIncome = filteredPrev
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const prevExpense = filteredPrev
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const prevBalance = prevIncome - prevExpense;
  
  // Calculate changes
  const incomeChange = prevIncome === 0 ? 0 : ((totalIncome - prevIncome) / prevIncome) * 100;
  const expenseChange = prevExpense === 0 ? 0 : ((totalExpense - prevExpense) / prevExpense) * 100;
  const balanceChange = prevBalance === 0 ? 0 : ((balance - prevBalance) / Math.abs(prevBalance)) * 100;
  
  return {
    totalIncome,
    totalExpense,
    balance,
    incomeChange,
    expenseChange,
    balanceChange,
    transactionCount: filteredCurrent.length,
    totalBalance,
  };
}

// Stats
export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  total: number;
  percentage: number;
  transactionCount: number;
}

export interface StatsData {
  totalIncome: number;
  totalExpense: number;
  incomeByCategory: CategoryStats[];
  expenseByCategory: CategoryStats[];
}

export async function getStats(year: number, month: number): Promise<StatsData> {
  const transactions = await getTransactionsByMonth(year, month);
  const categories = await getCategories();
  
  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Group by category
  const incomeByCategory: Map<string, { total: number; count: number }> = new Map();
  const expenseByCategory: Map<string, { total: number; count: number }> = new Map();
  
  transactions.forEach(t => {
    const map = t.type === 'INCOME' ? incomeByCategory : expenseByCategory;
    const current = map.get(t.categoryId) || { total: 0, count: 0 };
    map.set(t.categoryId, {
      total: current.total + t.amount,
      count: current.count + 1,
    });
  });
  
  // Convert to CategoryStats
  const incomeStats: CategoryStats[] = Array.from(incomeByCategory.entries()).map(([categoryId, data]) => {
    const category = categories.find(c => c.id === categoryId);
    return {
      categoryId,
      categoryName: category?.name || 'Unknown',
      categoryIcon: category?.icon || '❓',
      categoryColor: category?.color || '#9ca3af',
      total: data.total,
      percentage: totalIncome > 0 ? (data.total / totalIncome) * 100 : 0,
      transactionCount: data.count,
    };
  }).sort((a, b) => b.total - a.total);
  
  const expenseStats: CategoryStats[] = Array.from(expenseByCategory.entries()).map(([categoryId, data]) => {
    const category = categories.find(c => c.id === categoryId);
    return {
      categoryId,
      categoryName: category?.name || 'Unknown',
      categoryIcon: category?.icon || '❓',
      categoryColor: category?.color || '#9ca3af',
      total: data.total,
      percentage: totalExpense > 0 ? (data.total / totalExpense) * 100 : 0,
      transactionCount: data.count,
    };
  }).sort((a, b) => b.total - a.total);
  
  return {
    totalIncome,
    totalExpense,
    incomeByCategory: incomeStats,
    expenseByCategory: expenseStats,
  };
}

// Clear all data (for testing)
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([STORAGE_KEYS.TRANSACTIONS, STORAGE_KEYS.CATEGORIES]);
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}

// Seed sample data (for testing)
export async function seedSampleData(): Promise<void> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  const sampleTransactions: Omit<Transaction, 'id' | 'createdAt'>[] = [
    {
      amount: 5000000,
      type: 'INCOME',
      date: new Date(currentYear, currentMonth - 1, 1).toISOString(),
      categoryId: '1',
      walletId: 'default',
      notes: 'Gaji bulanan',
    },
    {
      amount: 50000,
      type: 'EXPENSE',
      date: new Date(currentYear, currentMonth - 1, 2).toISOString(),
      categoryId: '5',
      walletId: 'default',
      notes: 'Makan siang',
    },
    {
      amount: 100000,
      type: 'EXPENSE',
      date: new Date(currentYear, currentMonth - 1, 3).toISOString(),
      categoryId: '6',
      walletId: 'default',
      notes: 'Bensin',
    },
    {
      amount: 200000,
      type: 'EXPENSE',
      date: new Date(currentYear, currentMonth - 1, 5).toISOString(),
      categoryId: '7',
      walletId: 'default',
      notes: 'Belanja bulanan',
    },
    {
      amount: 150000,
      type: 'EXPENSE',
      date: new Date(currentYear, currentMonth - 1, 7).toISOString(),
      categoryId: '8',
      walletId: 'default',
      notes: 'Nonton bioskop',
    },
  ];
  
  for (const transaction of sampleTransactions) {
    await addTransaction(transaction);
  }
}

// Subscriptions
export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: string;
  nextBillingDate: string;
  isActive: boolean;
  description?: string;
  icon?: string;
  color?: string;
  imageUri?: string;
  iconType?: 'icon' | 'image';
  createdAt: string;
}

export interface SubscriptionStats {
  totalActive: number;
  monthlyCost: number;
  yearlyCost: number;
  upcomingRenewals: number;
}

// Get all subscriptions
export async function getSubscriptions(): Promise<Subscription[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting subscriptions:', error);
    return [];
  }
}

// Calculate next billing date
export function calculateNextBillingDate(startDate: Date, billingCycle: string): Date {
  const next = new Date(startDate);
  const today = new Date();
  
  while (next <= today) {
    switch (billingCycle) {
      case 'DAILY':
        next.setDate(next.getDate() + 1);
        break;
      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'YEARLY':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
  }
  
  return next;
}

// Add subscription
export async function addSubscription(
  subscription: Omit<Subscription, 'id' | 'createdAt' | 'nextBillingDate' | 'isActive'>
): Promise<Subscription> {
  try {
    const subscriptions = await getSubscriptions();
    const startDate = new Date(subscription.startDate);
    const nextBillingDate = calculateNextBillingDate(startDate, subscription.billingCycle);
    
    const newSubscription: Subscription = {
      ...subscription,
      id: Date.now().toString(),
      nextBillingDate: nextBillingDate.toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    subscriptions.push(newSubscription);
    await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
    
    // Create transaction for subscription (use today's date, not start date)
    const categories = await getCategories();
    let subscriptionCategory = categories.find(c => c.id === '13' || c.name === 'Langganan');
    
    // If "Langganan" category doesn't exist, create it
    if (!subscriptionCategory) {
      const newCategory: Category = {
        id: '13',
        name: 'Langganan',
        icon: '📱',
        color: '#8b5cf6',
        type: 'EXPENSE',
      };
      categories.push(newCategory);
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      subscriptionCategory = newCategory;
    }
    
    // Add transaction with today's date
    await addTransaction({
      type: 'EXPENSE',
      amount: subscription.amount,
      categoryId: subscriptionCategory.id,
      walletId: (subscription as any).walletId || 'default',
      notes: `Langganan ${subscription.name}${subscription.description ? ` - ${subscription.description}` : ''}`,
      date: new Date().toISOString(), // Use today's date instead of start date
    });
    
    return newSubscription;
  } catch (error) {
    console.error('Error adding subscription:', error);
    throw error;
  }
}

// Update subscription
export async function updateSubscription(
  id: string,
  updates: Partial<Subscription>
): Promise<Subscription> {
  try {
    const subscriptions = await getSubscriptions();
    const index = subscriptions.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Subscription not found');
    
    // Recalculate next billing date if startDate or billingCycle changed
    if (updates.startDate || updates.billingCycle) {
      const startDate = new Date(updates.startDate || subscriptions[index].startDate);
      const billingCycle = updates.billingCycle || subscriptions[index].billingCycle;
      updates.nextBillingDate = calculateNextBillingDate(startDate, billingCycle).toISOString();
    }
    
    subscriptions[index] = { ...subscriptions[index], ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
    return subscriptions[index];
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

// Delete subscription
export async function deleteSubscription(id: string): Promise<void> {
  try {
    const subscriptions = await getSubscriptions();
    const filtered = subscriptions.filter(s => s.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting subscription:', error);
    throw error;
  }
}

// Get subscription stats
export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  const subscriptions = await getSubscriptions();
  const activeSubscriptions = subscriptions.filter(s => s.isActive);
  
  // Calculate monthly cost
  let monthlyCost = 0;
  activeSubscriptions.forEach(sub => {
    switch (sub.billingCycle) {
      case 'DAILY':
        monthlyCost += sub.amount * 30;
        break;
      case 'WEEKLY':
        monthlyCost += sub.amount * 4;
        break;
      case 'MONTHLY':
        monthlyCost += sub.amount;
        break;
      case 'YEARLY':
        monthlyCost += sub.amount / 12;
        break;
    }
  });
  
  // Calculate yearly cost
  const yearlyCost = monthlyCost * 12;
  
  // Count upcoming renewals (within 7 days)
  const today = new Date();
  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  
  const upcomingRenewals = activeSubscriptions.filter(sub => {
    const nextBilling = new Date(sub.nextBillingDate);
    return nextBilling >= today && nextBilling <= sevenDaysLater;
  }).length;
  
  return {
    totalActive: activeSubscriptions.length,
    monthlyCost: Math.round(monthlyCost),
    yearlyCost: Math.round(yearlyCost),
    upcomingRenewals,
  };
}

// Budget Management
export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: number; // 1-12
  year: number;
  createdAt: string;
}

const BUDGET_KEY = '@ingat_uang:budgets';

// Get all budgets
export async function getBudgets(): Promise<Budget[]> {
  try {
    const data = await AsyncStorage.getItem(BUDGET_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting budgets:', error);
    return [];
  }
}

// Get budget for specific category and month
export async function getBudget(categoryId: string, year: number, month: number): Promise<Budget | undefined> {
  const budgets = await getBudgets();
  return budgets.find(b => b.categoryId === categoryId && b.year === year && b.month === month);
}

// Get all budgets for a specific month
export async function getBudgetsByMonth(year: number, month: number): Promise<Budget[]> {
  const budgets = await getBudgets();
  return budgets.filter(b => b.year === year && b.month === month);
}

// Set or update budget
export async function setBudget(categoryId: string, amount: number, year: number, month: number): Promise<Budget> {
  try {
    const budgets = await getBudgets();
    const existingIndex = budgets.findIndex(
      b => b.categoryId === categoryId && b.year === year && b.month === month
    );

    if (existingIndex >= 0) {
      // Update existing budget
      budgets[existingIndex].amount = amount;
      await AsyncStorage.setItem(BUDGET_KEY, JSON.stringify(budgets));
      return budgets[existingIndex];
    } else {
      // Create new budget
      const newBudget: Budget = {
        id: Date.now().toString(),
        categoryId,
        amount,
        month,
        year,
        createdAt: new Date().toISOString(),
      };
      budgets.push(newBudget);
      await AsyncStorage.setItem(BUDGET_KEY, JSON.stringify(budgets));
      return newBudget;
    }
  } catch (error) {
    console.error('Error setting budget:', error);
    throw error;
  }
}

// Delete budget
export async function deleteBudget(categoryId: string, year: number, month: number): Promise<void> {
  try {
    const budgets = await getBudgets();
    const filtered = budgets.filter(
      b => !(b.categoryId === categoryId && b.year === year && b.month === month)
    );
    await AsyncStorage.setItem(BUDGET_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting budget:', error);
    throw error;
  }
}

// Get budget summary for a month
export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentage: number;
  categories: {
    categoryId: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    budget: number;
    spent: number;
    remaining: number;
    percentage: number;
  }[];
}

export async function getBudgetSummary(year: number, month: number): Promise<BudgetSummary> {
  const budgets = await getBudgetsByMonth(year, month);
  const transactions = await getTransactionsByMonth(year, month);
  const categories = await getCategories();
  
  let totalBudget = 0;
  let totalSpent = 0;
  
  const categoryData = budgets.map(budget => {
    const category = categories.find(c => c.id === budget.categoryId);
    const spent = transactions
      .filter(t => t.type === 'EXPENSE' && t.categoryId === budget.categoryId)
      .reduce((sum, t) => sum + t.amount, 0);
    
    totalBudget += budget.amount;
    totalSpent += spent;
    
    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    
    return {
      categoryId: budget.categoryId,
      categoryName: category?.name || 'Unknown',
      categoryIcon: category?.icon || '💸',
      categoryColor: category?.color || '#6366f1',
      budget: budget.amount,
      spent,
      remaining,
      percentage,
    };
  });
  
  const remaining = totalBudget - totalSpent;
  const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  
  return {
    totalBudget,
    totalSpent,
    remaining,
    percentage,
    categories: categoryData.sort((a, b) => b.spent - a.spent),
  };
}


// ============================================
// SPLIT BILL
// ============================================

export interface SplitBillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface SplitBillPerson {
  id: string;
  name: string;
}

export interface SplitBillAssignment {
  itemId: string;
  personId: string;
}

export interface SplitBill {
  id: string;
  title: string;
  items: SplitBillItem[];
  persons: SplitBillPerson[];
  assignments: SplitBillAssignment[];
  taxPercentage: number;
  servicePercentage: number;
  subtotal: number;
  total: number;
  createdAt: string;
}

export interface SplitBillPersonSummary {
  personId: string;
  personName: string;
  items: Array<{
    itemId: string;
    itemName: string;
    itemPrice: number;
    quantity: number;
    sharedWith: number;
    share: number;
  }>;
  subtotal: number;
  tax: number;
  service: number;
  total: number;
}

// Get all split bills
export async function getSplitBills(): Promise<SplitBill[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SPLIT_BILLS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting split bills:', error);
    return [];
  }
}

// Get split bill by ID
export async function getSplitBillById(id: string): Promise<SplitBill | null> {
  try {
    const splitBills = await getSplitBills();
    return splitBills.find(sb => sb.id === id) || null;
  } catch (error) {
    console.error('Error getting split bill:', error);
    return null;
  }
}

// Add split bill
export async function addSplitBill(
  splitBill: Omit<SplitBill, 'id' | 'createdAt'>
): Promise<SplitBill> {
  try {
    const splitBills = await getSplitBills();
    
    const newSplitBill: SplitBill = {
      ...splitBill,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    splitBills.push(newSplitBill);
    await AsyncStorage.setItem(STORAGE_KEYS.SPLIT_BILLS, JSON.stringify(splitBills));
    
    return newSplitBill;
  } catch (error) {
    console.error('Error adding split bill:', error);
    throw error;
  }
}

// Delete split bill
export async function deleteSplitBill(id: string): Promise<void> {
  try {
    const splitBills = await getSplitBills();
    const filtered = splitBills.filter(sb => sb.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.SPLIT_BILLS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting split bill:', error);
    throw error;
  }
}

// Calculate split bill summary per person
export function calculateSplitBillSummary(splitBill: SplitBill): SplitBillPersonSummary[] {
  const summaries: SplitBillPersonSummary[] = [];
  
  // Calculate subtotal
  const subtotal = splitBill.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate additional charges
  const taxAmount = (subtotal * splitBill.taxPercentage) / 100;
  const serviceAmount = (subtotal * splitBill.servicePercentage) / 100;
  const totalAdditionalCharges = taxAmount + serviceAmount;
  
  splitBill.persons.forEach(person => {
    const personItems: SplitBillPersonSummary['items'] = [];
    let personSubtotal = 0;
    
    splitBill.items.forEach(item => {
      // Count how many people share this item
      const sharedWith = splitBill.assignments.filter(a => a.itemId === item.id).length;
      
      // Check if this person is assigned to this item
      const isAssigned = splitBill.assignments.some(
        a => a.itemId === item.id && a.personId === person.id
      );
      
      if (isAssigned && sharedWith > 0) {
        const itemTotal = item.price * item.quantity;
        const share = itemTotal / sharedWith;
        
        personItems.push({
          itemId: item.id,
          itemName: item.name,
          itemPrice: item.price,
          quantity: item.quantity,
          sharedWith,
          share,
        });
        
        personSubtotal += share;
      }
    });
    
    // Calculate proportional additional charges
    const proportion = subtotal > 0 ? personSubtotal / subtotal : 0;
    const personTax = taxAmount * proportion;
    const personService = serviceAmount * proportion;
    const personTotal = personSubtotal + personTax + personService;
    
    summaries.push({
      personId: person.id,
      personName: person.name,
      items: personItems,
      subtotal: personSubtotal,
      tax: personTax,
      service: personService,
      total: personTotal,
    });
  });
  
  return summaries;
}

// Helper functions for storage-adapter
export async function saveSubscriptions(subscriptions: Subscription[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
}

export async function saveCategories(categories: Category[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
}

// Currency Settings
export async function getCurrency(): Promise<string> {
  try {
    const currency = await AsyncStorage.getItem(STORAGE_KEYS.CURRENCY);
    return currency || 'IDR';
  } catch (error) {
    return 'IDR';
  }
}

export async function setCurrency(currency: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.CURRENCY, currency);
  eventEmitter.emit(EVENTS.WALLET_UPDATED); // Re-use wallet update event to refresh UI
}
