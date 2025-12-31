import { getAuthToken } from './auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://ingatuang.vercel.app';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Fetch with auth token
export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  console.log('=== FETCH WITH AUTH ===');
  console.log('Endpoint:', endpoint);
  
  const token = await getAuthToken();
  console.log('Token exists:', !!token);
  console.log('Token value:', token ? `${token.substring(0, 20)}...` : 'null');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge existing headers
  if (options.headers) {
    const existingHeaders = options.headers as Record<string, string>;
    Object.assign(headers, existingHeaders);
  }

  // Add auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log('Request headers:', headers);
  console.log('Full URL:', `${API_URL}${endpoint}`);

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  console.log('Response status:', response.status);
  console.log('Response ok:', response.ok);

  return response;
}

// GET request
export async function apiGet<T = any>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetchWithAuth(endpoint, {
      method: 'GET',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Request failed',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('API GET error:', error);
    return {
      success: false,
      error: 'Gagal terhubung ke server',
    };
  }
}

// POST request
export async function apiPost<T = any>(
  endpoint: string,
  body: any
): Promise<ApiResponse<T>> {
  try {
    const response = await fetchWithAuth(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Request failed',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('API POST error:', error);
    return {
      success: false,
      error: 'Gagal terhubung ke server',
    };
  }
}

// PUT request
export async function apiPut<T = any>(
  endpoint: string,
  body: any
): Promise<ApiResponse<T>> {
  try {
    const response = await fetchWithAuth(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Request failed',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('API PUT error:', error);
    return {
      success: false,
      error: 'Gagal terhubung ke server',
    };
  }
}

// DELETE request
export async function apiDelete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetchWithAuth(endpoint, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Request failed',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('API DELETE error:', error);
    return {
      success: false,
      error: 'Gagal terhubung ke server',
    };
  }
}

// Export API URL for direct use
export { API_URL };
