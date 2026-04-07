import { useEffect, useRef } from 'react';
import SharedStorage from '@/modules/shared-storage';
import { eventEmitter, EVENTS } from '@/lib/utils/events';
import { storage } from '@/lib/storage/storage-adapter';

export function useShortcutSync() {
  const isProcessing = useRef(false);

  const syncQueue = async () => {
    // Safety check for development/Expo Go
    if (isProcessing.current) return;
    if (!SharedStorage || typeof SharedStorage.getQueue !== 'function') return;

    isProcessing.current = true;

    try {
      const jsonStr = await SharedStorage.getQueue();
      if (!jsonStr || jsonStr === '[]') return;

      const transactions = JSON.parse(jsonStr);
      if (!Array.isArray(transactions) || transactions.length === 0) return;

      console.log(`[iOS Siri Sync] Processing ${transactions.length} transactions...`);

      const wallets = await storage.getWallets?.() ?? [];
      const defaultWalletId = wallets[0]?.id ?? 'default';

      let success = 0;
      for (const tx of transactions) {
        try {
          await storage.addTransaction({
            amount: tx.amount,
            notes: tx.notes || 'Siri Transaction',
            type: (tx.type || 'EXPENSE').toUpperCase() as 'INCOME' | 'EXPENSE',
            categoryId: tx.categoryId || '12',
            date: tx.date || new Date().toISOString(),
            walletId: tx.walletId || defaultWalletId,
          });
          success++;
        } catch (e) {
          console.error('[iOS Sync] Failed to save transaction:', e);
        }
      }

      if (success > 0) {
        await SharedStorage.clearQueue();
        eventEmitter.emit(EVENTS.TRANSACTION_ADDED);
      }
    } catch (error) {
      console.error('[iOS Sync Error]', error);
    } finally {
      isProcessing.current = false;
    }
  };

  useEffect(() => {
    syncQueue();
    const onAppResumed = () => syncQueue();
    eventEmitter.on(EVENTS.APP_RESUMED, onAppResumed);
    return () => eventEmitter.off(EVENTS.APP_RESUMED, onAppResumed);
  }, []);
}
