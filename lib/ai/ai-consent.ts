import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AI_CONSENT_KEY = '@ingat_uang:ai_consent';
const { RoomStorage } = NativeModules;

// Check if we should use Room Database (Android only)
const useRoom = Platform.OS === 'android' && RoomStorage != null;

export interface AIConsent {
  hasShownDialog: boolean;
  hasAccepted: boolean;
  timestamp: string;
}

// Check if user has seen the consent dialog
export async function hasShownAIConsent(): Promise<boolean> {
  try {
    if (useRoom) {
      const consent = await RoomStorage.getAIConsent();
      return consent?.hasShownDialog ?? false;
    }
    
    const data = await AsyncStorage.getItem(AI_CONSENT_KEY);
    if (!data) return false;
    const consent: AIConsent = JSON.parse(data);
    return consent.hasShownDialog;
  } catch (error) {
    console.error('Error checking AI consent:', error);
    return false;
  }
}

// Get AI consent status
export async function getAIConsent(): Promise<AIConsent | null> {
  try {
    if (useRoom) {
      const consent = await RoomStorage.getAIConsent();
      return consent;
    }
    
    const data = await AsyncStorage.getItem(AI_CONSENT_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting AI consent:', error);
    return null;
  }
}

// Save AI consent
export async function saveAIConsent(hasAccepted: boolean): Promise<void> {
  try {
    if (useRoom) {
      await RoomStorage.saveAIConsent(hasAccepted);
      return;
    }
    
    const consent: AIConsent = {
      hasShownDialog: true,
      hasAccepted,
      timestamp: new Date().toISOString(),
    };
    await AsyncStorage.setItem(AI_CONSENT_KEY, JSON.stringify(consent));
  } catch (error) {
    console.error('Error saving AI consent:', error);
    throw error;
  }
}

// Check if user has accepted AI consent
export async function hasAcceptedAIConsent(): Promise<boolean> {
  try {
    const consent = await getAIConsent();
    return consent?.hasAccepted ?? false;
  } catch (error) {
    console.error('Error checking AI consent acceptance:', error);
    return false;
  }
}

// Reset AI consent (for testing or settings)
export async function resetAIConsent(): Promise<void> {
  try {
    if (useRoom) {
      await RoomStorage.resetAIConsent();
      return;
    }
    
    await AsyncStorage.removeItem(AI_CONSENT_KEY);
  } catch (error) {
    console.error('Error resetting AI consent:', error);
    throw error;
  }
}
