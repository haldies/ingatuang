import { requireNativeModule } from 'expo-modules-core';

// Memanggil Modul Swift yang kita buat tadi (SharedStorageModule.swift)
const SharedStorage = requireNativeModule('SharedStorage');

/**
 * Interface untuk data antrian transaksi
 */
export interface ShortcutQueueEntry {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  categoryId: string;
  notes: string;
  date: string;
  createdAt: string;
}

/**
 * Utilitas untuk membaca dan membersihkan antrian Shortcut
 */
export const sharedStorage = {
  getQueue(): ShortcutQueueEntry[] {
    try {
      const json = SharedStorage.getQueue();
      return JSON.parse(json) as ShortcutQueueEntry[];
    } catch (e) {
      console.error('Failed to get Shortcut queue:', e);
      return [];
    }
  },
  
  clearQueue(): void {
    try {
      SharedStorage.clearQueue();
    } catch (e) {
      console.error('Failed to clear Shortcut queue:', e);
    }
  }
};
