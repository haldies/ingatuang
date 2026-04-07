import { requireNativeModule } from 'expo-modules-core';

export interface SharedStorageModule {
  getQueue: () => Promise<string>;
  clearQueue: () => Promise<void>;
}

let SharedStorage: SharedStorageModule;

try {
  // Mencoba memuat native module (hanya ada di EAS build / Development Build)
  SharedStorage = requireNativeModule('SharedStorage');
} catch (e) {
  // Fallback untuk Expo Go / Web / Dev environment tanpa native module
  console.warn('[SharedStorage] Native module not found, using development mock.');
  SharedStorage = {
    getQueue: () => Promise.resolve('[]'),
    clearQueue: () => Promise.resolve(),
  } as SharedStorageModule;
}

export default SharedStorage;
