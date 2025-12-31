import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEY = '@ingatuang:auth';
const API_URL = process.env.EXPO_PUBLIC_API_URL

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthData {
  user: User;
  token: string;
}

// Register new user
export async function register(name: string, email: string, password: string): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    console.log('=== REGISTER START ===');
    console.log('API URL:', API_URL);
    console.log('Endpoint:', `${API_URL}/api/mobile/auth/register`);
    console.log('Request body:', { name, email, password: '***' });

    const response = await fetch(`${API_URL}/api/mobile/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      console.log('Register failed:', data.error);
      return {
        success: false,
        message: data.error || 'Registrasi gagal',
      };
    }

    // Save auth data
    const authData: AuthData = {
      user: data.user,
      token: data.token,
    };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(authData));
    console.log('Auth data saved to AsyncStorage');
    console.log('=== REGISTER SUCCESS ===');

    return {
      success: true,
      message: 'Registrasi berhasil',
      user: data.user,
    };
  } catch (error) {
    console.error('=== REGISTER ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    return {
      success: false,
      message: 'Gagal terhubung ke server',
    };
  }
}

// Login user
export async function login(email: string, password: string): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    console.log('=== LOGIN START ===');
    console.log('API URL:', API_URL);
    console.log('Endpoint:', `${API_URL}/api/mobile/auth/login`);
    console.log('Request body:', { email, password: '***' });

    const response = await fetch(`${API_URL}/api/mobile/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      console.log('Login failed:', data.error);
      return {
        success: false,
        message: data.error || 'Login gagal',
      };
    }

    // Save auth data
    const authData: AuthData = {
      user: data.user,
      token: data.token,
    };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(authData));
    console.log('Auth data saved to AsyncStorage');
    console.log('=== LOGIN SUCCESS ===');

    return {
      success: true,
      message: 'Login berhasil',
      user: data.user,
    };
  } catch (error) {
    console.error('=== LOGIN ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return {
      success: false,
      message: 'Gagal terhubung ke server',
    };
  }
}

// Logout user
export async function logout(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AUTH_KEY);
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  try {
    const authData = await AsyncStorage.getItem(AUTH_KEY);
    if (!authData) return null;

    const { user }: AuthData = JSON.parse(authData);
    return user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

// Get auth token
export async function getAuthToken(): Promise<string | null> {
  try {
    const authData = await AsyncStorage.getItem(AUTH_KEY);
    if (!authData) return null;

    const { token }: AuthData = JSON.parse(authData);
    return token;
  } catch (error) {
    console.error('Get auth token error:', error);
    return null;
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    const authData = await AsyncStorage.getItem(AUTH_KEY);
    return !!authData;
  } catch (error) {
    console.error('Check auth error:', error);
    return false;
  }
}

// Update user profile in storage
export async function updateUserProfile(updatedUser: Partial<User>): Promise<void> {
  try {
    const authData = await AsyncStorage.getItem(AUTH_KEY);
    if (!authData) return;

    const data: AuthData = JSON.parse(authData);
    const newAuthData: AuthData = {
      ...data,
      user: {
        ...data.user,
        ...updatedUser,
      },
    };
    
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(newAuthData));
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
}
