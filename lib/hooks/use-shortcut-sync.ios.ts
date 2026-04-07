import { useEffect, useRef } from 'react';
import SharedStorage from '@/modules/shared-storage';
import { eventEmitter, EVENTS } from '@/lib/utils/events';
import { storage } from '@/lib/storage/storage-adapter';

export function useShortcutSync() {
  const isProcessing = useRef(false);

  const syncQueue = async () => {
    // Hindari concurrent processing
    if (isProcessing.current) return;
    if (!SharedStorage) return;

    isProcessing.current = true;

    try {
      // Baca file antrian yang ditulis oleh QuickAddIntent (Swift)
      const jsonStr = await SharedStorage.getQueue();
      if (!jsonStr || jsonStr === '[]') return;

      const transactions = JSON.parse(jsonStr);
      if (!Array.isArray(transactions) || transactions.length === 0) return;

      console.log(`[iOS Sync] Memproses ${transactions.length} transaksi dari Siri...`);

      // Ambil wallet default untuk fallback
      const wallets = await storage.getWallets?.() ?? [];
      const defaultWalletId = wallets[0]?.id ?? 'default';

      let success = 0;
      for (const tx of transactions) {
        try {
          await storage.addTransaction({
            amount: tx.amount,
            notes: tx.notes || 'Transaksi',
            type: (tx.type || 'EXPENSE').toUpperCase() as 'INCOME' | 'EXPENSE',
            categoryId: tx.categoryId || '12',
            date: tx.date || new Date().toISOString(),
            walletId: defaultWalletId,
          });
          success++;
        } catch (e) {
          console.error('[iOS Sync] Gagal simpan transaksi:', e);
        }
      }

      // Hanya hapus antrian jika setidaknya 1 berhasil disimpan
      if (success > 0) {
        await SharedStorage.clearQueue();
        console.log(`[iOS Sync] ${success} transaksi berhasil disinkron.`);
        eventEmitter.emit(EVENTS.TRANSACTION_ADDED);
      }
    } catch (error) {
      console.error('[iOS Sync Error]', error);
    } finally {
      isProcessing.current = false;
    }
  };

  useEffect(() => {
    // Sync saat app pertama dibuka
    syncQueue();

    // Sync saat app kembali aktif dari background
    const onAppResumed = () => syncQueue();
    eventEmitter.on(EVENTS.APP_RESUMED, onAppResumed);

    return () => {
      eventEmitter.off(EVENTS.APP_RESUMED, onAppResumed);
    };
  }, []);
}
