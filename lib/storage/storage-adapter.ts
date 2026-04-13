// Storage adapter that uses Room Database on Android and AsyncStorage as fallback
import { Platform } from 'react-native';
import * as RoomStorage from './room-storage';
import * as AsyncStorageImpl from './storage';

// Determine which storage to use
const useRoom = Platform.OS === 'android' && RoomStorage.isRoomStorageAvailable();

console.log('🗄️ [Storage Adapter] Initializing...');
console.log('🗄️ [Storage Adapter] Platform:', Platform.OS);
console.log('🗄️ [Storage Adapter] Room Available:', RoomStorage.isRoomStorageAvailable());
console.log('🗄️ [Storage Adapter] Using:', useRoom ? 'Room Database' : 'AsyncStorage');

// Export unified interface
export const storage = {
  // Transactions
  async getTransactions(): Promise<AsyncStorageImpl.Transaction[]> {
    console.log('📊 [Storage Adapter] getTransactions called');
    console.log('📊 [Storage Adapter] Using Room:', useRoom);
    
    if (useRoom) {
      const transactions = await RoomStorage.getAllTransactions();
      console.log('📊 [Storage Adapter] Room transactions count:', transactions.length);
      return transactions;
    }
    const transactions = await AsyncStorageImpl.getTransactions();
    console.log('📊 [Storage Adapter] AsyncStorage transactions count:', transactions.length);
    return transactions;
  },

  async addTransaction(transaction: Omit<AsyncStorageImpl.Transaction, 'id' | 'createdAt'>) {
    console.log('💾 [Storage Adapter] addTransaction called');
    console.log('💾 [Storage Adapter] Using Room:', useRoom);
    console.log('💾 [Storage Adapter] Transaction:', transaction);
    
    if (useRoom) {
      const result = await RoomStorage.addTransaction(transaction);
      console.log('💾 [Storage Adapter] Room result:', result);
      if (!result) throw new Error('Failed to add transaction');
      return result;
    }
    return await AsyncStorageImpl.addTransaction(transaction);
  },

  async updateTransaction(id: string, updates: Partial<AsyncStorageImpl.Transaction>) {
    if (useRoom) {
      const result = await RoomStorage.updateTransaction(id, updates);
      if (!result) throw new Error('Failed to update transaction');
      return result;
    }
    return await AsyncStorageImpl.updateTransaction(id, updates);
  },

  async deleteTransaction(id: string) {
    if (useRoom) {
      await RoomStorage.deleteTransaction(id);
    } else {
      await AsyncStorageImpl.deleteTransaction(id);
    }
  },

  async getTransactionsByMonth(year: number, month: number) {
    // Get all transactions first
    const allTransactions = await this.getTransactions();
    
    // Filter by month
    return allTransactions.filter(t => {
      const date = new Date(t.date);
      const transactionYear = date.getFullYear();
      const transactionMonth = date.getMonth() + 1;
      return transactionYear === year && transactionMonth === month;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  // Categories
  async getCategories() {
    if (useRoom) {
      return await RoomStorage.getAllCategories();
    }
    return await AsyncStorageImpl.getCategories();
  },

  async getCategoryById(id: string) {
    if (useRoom) {
      return await RoomStorage.getCategoryById(id);
    }
    return await AsyncStorageImpl.getCategoryById(id);
  },

  async addCategory(category: AsyncStorageImpl.Category) {
    console.log('💾 [Storage Adapter] addCategory called');
    console.log('💾 [Storage Adapter] Using Room:', useRoom);
    
    if (useRoom) {
      const result = await RoomStorage.addCategory(category);
      if (!result) throw new Error('Failed to add category');
      return result;
    }
    return await AsyncStorageImpl.addCategory(category);
  },

  async updateCategory(id: string, updates: Partial<AsyncStorageImpl.Category>) {
    console.log('💾 [Storage Adapter] updateCategory called');
    console.log('💾 [Storage Adapter] Using Room:', useRoom);
    
    if (useRoom) {
      const result = await RoomStorage.updateCategory(id, updates);
      if (!result) throw new Error('Failed to update category');
      return result;
    }
    return await AsyncStorageImpl.updateCategory(id, updates);
  },

  async deleteCategory(id: string) {
    console.log('💾 [Storage Adapter] deleteCategory called');
    console.log('💾 [Storage Adapter] Using Room:', useRoom);
    
    if (useRoom) {
      await RoomStorage.deleteCategory(id);
    } else {
      await AsyncStorageImpl.deleteCategory(id);
    }
  },

  // Wallets
  async getWallets(): Promise<AsyncStorageImpl.Wallet[]> {
    return await AsyncStorageImpl.getWallets();
  },

  async getSelectedWalletId() {
    return await AsyncStorageImpl.getSelectedWalletId();
  },

  async setSelectedWalletId(id: string) {
    await AsyncStorageImpl.setSelectedWalletId(id);
  },

  async addWallet(wallet: AsyncStorageImpl.Wallet) {
    return await AsyncStorageImpl.addWallet(wallet);
  },

  async updateWallet(id: string, updates: Partial<AsyncStorageImpl.Wallet>) {
    return await AsyncStorageImpl.updateWallet(id, updates);
  },

  async deleteWallet(id: string) {
    await AsyncStorageImpl.deleteWallet(id);
  },

  async getWalletStats(): Promise<AsyncStorageImpl.WalletStats> {
    return await AsyncStorageImpl.getWalletStats();
  },

  async getWalletBalances(): Promise<Record<string, number>> {
    const transactions = await this.getTransactions();
    const balances: Record<string, number> = {};
    
    transactions.forEach(t => {
      const walletId = t.walletId || 'default';
      const amount = t.amount || 0;
      if (!balances[walletId]) balances[walletId] = 0;
      
      if (t.type === 'INCOME') {
        balances[walletId] += amount;
      } else {
        balances[walletId] -= amount;
      }
    });
    
    return balances;
  },

  // Stats (use unified transaction source)
  async getDashboardStats(year: number, month: number, walletId?: string) {
    // If using AsyncStorage exclusively for stats, we use the impl directly
    // which now supports filtering by walletId
    if (!useRoom) {
      return await AsyncStorageImpl.getDashboardStats(year, month, walletId);
    }

    const currentTransactions = await this.getTransactionsByMonth(year, month);
    const filteredCurrent = walletId && walletId !== 'all' 
      ? currentTransactions.filter(t => t.walletId === walletId)
      : currentTransactions;
    
    // Previous month
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevTransactions = await this.getTransactionsByMonth(prevYear, prevMonth);
    const filteredPrev = walletId && walletId !== 'all'
      ? prevTransactions.filter(t => t.walletId === walletId)
      : prevTransactions;
    
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
    
    // Calculate total balance from all transactions
    const allTransactions = await this.getTransactions();
    const totalBalance = allTransactions.reduce((sum, t) => {
      return t.type === 'INCOME' ? sum + t.amount : sum - t.amount;
    }, 0);
    
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
  },

  async getStats(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    return this.getStatsInRange(startDate, endDate);
  },

  async getStatsInRange(startDate: Date, endDate: Date) {
    const allTransactions = await this.getTransactions();
    const categories = await this.getCategories();
    
    const transactions = allTransactions.filter(t => {
      const d = new Date(t.date);
      return d >= startDate && d <= endDate;
    });
    
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
    const incomeStats: AsyncStorageImpl.CategoryStats[] = Array.from(incomeByCategory.entries()).map(([categoryId, data]) => {
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
    
    const expenseStats: AsyncStorageImpl.CategoryStats[] = Array.from(expenseByCategory.entries()).map(([categoryId, data]) => {
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
      transactionCount: transactions.length,
    };
  },

  // Subscriptions (use Room on Android, AsyncStorage as fallback)
  async getSubscriptions() {
    console.log('📊 [Storage Adapter] getSubscriptions called');
    
    if (useRoom) {
      const subscriptions = await RoomStorage.getAllSubscriptions();
      console.log('📊 [Storage Adapter] Room subscriptions count:', subscriptions.length);
      return subscriptions;
    }
    const subscriptions = await AsyncStorageImpl.getSubscriptions();
    console.log('📊 [Storage Adapter] AsyncStorage subscriptions count:', subscriptions.length);
    return subscriptions;
  },

  async addSubscription(subscription: Omit<AsyncStorageImpl.Subscription, 'id' | 'createdAt' | 'nextBillingDate' | 'isActive'>) {
    console.log('💾 [Storage Adapter] addSubscription called');
    console.log('💾 [Storage Adapter] Using Room:', useRoom);
    
    // Calculate next billing date
    const startDate = new Date(subscription.startDate);
    const nextBillingDate = AsyncStorageImpl.calculateNextBillingDate(startDate, subscription.billingCycle);
    
    const subscriptionData = {
      ...subscription,
      nextBillingDate: nextBillingDate.toISOString(),
      isActive: true,
    };
    
    let newSubscription: AsyncStorageImpl.Subscription;
    
    // Save subscription to Room or AsyncStorage
    if (useRoom) {
      const result = await RoomStorage.addSubscription(subscriptionData);
      if (!result) throw new Error('Failed to add subscription to Room');
      newSubscription = result;
      console.log('💾 [Storage Adapter] Subscription added to Room:', result.id);
    } else {
      newSubscription = {
        ...subscriptionData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      const subscriptions = await AsyncStorageImpl.getSubscriptions();
      subscriptions.push(newSubscription);
      await AsyncStorageImpl.saveSubscriptions(subscriptions);
      console.log('💾 [Storage Adapter] Subscription added to AsyncStorage:', newSubscription.id);
    }
    
    // Create transaction for subscription through adapter (so it goes to Room DB too)
    const categories = await this.getCategories();
    let subscriptionCategory = categories.find(c => c.name === 'Langganan');
    
    // If "Langganan" category doesn't exist, create it
    if (!subscriptionCategory) {
      const newCategory: AsyncStorageImpl.Category = {
        id: Date.now().toString() + '_sub',
        name: 'Langganan',
        icon: '📱',
        color: '#8b5cf6',
        type: 'EXPENSE',
      };
      
      // Add category to AsyncStorage only (categories are synced separately)
      const allCategories = await AsyncStorageImpl.getCategories();
      allCategories.push(newCategory);
      await AsyncStorageImpl.saveCategories(allCategories);
      
      subscriptionCategory = newCategory;
    }
    
    // Add transaction through adapter (this will go to Room DB on Android)
    console.log('💾 [Storage Adapter] Adding subscription transaction through adapter');
    await this.addTransaction({
      type: 'EXPENSE',
      amount: subscription.amount,
      categoryId: subscriptionCategory.id,
      walletId: (subscription as any).walletId || 'default',
      notes: `Langganan ${subscription.name}${subscription.description ? ` - ${subscription.description}` : ''}`,
      date: new Date().toISOString(),
    });
    
    return newSubscription;
  },

  async updateSubscription(id: string, updates: Partial<AsyncStorageImpl.Subscription>) {
    console.log('💾 [Storage Adapter] updateSubscription called');
    console.log('💾 [Storage Adapter] Using Room:', useRoom);
    
    if (useRoom) {
      const result = await RoomStorage.updateSubscription(id, updates);
      if (!result) throw new Error('Failed to update subscription');
      return result;
    }
    return await AsyncStorageImpl.updateSubscription(id, updates);
  },

  async deleteSubscription(id: string) {
    console.log('💾 [Storage Adapter] deleteSubscription called');
    console.log('💾 [Storage Adapter] Using Room:', useRoom);
    
    if (useRoom) {
      await RoomStorage.deleteSubscription(id);
    } else {
      await AsyncStorageImpl.deleteSubscription(id);
    }
  },

  async getSubscriptionStats() {
    return await AsyncStorageImpl.getSubscriptionStats();
  },

  // Split Bills (use Room on Android, AsyncStorage as fallback)
  async getSplitBills() {
    console.log('📊 [Storage Adapter] getSplitBills called');
    
    if (useRoom) {
      const splitBills = await RoomStorage.getAllSplitBills();
      console.log('📊 [Storage Adapter] Room split bills count:', splitBills.length);
      return splitBills;
    }
    const splitBills = await AsyncStorageImpl.getSplitBills();
    console.log('📊 [Storage Adapter] AsyncStorage split bills count:', splitBills.length);
    return splitBills;
  },

  async getSplitBillById(id: string) {
    console.log('📊 [Storage Adapter] getSplitBillById called');
    
    if (useRoom) {
      return await RoomStorage.getSplitBillById(id);
    }
    return await AsyncStorageImpl.getSplitBillById(id);
  },

  async addSplitBill(splitBill: Omit<AsyncStorageImpl.SplitBill, 'id' | 'createdAt'>) {
    console.log('💾 [Storage Adapter] addSplitBill called');
    console.log('💾 [Storage Adapter] Using Room:', useRoom);
    
    if (useRoom) {
      const result = await RoomStorage.addSplitBill(splitBill);
      if (!result) throw new Error('Failed to add split bill');
      return result;
    }
    return await AsyncStorageImpl.addSplitBill(splitBill);
  },

  async deleteSplitBill(id: string) {
    console.log('💾 [Storage Adapter] deleteSplitBill called');
    console.log('💾 [Storage Adapter] Using Room:', useRoom);
    
    if (useRoom) {
      await RoomStorage.deleteSplitBill(id);
    } else {
      await AsyncStorageImpl.deleteSplitBill(id);
    }
  },

  calculateSplitBillSummary: AsyncStorageImpl.calculateSplitBillSummary,

  // Budgets (use AsyncStorage implementation)
  async getBudgets() {
    return await AsyncStorageImpl.getBudgets();
  },

  async getBudget(categoryId: string, year: number, month: number) {
    return await AsyncStorageImpl.getBudget(categoryId, year, month);
  },

  async getBudgetsByMonth(year: number, month: number) {
    return await AsyncStorageImpl.getBudgetsByMonth(year, month);
  },

  async setBudget(categoryId: string, amount: number, year: number, month: number) {
    return await AsyncStorageImpl.setBudget(categoryId, amount, year, month);
  },

  async deleteBudget(categoryId: string, year: number, month: number) {
    return await AsyncStorageImpl.deleteBudget(categoryId, year, month);
  },

  async getBudgetSummary(year: number, month: number) {
    return await AsyncStorageImpl.getBudgetSummary(year, month);
  },

  // Utility
  async clearAllData() {
    if (useRoom) {
      // Clear Room Database (transactions, subscriptions, split bills)
      await RoomStorage.deleteAllTransactions();
      await RoomStorage.deleteAllSubscriptions();
      await RoomStorage.deleteAllSplitBills();
      // Also clear AsyncStorage for budgets, etc
      await AsyncStorageImpl.clearAllData();
    } else {
      await AsyncStorageImpl.clearAllData();
    }
  },

  async seedSampleData() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const sampleTransactions: Omit<AsyncStorageImpl.Transaction, 'id' | 'createdAt'>[] = [
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
    
    // Use storage.addTransaction to ensure it goes to Room Database
    for (const transaction of sampleTransactions) {
      await this.addTransaction(transaction);
    }
  },

  async initializeCategories() {
    await AsyncStorageImpl.initializeCategories();
  },

  // Storage info
  isUsingRoom: () => useRoom,
  getStorageType: () => useRoom ? 'Room Database' : 'AsyncStorage',

  // Currency
  getCurrency: () => AsyncStorageImpl.getCurrency(),
  setCurrency: (currency: string) => AsyncStorageImpl.setCurrency(currency),
  getCompactCurrency: () => AsyncStorageImpl.getCompactCurrency(),
  setCompactCurrency: (enabled: boolean) => AsyncStorageImpl.setCompactCurrency(enabled),
  getApiKey: () => AsyncStorageImpl.getApiKey(),
  generateApiKey: () => AsyncStorageImpl.generateApiKey(),
  getTheme: () => AsyncStorageImpl.getTheme(),
  setTheme: (theme: 'system' | 'light' | 'dark') => AsyncStorageImpl.setTheme(theme),
};

// Re-export types
export type {
  Category,
  Transaction,
  DashboardStats,
  CategoryStats,
  StatsData,
  Subscription,
  SubscriptionStats,
  Budget,
  BudgetSummary,
  SplitBill,
  SplitBillItem,
  SplitBillPerson,
  SplitBillAssignment,
  SplitBillPersonSummary,
  Wallet,
  WalletStats,
} from './storage';
