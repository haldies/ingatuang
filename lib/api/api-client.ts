import { Platform } from 'react-native';
import { getApiKey, getApiBaseUrl } from '../storage/secure-storage';

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
   * Get API base URL (custom or default)
   */
  private async getBaseUrl(): Promise<string> {
    const customUrl = await getApiBaseUrl();
    return customUrl || DEFAULT_API_BASE_URL;
  }

  /**
   * Get headers with API key from secure storage
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
}

export const apiClient = new ApiClient();

// Export types
export type { SplitBillData, PersonSummary, SplitBillShareResponse };
