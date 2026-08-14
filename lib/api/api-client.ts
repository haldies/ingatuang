import { Platform } from 'react-native';
import { getApiKey, getApiBaseUrl } from '../storage/secure-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RemoteTransaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  notes: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  walletId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RemoteWallet {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface RemoteCategory {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  color: string;
  createdAt: string;
}

export interface RemoteSubscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: string;
  nextBillingDate: string;
  isActive: boolean;
  description: string;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface RemoteBudget {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryType: 'INCOME' | 'EXPENSE';
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors?: string[];
  syncedAt: string;
}

const DEFAULT_API_BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api/v1/mobile' // Android emulator
    : 'http://localhost:3000/api/v1/mobile' // iOS simulator
  : 'https://ingatuang.vercel.app/api/v1/mobile'; // Production

interface SplitBillData {
  title: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  persons: Array<{
    id: string;
    name: string;
  }>;
  assignments: Array<{
    itemId: string;
    personId: string;
  }>;
  taxPercentage: number;
  servicePercentage: number;
  subtotal: number;
  total: number;
}

interface PersonSummary {
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

interface SplitBillShareResponse {
  success: boolean;
  data: {
    title: string;
    items: any[];
    persons: any[];
    assignments: any[];
    summary: {
      subtotal: number;
      taxPercentage: number;
      taxAmount: number;
      servicePercentage: number;
      serviceAmount: number;
      total: number;
    };
    personSummaries: PersonSummary[];
    createdAt: string;
  };
}

class ApiClient {
  /**
   * Get API base URL for v1 mobile endpoints (split bill, etc.)
   */
  private async getBaseUrl(): Promise<string> {
    const customUrl = await getApiBaseUrl();
    return customUrl || DEFAULT_API_BASE_URL;
  }

  /**
   * Derive the sync base URL: /api/mobile/sync
   */
  private async getSyncBaseUrl(): Promise<string> {
    const baseUrl = await this.getBaseUrl();
    // baseUrl is like https://ingatuang.vercel.app/api/v1/mobile
    // sync endpoints are at https://ingatuang.vercel.app/api/mobile/sync
    return baseUrl.replace('/api/v1/mobile', '/api/mobile/sync');
  }

  /**
   * Get headers with API key from secure storage (for split-bill / legacy API)
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const apiKey = await getApiKey();
    
    if (!apiKey) {
      throw new Error('API key not found. Please configure your API key in settings.');
    }

    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Share split bill to backend (get formatted response)
   * This does NOT save to backend database, only returns formatted data
   */
  async shareSplitBill(data: SplitBillData): Promise<SplitBillShareResponse> {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}/split-bill/share`;
    
    console.log('📤 [API Client] Sharing split bill to backend:', url);
    console.log('📤 [API Client] Data:', JSON.stringify(data, null, 2));

    try {
      const headers = await this.getHeaders();
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ [API Client] Error response:', responseData);
        throw new Error(responseData.error || 'Failed to share split bill');
      }

      console.log('✅ [API Client] Split bill shared successfully');
      return responseData;
    } catch (error) {
      console.error('❌ [API Client] Network error:', error);
      throw error;
    }
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{ user: any, token: string }> {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl.replace('/api/v1/mobile', '/api/v1/mobile/auth/login')}`;
    
    console.log('🔐 [API Client] Logging in to:', url);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ [API Client] Login failed:', responseData);
        throw new Error(responseData.error || 'Login failed');
      }

      console.log('✅ [API Client] Login successful');
      return responseData;
    } catch (error) {
      console.error('❌ [API Client] Network error during login:', error);
      throw error;
    }
  }

  /**
   * Register a new account
   */
  async register(name: string, email: string, password: string): Promise<{ user: any, token: string }> {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl.replace('/api/v1/mobile', '/api/v1/mobile/auth/register')}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Register failed');
      }

      return responseData;
    } catch (error) {
      console.error('âŒ [API Client] Network error during register:', error);
      throw error;
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const baseUrl = await this.getBaseUrl();
      console.log('🧪 [API Client] Testing connection to:', baseUrl);
      
      // Try to share a simple split bill
      const testData: SplitBillData = {
        title: 'Test Connection',
        items: [{ id: '1', name: 'Test Item', price: 10000, quantity: 1 }],
        persons: [{ id: '1', name: 'Test Person' }],
        assignments: [{ itemId: '1', personId: '1' }],
        taxPercentage: 0,
        servicePercentage: 0,
        subtotal: 10000,
        total: 10000,
      };

      await this.shareSplitBill(testData);
      console.log('✅ [API Client] Connection test successful');
      return true;
    } catch (error) {
      console.error('❌ [API Client] Connection test failed:', error);
      return false;
    }
  }

  // ─── SYNC METHODS ──────────────────────────────────────────────────────────
  // These use the JWT token (from login) as Bearer token.

  /**
   * Fetch all transactions from server
   * @param token - JWT token from login
   * @param since - ISO date string, only fetch transactions updated since this date
   */
  async fetchTransactions(token: string, since?: string): Promise<RemoteTransaction[]> {
    const syncBase = await this.getSyncBaseUrl();
    const url = since
      ? `${syncBase}/transactions?since=${encodeURIComponent(since)}`
      : `${syncBase}/transactions`;

    console.log('☁️ [Sync] Fetching transactions from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch transactions');
    return data.data as RemoteTransaction[];
  }

  /**
   * Push local transactions to server
   * @param token - JWT token from login
   * @param transactions - array of local transactions to push
   */
  async syncTransactions(
    token: string,
    transactions: Array<{
      id?: string;
      amount: number;
      type: 'INCOME' | 'EXPENSE';
      date: string;
      notes?: string;
      categoryId: string;
      categoryName?: string;
      walletId?: string;
    }>
  ): Promise<SyncResult> {
    const syncBase = await this.getSyncBaseUrl();
    const url = `${syncBase}/transactions`;

    console.log('📤 [Sync] Pushing', transactions.length, 'transactions to server');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactions }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to sync transactions');
    return data as SyncResult;
  }

  /**
   * Fetch all categories from server
   * @param token - JWT token from login
   */
  async fetchCategories(token: string): Promise<RemoteCategory[]> {
    const syncBase = await this.getSyncBaseUrl();
    const url = `${syncBase}/categories`;

    console.log('☁️ [Sync] Fetching categories from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch categories');
    return data.data as RemoteCategory[];
  }

  /**
   * Fetch all subscriptions from server
   * @param token - JWT token from login
   * @param since - ISO date string, only fetch subscriptions updated since this date
   */
  async fetchSubscriptions(token: string, since?: string): Promise<RemoteSubscription[]> {
    const syncBase = await this.getSyncBaseUrl();
    const url = since
      ? `${syncBase}/subscriptions?since=${encodeURIComponent(since)}`
      : `${syncBase}/subscriptions`;

    console.log('☁️ [Sync] Fetching subscriptions from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch subscriptions');
    return data.data as RemoteSubscription[];
  }

  /**
   * Push local subscriptions to server
   * @param token - JWT token from login
   * @param subscriptions - array of local subscriptions to push
   */
  async syncSubscriptions(
    token: string,
    subscriptions: Array<{
      id?: string;
      name: string;
      amount: number;
      billingCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
      startDate: string;
      nextBillingDate: string;
      isActive: boolean;
      description?: string;
      icon?: string;
      color?: string;
    }>
  ): Promise<SyncResult> {
    const syncBase = await this.getSyncBaseUrl();
    const url = `${syncBase}/subscriptions`;

    console.log('📤 [Sync] Pushing', subscriptions.length, 'subscriptions to server');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscriptions }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to sync subscriptions');
    return data as SyncResult;
  }

  /**
   * Fetch budgets from server
   */
  async fetchBudgets(token: string, since?: string): Promise<RemoteBudget[]> {
    const syncBase = await this.getSyncBaseUrl();
    const url = since
      ? `${syncBase}/budgets?since=${encodeURIComponent(since)}`
      : `${syncBase}/budgets`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch budgets');
    return data.data as RemoteBudget[];
  }

  /**
   * Push local budgets to server
   */
  async syncBudgets(
    token: string,
    budgets: {
      id?: string;
      categoryId: string;
      categoryName?: string;
      amount: number;
      month: number;
      year: number;
    }[]
  ): Promise<SyncResult> {
    const syncBase = await this.getSyncBaseUrl();
    const response = await fetch(`${syncBase}/budgets`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ budgets }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to sync budgets');
    return data as SyncResult;
  }

  /**
   * Fetch all wallets for the user from server
   * @param token - JWT token from login
   */
  async fetchWallets(token: string): Promise<RemoteWallet[]> {
    const syncBase = await this.getSyncBaseUrl();
    const url = `${syncBase}/wallets`;

    console.log('☁️ [Sync] Fetching wallets from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch wallets');
    return data.data as RemoteWallet[];
  }

  /**
   * Push local wallets to server
   * @param token - JWT token from login
   * @param wallets - array of local wallets
   */
  async syncWallets(
    token: string,
    wallets: Array<{
      id: string;
      name: string;
      icon?: string;
      color?: string;
    }>
  ): Promise<{ created: number; updated: number; errors?: string[]; syncedAt: string }> {
    const syncBase = await this.getSyncBaseUrl();
    const url = `${syncBase}/wallets`;

    console.log('📤 [Sync] Pushing', wallets.length, 'wallets to server');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ wallets }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to sync wallets');
    return data;
  }

  /**
   * Fetch current iOS Shortcut URL and version from server
   */
  async getShortcutInfo(): Promise<{ url: string; version: string }> {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl.replace('/api/v1/mobile', '/api/v1/system/shortcut')}`;

    console.log('🔄 [API Client] Fetching shortcut info from:', url);

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) return { url: '', version: '' };
      return { url: data.url, version: data.version };
    } catch (error) {
      console.error('❌ [API Client] Error fetching shortcut info:', error);
      return { url: '', version: '' };
    }
  }
}

export const apiClient = new ApiClient();

// Export types

