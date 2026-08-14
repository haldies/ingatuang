/**
 * Sync Service — Orchestrates bidirectional sync between local storage and server.
 *
 * Sync Flow:
 *  1. PUSH Wallets    (lokal → server, wallets harus ada sebelum transactions)
 *  2. PUSH Transactions (lokal → server, dengan walletId)
 *  3. PUSH Subscriptions (lokal → server)
 *  4. PULL Categories  (server → lokal)
 *  5. PULL Wallets     (server → lokal)
 *  6. PULL Transactions (server → lokal, dengan walletId)
 *  7. Save sync timestamp
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '@/lib/storage/storage-adapter';
import { apiClient, RemoteTransaction, RemoteCategory, RemoteWallet, RemoteBudget } from '@/lib/api/api-client';

const LAST_SYNC_KEY = 'ingat_uang_last_sync_at';
type CategoryType = 'INCOME' | 'EXPENSE';
type LocalCategoryLike = { id: string; name: string; type: CategoryType };

const CATEGORY_ALIASES: Record<string, string> = {
  'makanan & minuman': 'makanan',
  transportasi: 'transport',
  'pemasukan lainnya': 'lainnya',
  'pengeluaran lainnya': 'lainnya',
};

function normalizeCategoryKey(name: string | undefined, type: CategoryType): string {
  const key = name?.trim().toLowerCase() ?? '';
  if (key === 'lainnya') return `${type}:lainnya`;
  return `${type}:${CATEGORY_ALIASES[key] ?? key}`;
}

function toMobileCategoryName(name: string, type: CategoryType): string {
  const key = name.trim().toLowerCase();
  if (key === 'makanan & minuman') return 'Makanan';
  if (key === 'transportasi') return 'Transport';
  if (key === 'pemasukan lainnya' || key === 'pengeluaran lainnya') return 'Lainnya';
  return name;
}

function findMatchingCategory(
  categories: LocalCategoryLike[],
  id: string | undefined,
  name: string | undefined,
  type: CategoryType
): LocalCategoryLike | undefined {
  const remoteKey = normalizeCategoryKey(name, type);
  return categories.find(
    (category) =>
      category.id === id ||
      normalizeCategoryKey(category.name, category.type) === remoteKey
  );
}

export interface SyncSummary {
  walletsPushed: number;
  walletsPulled: number;
  transactionsPushed: number;
  transactionsPulled: number;
  subscriptionsPushed: number;
  subscriptionsPulled: number;
  budgetsPushed: number;
  budgetsPulled: number;
  categoriesPulled: number;
  syncedAt: string;
  errors: string[];
}

/**
 * Get the timestamp of the last successful sync
 */
export async function getLastSyncAt(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

/**
 * Save the sync timestamp
 */
async function saveLastSyncAt(isoDate: string): Promise<void> {
  await AsyncStorage.setItem(LAST_SYNC_KEY, isoDate);
}

/**
 * Lightweight pull-only sync — hanya download transaksi baru dari server sejak last sync.
 * Digunakan untuk auto-refresh saat app dibuka kembali (AppState active).
 * TIDAK melakukan push, jadi cepat.
 *
 * @param token - JWT token dari login
 * @returns jumlah transaksi baru yang ditarik dari server (0 jika tidak ada)
 */
export async function pullFromServer(token: string): Promise<number> {
  try {
    const lastSync = await getLastSyncAt();

    // Pull transaksi baru dari server sejak last sync
    const remoteTransactions: RemoteTransaction[] = await apiClient.fetchTransactions(
      token,
      lastSync ?? undefined
    );

    if (remoteTransactions.length === 0) return 0;

    // Ambil data lokal sekali saja (lebih efisien)
    const [localTxs, localCategories] = await Promise.all([
      storage.getTransactions(),
      storage.getCategories(),
    ]);

    const localIds = new Set(localTxs.map((t) => t.id));
    let newCount = 0;

    for (const remTx of remoteTransactions) {
      // Skip jika sudah ada lokal
      if (localIds.has(remTx.id)) continue;

      // Resolve category
      let categoryId = remTx.categoryId;
      const localCat = findMatchingCategory(
        localCategories,
        remTx.categoryId,
        remTx.categoryName,
        remTx.type
      );

      if (!localCat && remTx.categoryName) {
        // Buat kategori baru jika belum ada
        try {
          await storage.addCategory({
            id: remTx.categoryId,
            name: toMobileCategoryName(remTx.categoryName, remTx.type),
            type: remTx.type,
            icon: remTx.categoryIcon || '💰',
            color: remTx.categoryColor || '#9ca3af',
          });
        } catch {
          // Ignore jika duplikat
        }
      } else if (localCat) {
        categoryId = localCat.id;
      }

      try {
        await storage.addTransaction({
          id: remTx.id,
          amount: remTx.amount,
          type: remTx.type as 'INCOME' | 'EXPENSE',
          date: remTx.date,
          notes: remTx.notes,
          categoryId,
          walletId: remTx.walletId || 'default',
          createdAt: remTx.createdAt,
        });
        newCount++;
      } catch {
        // Ignore jika gagal insert satu transaksi
      }
    }

    // Update timestamp hanya jika ada data baru
    if (newCount > 0) {
      await saveLastSyncAt(new Date().toISOString());
    }

    return newCount;
  } catch (error) {
    console.warn('⚠️ [SyncService] pullFromServer failed silently:', error instanceof Error ? error.message : error);
    return 0;
  }
}

/**
 * Main sync function — requires a valid JWT token obtained from login.
 *
 * @param token - JWT token from login (stored as the "API key" in secureStorage)
 * @returns SyncSummary with counts and any errors
 */
export async function syncAll(token: string): Promise<SyncSummary> {
  const errors: string[] = [];
  const summary: SyncSummary = {
    walletsPushed: 0,
    walletsPulled: 0,
    transactionsPushed: 0,
    transactionsPulled: 0,
    subscriptionsPushed: 0,
    subscriptionsPulled: 0,
    budgetsPushed: 0,
    budgetsPulled: 0,
    categoriesPulled: 0,
    syncedAt: new Date().toISOString(),
    errors,
  };

  // ── 1. PUSH Wallets ──────────────────────────────────────────────────────────
  // Wallets harus di-sync SEBELUM transactions agar walletId valid di server
  try {
    const localWallets = await storage.getWallets();

    if (localWallets.length > 0) {
      const toSync = localWallets.map((w) => ({
        id: w.id,
        name: w.name,
        icon: w.icon,
        color: w.color,
      }));

      const result = await apiClient.syncWallets(token, toSync);
      summary.walletsPushed = result.created + result.updated;
      if (result.errors?.length) errors.push(...result.errors);
      console.log(`✅ [SyncService] Pushed wallets: +${result.created} updated:${result.updated}`);
    }
  } catch (e) {
    const msg = `Push wallets failed: ${e instanceof Error ? e.message : String(e)}`;
    errors.push(msg);
    console.error('❌ [SyncService]', msg);
  }

  // ── 2. PUSH Transactions ─────────────────────────────────────────────────────
  try {
    const localTransactions = await storage.getTransactions();
    const categories = await storage.getCategories();

    if (localTransactions.length > 0) {
      const toSync = localTransactions.map((t) => {
        const cat = categories.find((c) => c.id === t.categoryId);
        return {
          id: t.id,
          amount: t.amount,
          type: t.type as 'INCOME' | 'EXPENSE',
          date: t.date,
          notes: t.notes ?? '',
          categoryId: t.categoryId,
          categoryName: cat?.name,
          walletId: t.walletId || 'default',
        };
      });

      const result = await apiClient.syncTransactions(token, toSync);
      summary.transactionsPushed = result.created + result.updated;
      if (result.errors?.length) errors.push(...result.errors);
      console.log(`✅ [SyncService] Pushed transactions: +${result.created} updated:${result.updated} skipped:${result.skipped}`);
    }
  } catch (e) {
    const msg = `Push transactions failed: ${e instanceof Error ? e.message : String(e)}`;
    errors.push(msg);
    console.error('❌ [SyncService]', msg);
  }

  // ── 3. PUSH Subscriptions ────────────────────────────────────────────────────
  try {
    const localSubs = await storage.getSubscriptions();

    if (localSubs.length > 0) {
      const toSync = localSubs.map((s) => ({
        id: s.id,
        name: s.name,
        amount: s.amount,
        billingCycle: s.billingCycle as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
        startDate: s.startDate,
        nextBillingDate: s.nextBillingDate,
        isActive: s.isActive,
        description: s.description ?? '',
        icon: s.icon ?? '',
        color: s.color ?? '',
      }));

      const result = await apiClient.syncSubscriptions(token, toSync);
      summary.subscriptionsPushed = result.created + result.updated;
      if (result.errors?.length) errors.push(...result.errors);
      console.log(`✅ [SyncService] Pushed subscriptions: +${result.created} updated:${result.updated}`);
    }
  } catch (e) {
    const msg = `Push subscriptions failed: ${e instanceof Error ? e.message : String(e)}`;
    errors.push(msg);
    console.error('❌ [SyncService]', msg);
  }

  // ── 4. PULL Categories ───────────────────────────────────────────────────────
  try {
    const [localBudgets, categories] = await Promise.all([
      storage.getBudgets(),
      storage.getCategories(),
    ]);

    if (localBudgets.length > 0) {
      const toSync = localBudgets.map((budget) => {
        const category = categories.find((c) => c.id === budget.categoryId);
        return {
          id: budget.id,
          categoryId: budget.categoryId,
          categoryName: category?.name,
          amount: budget.amount,
          month: budget.month,
          year: budget.year,
        };
      });

      const result = await apiClient.syncBudgets(token, toSync);
      summary.budgetsPushed = result.created + result.updated;
      if (result.errors?.length) errors.push(...result.errors);
      console.log(`âœ… [SyncService] Pushed budgets: +${result.created} updated:${result.updated}`);
    }
  } catch (e) {
    const msg = `Push budgets failed: ${e instanceof Error ? e.message : String(e)}`;
    errors.push(msg);
    console.error('âŒ [SyncService]', msg);
  }

  try {
    const remoteCategories: RemoteCategory[] = await apiClient.fetchCategories(token);
    const localCategories = await storage.getCategories();

    for (const remCat of remoteCategories) {
      const localMatch = findMatchingCategory(
        localCategories,
        remCat.id,
        remCat.name,
        remCat.type
      );

      if (!localMatch) {
        await storage.addCategory({
          id: remCat.id,
          name: toMobileCategoryName(remCat.name, remCat.type),
          type: remCat.type,
          icon: remCat.icon,
          color: remCat.color,
        });
        summary.categoriesPulled++;
      }
    }
    console.log(`✅ [SyncService] Pulled ${summary.categoriesPulled} new categories`);
  } catch (e) {
    const msg = `Pull categories failed: ${e instanceof Error ? e.message : String(e)}`;
    errors.push(msg);
    console.error('❌ [SyncService]', msg);
  }

  // ── 5. PULL Wallets ──────────────────────────────────────────────────────────
  try {
    const remoteWallets: RemoteWallet[] = await apiClient.fetchWallets(token);
    const localWallets = await storage.getWallets();

    for (const remWallet of remoteWallets) {
      const existing = localWallets.find((w) => w.id === remWallet.id);

      if (!existing) {
        await storage.addWallet({
          id: remWallet.id,
          name: remWallet.name,
          icon: remWallet.icon,
          color: remWallet.color,
          createdAt: remWallet.createdAt,
        });
        summary.walletsPulled++;
      }
    }
    console.log(`✅ [SyncService] Pulled ${summary.walletsPulled} new wallets`);
  } catch (e) {
    const msg = `Pull wallets failed: ${e instanceof Error ? e.message : String(e)}`;
    errors.push(msg);
    console.error('❌ [SyncService]', msg);
  }

  try {
    const lastSync = await getLastSyncAt();
    const remoteSubscriptions = await apiClient.fetchSubscriptions(token, lastSync ?? undefined);

    for (const remSub of remoteSubscriptions) {
      await storage.upsertSubscription({
        id: remSub.id,
        name: remSub.name,
        amount: remSub.amount,
        billingCycle: remSub.billingCycle,
        startDate: remSub.startDate,
        nextBillingDate: remSub.nextBillingDate,
        isActive: remSub.isActive,
        description: remSub.description,
        icon: remSub.icon,
        color: remSub.color,
        createdAt: remSub.createdAt,
      });
      summary.subscriptionsPulled++;
    }
    console.log(`[SyncService] Pulled ${summary.subscriptionsPulled} subscriptions`);
  } catch (e) {
    const msg = `Pull subscriptions failed: ${e instanceof Error ? e.message : String(e)}`;
    errors.push(msg);
    console.error('[SyncService]', msg);
  }

  try {
    const lastSync = await getLastSyncAt();
    const remoteBudgets: RemoteBudget[] = await apiClient.fetchBudgets(token, lastSync ?? undefined);
    const [localCategories, localBudgets] = await Promise.all([
      storage.getCategories(),
      storage.getBudgets(),
    ]);

    for (const remBudget of remoteBudgets) {
      const localCat = findMatchingCategory(
        localCategories,
        remBudget.categoryId,
        remBudget.categoryName,
        remBudget.categoryType
      );

      let categoryId = localCat?.id ?? remBudget.categoryId;
      if (!localCat && remBudget.categoryName) {
        try {
          await storage.addCategory({
            id: remBudget.categoryId,
            name: toMobileCategoryName(remBudget.categoryName, remBudget.categoryType),
            type: remBudget.categoryType,
            icon: remBudget.categoryIcon || 'money',
            color: remBudget.categoryColor || '#ef4444',
          });
        } catch {
          // Ignore duplicate category insertions.
        }
      } else if (localCat) {
        categoryId = localCat.id;
      }

      const existing = localBudgets.find(
        (budget) =>
          budget.categoryId === categoryId &&
          budget.year === remBudget.year &&
          budget.month === remBudget.month
      );

      if (!existing || existing.amount !== remBudget.amount) {
        await storage.setBudget(categoryId, remBudget.amount, remBudget.year, remBudget.month);
        summary.budgetsPulled++;
      }
    }
    console.log(`[SyncService] Pulled ${summary.budgetsPulled} budgets`);
  } catch (e) {
    const msg = `Pull budgets failed: ${e instanceof Error ? e.message : String(e)}`;
    errors.push(msg);
    console.error('[SyncService]', msg);
  }

  // ── 6. PULL Transactions ─────────────────────────────────────────────────────
  try {
    const lastSync = await getLastSyncAt();
    const remoteTransactions: RemoteTransaction[] = await apiClient.fetchTransactions(
      token,
      lastSync ?? undefined
    );

    const localCategories = await storage.getCategories();
    const localTxs = await storage.getTransactions();

    for (const remTx of remoteTransactions) {
      // Skip if already exists locally
      const existing = localTxs.find((t) => t.id === remTx.id);
      if (existing) continue;

      // Ensure category exists locally
      let categoryId = remTx.categoryId;
      const localCat = findMatchingCategory(
        localCategories,
        remTx.categoryId,
        remTx.categoryName,
        remTx.type
      );

      if (!localCat && remTx.categoryName) {
        await storage.addCategory({
          id: remTx.categoryId,
          name: toMobileCategoryName(remTx.categoryName, remTx.type),
          type: remTx.type,
          icon: remTx.categoryIcon || '💰',
          color: remTx.categoryColor || '#9ca3af',
        });
      } else if (localCat) {
        categoryId = localCat.id;
      }

      try {
        await storage.addTransaction({
          id: remTx.id,
          amount: remTx.amount,
          type: remTx.type as 'INCOME' | 'EXPENSE',
          date: remTx.date,
          notes: remTx.notes,
          categoryId,
          // Gunakan walletId dari server — ini yang paling penting!
          walletId: remTx.walletId || 'default',
          createdAt: remTx.createdAt,
        });
        summary.transactionsPulled++;
      } catch (txErr) {
        errors.push(`Pull tx error: ${txErr instanceof Error ? txErr.message : String(txErr)}`);
      }
    }
    console.log(`✅ [SyncService] Pulled ${summary.transactionsPulled} new transactions`);
  } catch (e) {
    const msg = `Pull transactions failed: ${e instanceof Error ? e.message : String(e)}`;
    errors.push(msg);
    console.error('❌ [SyncService]', msg);
  }

  // ── 7. Save sync timestamp ───────────────────────────────────────────────────
  summary.syncedAt = new Date().toISOString();
  await saveLastSyncAt(summary.syncedAt);

  return summary;
}
