// Migration utility from AsyncStorage to Room Database
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RoomStorage from './room-storage';
import { Platform } from 'react-native';

const STORAGE_KEYS = {
  TRANSACTIONS: '@ingat_uang:transactions',
  CATEGORIES: '@ingat_uang:categories',
  MIGRATION_COMPLETED: '@ingat_uang:room_migration_completed',
};

export interface MigrationResult {
  success: boolean;
  transactionsMigrated: number;
  categoriesMigrated: number;
  errors: string[];
}

/**
 * Migrate data from AsyncStorage to Room Database
 * This should be called once when the app starts
 */
export async function migrateToRoom(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    transactionsMigrated: 0,
    categoriesMigrated: 0,
    errors: [],
  };

  // Only run on Android
  if (Platform.OS !== 'android') {
    result.errors.push('Room Database is only available on Android');
    return result;
  }

  // Check if Room is available
  if (!RoomStorage.isRoomStorageAvailable()) {
    result.errors.push('Room Storage module is not available');
    return result;
  }

  try {
    // Check if migration already completed
    const migrationCompleted = await AsyncStorage.getItem(STORAGE_KEYS.MIGRATION_COMPLETED);
    if (migrationCompleted === 'true') {
      console.log('Migration already completed, skipping...');
      result.success = true;
      return result;
    }

    console.log('Starting migration to Room Database...');

    // Migrate transactions
    try {
      const transactionsData = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (transactionsData) {
        const transactions = JSON.parse(transactionsData);
        console.log(`Found ${transactions.length} transactions to migrate`);

        for (const transaction of transactions) {
          try {
            await RoomStorage.addTransaction({
              amount: transaction.amount,
              type: transaction.type,
              date: transaction.date,
              categoryId: transaction.categoryId,
              notes: transaction.notes || '',
            });
            result.transactionsMigrated++;
          } catch (error) {
            console.error('Error migrating transaction:', error);
            result.errors.push(`Failed to migrate transaction ${transaction.id}: ${error}`);
          }
        }

        console.log(`Successfully migrated ${result.transactionsMigrated} transactions`);
      }
    } catch (error) {
      console.error('Error migrating transactions:', error);
      result.errors.push(`Transaction migration error: ${error}`);
    }

    // Note: Categories are auto-initialized by Room, so we don't need to migrate them
    // But we can verify they exist
    try {
      const categories = await RoomStorage.getAllCategories();
      result.categoriesMigrated = categories.length;
      console.log(`Found ${categories.length} categories in Room Database`);
    } catch (error) {
      console.error('Error checking categories:', error);
      result.errors.push(`Category check error: ${error}`);
    }

    // Mark migration as completed
    await AsyncStorage.setItem(STORAGE_KEYS.MIGRATION_COMPLETED, 'true');
    
    result.success = result.errors.length === 0;
    console.log('Migration completed!', result);

    return result;
  } catch (error) {
    console.error('Migration failed:', error);
    result.errors.push(`Migration failed: ${error}`);
    return result;
  }
}

/**
 * Reset migration flag (for testing purposes)
 */
export async function resetMigrationFlag(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.MIGRATION_COMPLETED);
  console.log('Migration flag reset');
}

/**
 * Check if migration has been completed
 */
export async function isMigrationCompleted(): Promise<boolean> {
  const completed = await AsyncStorage.getItem(STORAGE_KEYS.MIGRATION_COMPLETED);
  return completed === 'true';
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<{
  completed: boolean;
  roomAvailable: boolean;
  platform: string;
}> {
  return {
    completed: await isMigrationCompleted(),
    roomAvailable: RoomStorage.isRoomStorageAvailable(),
    platform: Platform.OS,
  };
}
