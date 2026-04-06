// Secure storage for sensitive data like API keys
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_KEY_STORAGE_KEY = 'ingat_uang_api_key';
const API_BASE_URL_KEY = 'ingat_uang_api_base_url';

/**
 * Save API key securely
 * @param apiKey - The API key to store
 */
export async function saveApiKey(apiKey: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // For web, use localStorage (less secure but necessary)
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    } else {
      // For iOS/Android, use SecureStore (encrypted)
      await SecureStore.setItemAsync(API_KEY_STORAGE_KEY, apiKey);
    }
    console.log('✅ [Secure Storage] API key saved successfully');
  } catch (error) {
    console.error('❌ [Secure Storage] Failed to save API key:', error);
    throw error;
  }
}

/**
 * Get API key from secure storage
 * @returns The stored API key or null if not found
 */
export async function getApiKey(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(API_KEY_STORAGE_KEY);
    } else {
      return await SecureStore.getItemAsync(API_KEY_STORAGE_KEY);
    }
  } catch (error) {
    console.error('❌ [Secure Storage] Failed to get API key:', error);
    return null;
  }
}

/**
 * Delete API key from secure storage
 */
export async function deleteApiKey(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    } else {
      await SecureStore.deleteItemAsync(API_KEY_STORAGE_KEY);
    }
    console.log('✅ [Secure Storage] API key deleted successfully');
  } catch (error) {
    console.error('❌ [Secure Storage] Failed to delete API key:', error);
    throw error;
  }
}

/**
 * Check if API key exists
 * @returns true if API key is stored, false otherwise
 */
export async function hasApiKey(): Promise<boolean> {
  const apiKey = await getApiKey();
  return apiKey !== null && apiKey.length > 0;
}

/**
 * Save custom API base URL (optional, for advanced users)
 */
export async function saveApiBaseUrl(url: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(API_BASE_URL_KEY, url);
    } else {
      await SecureStore.setItemAsync(API_BASE_URL_KEY, url);
    }
    console.log('✅ [Secure Storage] API base URL saved successfully');
  } catch (error) {
    console.error('❌ [Secure Storage] Failed to save API base URL:', error);
    throw error;
  }
}

/**
 * Get custom API base URL
 */
export async function getApiBaseUrl(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(API_BASE_URL_KEY);
    } else {
      return await SecureStore.getItemAsync(API_BASE_URL_KEY);
    }
  } catch (error) {
    console.error('❌ [Secure Storage] Failed to get API base URL:', error);
    return null;
  }
}

/**
 * Clear all secure storage data
 */
export async function clearAllSecureData(): Promise<void> {
  try {
    await deleteApiKey();
    if (Platform.OS === 'web') {
      localStorage.removeItem(API_BASE_URL_KEY);
    } else {
      await SecureStore.deleteItemAsync(API_BASE_URL_KEY);
    }
    console.log('✅ [Secure Storage] All secure data cleared');
  } catch (error) {
    console.error('❌ [Secure Storage] Failed to clear secure data:', error);
    throw error;
  }
}
