// Room Database wrapper for React Native
import { NativeModules, Platform } from 'react-native';

const { RoomStorage } = NativeModules;

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'INCOME' | 'EXPENSE';
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  categoryId: string;
  walletId: string;
  notes?: string;
  createdAt: string;
}

export interface AIConsent {
  hasShownDialog: boolean;
  hasAccepted: boolean;
  timestamp: string;
}

// Check if Room Storage is available (Android only)
const isRoomAvailable = Platform.OS === 'android' && RoomStorage;

// Transaction operations
export async function getAllTransactions(): Promise<Transaction[]> {
  if (!isRoomAvailable) {
    console.warn('Room Storage is only available on Android');
    return [];
  }
  
  try {
    const transactions = await RoomStorage.getAllTransactions();
    return transactions || [];
  } catch (error) {
    console.error('Error getting transactions from Room:', error);
    return [];
  }
}

export async function addTransaction(
  transaction: Omit<Transaction, 'id' | 'createdAt'>
): Promise<Transaction | null> {
  if (!isRoomAvailable) {
    console.warn('Room Storage is only available on Android');
    return null;
  }
  
  try {
    const result = await RoomStorage.addTransaction(transaction);
    return result;
  } catch (error) {
    console.error('Error adding transaction to Room:', error);
    return null;
  }
}

export async function updateTransaction(
  id: string,
  updates: Partial<Transaction>
): Promise<Transaction | null> {
  if (!isRoomAvailable) {
    console.warn('Room Storage is only available on Android');
    return null;
  }
  
  try {
    const result = await RoomStorage.updateTransaction(id, updates);
    return result;
  } catch (error) {
    console.error('Error updating transaction in Room:', error);
    return null;
  }
}

export async function deleteTransaction(id: string): Promise<boolean> {
  if (!isRoomAvailable) {
    console.warn('Room Storage is only available on Android');
    return false;
  }
  
  try {
    const result = await RoomStorage.deleteTransaction(id);
    return result;
  } catch (error) {
    console.error('Error deleting transaction from Room:', error);
    return false;
  }
}

export async function deleteAllTransactions(): Promise<number> {
  if (!isRoomAvailable) {
    console.warn('Room Storage is only available on Android');
    return 0;
  }
  
  try {
    const result = await RoomStorage.deleteAllTransactions();
    return result;
  } catch (error) {
    console.error('Error deleting all transactions from Room:', error);
    return 0;
  }
}

// Category operations
export async function getAllCategories(): Promise<Category[]> {
  if (!isRoomAvailable) {
    console.warn('Room Storage is only available on Android');
    return [];
  }
  
  try {
    const categories = await RoomStorage.getAllCategories();
    return categories || [];
  } catch (error) {
    console.error('Error getting categories from Room:', error);
    return [];
  }
}

export async function getCategoryById(id: string): Promise<Category | null> {
  if (!isRoomAvailable) {
    console.warn('Room Storage is only available on Android');
    return null;
  }
  
  try {
    const category = await RoomStorage.getCategoryById(id);
    return category;
  } catch (error) {
    console.error('Error getting category from Room:', error);
    return null;
  }
}

export async function addCategory(category: Category): Promise<Category | null> {
  if (!isRoomAvailable) {
    console.warn('Room Storage is only available on Android');
    return null;
  }
  
  try {
    const result = await RoomStorage.addCategory(category);
    return result;
  } catch (error) {
    console.error('Error adding category to Room:', error);
    return null;
  }
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
  if (!isRoomAvailable) {
    console.warn('Room Storage is only available on Android');
    return null;
  }
  
  try {
    const result = await RoomStorage.updateCategory(id, updates);
    return result;
  } catch (error) {
    console.error('Error updating category in Room:', error);
    return null;
  }
}

export async function deleteCategory(id: string): Promise<boolean> {
  if (!isRoomAvailable) {
    console.warn('Room Storage is only available on Android');
    return false;
  }
  
  try {
    const result = await RoomStorage.deleteCategory(id);
    return result;
  } catch (error) {
    console.error('Error deleting category from Room:', error);
    return false;
  }
}

// Helper to check if Room is available
export function isRoomStorageAvailable(): boolean {
  return isRoomAvailable;
}

// AI Consent operations
export async function getAIConsent(): Promise<AIConsent | null> {
  if (!isRoomAvailable) {
    console.warn('Room Storage is only available on Android');
    return null;
  }
  
  try {
    const consent = await RoomStorage.getAIConsent();
    return consent;
  } catch (error) {
    console.error('Error getting AI consent from Room:', error);
    return null;
  }
}

export async function saveAIConsent(hasAccepted: boolean): Promise<AIConsent | null> {
  if (!isRoomAvailable) {
    console.warn('Room Storage is only available on Android');
    return null;
  }
  
  try {
    const result = await RoomStorage.saveAIConsent(hasAccepted);
    return result;
  } catch (error) {
    console.error('Error saving AI consent to Room:', error);
    return null;
  }
}

export async function resetAIConsent(): Promise<boolean> {
  if (!isRoomAvailable) {
    console.warn('Room Storage is only available on Android');
    return false;
  }
  
  try {
    const result = await RoomStorage.resetAIConsent();
    return result;
  } catch (error) {
    console.error('Error resetting AI consent in Room:', error);
    return false;
  }
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: string;
  nextBillingDate: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
}

// Subscription operations
export async function getAllSubscriptions(): Promise<Subscription[]> {
  if (!isRoomAvailable) {
    console.warn('Room Storage is only available on Android');
    return [];
  }
  
  try {
    const subscriptions = await RoomStorage.getAllSubscriptions();
    return subscriptions || [];
  } catch (error) {
    console.error('Error getting subscriptions from Room:', error);
    return [];
  }
}

export async function addSubscription(
  subscription: Omit<Subscription, 'id' | 'createdAt'>
): Promise<Subscription | null> {
  if (!isRoomAvailable) {
    console.warn('Room Storage is only available on Android');
    return null;
  }
  
  try {
    const result = await RoomStorage.addSubscription(subscription);
    return result;
  } catch (error) {
    console.error('Error adding subscription to Room:', error);
    return null;
  }
}

export async function updateSubscription(
  id: string,
  updates: Partial<Subscription>
): Promise<Subscription | null> {
  if (!isRoomAvailable) {
    console.warn('Room Storage is only available on Android');
    return null;
  }
  
  try {
    const result = await RoomStorage.updateSubscription(id, updates);
    return result;
  } catch (error) {
    console.error('Error updating subscription in Room:', error);
    return null;
  }
}

export async function deleteSubscription(id: string): Promise<boolean> {
  if (!isRoomAvailable) {
    console.warn('Room Storage is only available on Android');
    return false;
  }
  
  try {
    const result = await RoomStorage.deleteSubscription(id);
    return result;
  } catch (error) {
    console.error('Error deleting subscription from Room:', error);
    return false;
  }
}

export async function deleteAllSubscriptions(): Promise<boolean> {
  if (!isRoomAvailable) {
    console.warn('Room Storage is only available on Android');
    return false;
  }
  
  try {
    const result = await RoomStorage.deleteAllSubscriptions();
    return result;
  } catch (error) {
    console.error('Error deleting all subscriptions from Room:', error);
    return false;
  }
}

export interface SplitBillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface SplitBillPerson {
  id: string;
  name: string;
}

export interface SplitBillAssignment {
  itemId: string;
  personId: string;
}

export interface SplitBill {
  id: string;
  title: string;
  items: SplitBillItem[];
  persons: SplitBillPerson[];
  assignments: SplitBillAssignment[];
  taxPercentage: number;
  servicePercentage: number;
  subtotal: number;
  total: number;
  createdAt: string;
}

// Split Bill operations
export async function getAllSplitBills(): Promise<SplitBill[]> {
  if (!isRoomAvailable) {
    console.warn('Room Storage is only available on Android');
    return [];
  }
  
  try {
    const splitBills = await RoomStorage.getAllSplitBills();
    // Parse JSON strings back to objects
    return (splitBills || []).map((sb: any) => ({
      id: sb.id,
      title: sb.title,
      taxPercentage: sb.taxPercentage,
      servicePercentage: sb.servicePercentage,
      subtotal: sb.subtotal,
      total: sb.total,
      createdAt: sb.createdAt,
      items: JSON.parse(sb.itemsJson),
      persons: JSON.parse(sb.personsJson),
      assignments: JSON.parse(sb.assignmentsJson),
    }));
  } catch (error) {
    console.error('Error getting split bills from Room:', error);
    return [];
  }
}

export async function getSplitBillById(id: string): Promise<SplitBill | null> {
  if (!isRoomAvailable) {
    console.warn('Room Storage is only available on Android');
    return null;
  }
  
  try {
    const sb = await RoomStorage.getSplitBillById(id);
    if (!sb) return null;
    
    // Parse JSON strings back to objects
    return {
      id: sb.id,
      title: sb.title,
      taxPercentage: sb.taxPercentage,
      servicePercentage: sb.servicePercentage,
      subtotal: sb.subtotal,
      total: sb.total,
      createdAt: sb.createdAt,
      items: JSON.parse(sb.itemsJson),
      persons: JSON.parse(sb.personsJson),
      assignments: JSON.parse(sb.assignmentsJson),
    };
  } catch (error) {
    console.error('Error getting split bill from Room:', error);
    return null;
  }
}

export async function addSplitBill(
  splitBill: Omit<SplitBill, 'id' | 'createdAt'>
): Promise<SplitBill | null> {
  if (!isRoomAvailable) {
    console.warn('Room Storage is only available on Android');
    return null;
  }
  
  try {
    // Convert arrays to JSON strings
    const splitBillData = {
      title: splitBill.title,
      taxPercentage: splitBill.taxPercentage,
      servicePercentage: splitBill.servicePercentage,
      subtotal: splitBill.subtotal,
      total: splitBill.total,
      itemsJson: JSON.stringify(splitBill.items),
      personsJson: JSON.stringify(splitBill.persons),
      assignmentsJson: JSON.stringify(splitBill.assignments),
    };
    
    const result = await RoomStorage.addSplitBill(splitBillData);
    if (!result) return null;
    
    // Parse JSON strings back to objects
    return {
      id: result.id,
      title: result.title,
      taxPercentage: result.taxPercentage,
      servicePercentage: result.servicePercentage,
      subtotal: result.subtotal,
      total: result.total,
      createdAt: result.createdAt,
      items: JSON.parse(result.itemsJson),
      persons: JSON.parse(result.personsJson),
      assignments: JSON.parse(result.assignmentsJson),
    };
  } catch (error) {
    console.error('Error adding split bill to Room:', error);
    return null;
  }
}

export async function deleteSplitBill(id: string): Promise<boolean> {
  if (!isRoomAvailable) {
    console.warn('Room Storage is only available on Android');
    return false;
  }
  
  try {
    const result = await RoomStorage.deleteSplitBill(id);
    return result;
  } catch (error) {
    console.error('Error deleting split bill from Room:', error);
    return false;
  }
}

export async function deleteAllSplitBills(): Promise<boolean> {
  if (!isRoomAvailable) {
    console.warn('Room Storage is only available on Android');
    return false;
  }
  
  try {
    const result = await RoomStorage.deleteAllSplitBills();
    return result;
  } catch (error) {
    console.error('Error deleting all split bills from Room:', error);
    return false;
  }
}
