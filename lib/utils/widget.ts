import { NativeModules, Platform } from 'react-native';

const { WidgetModule } = NativeModules;

export interface WidgetData {
  balance: number;
  income: number;
  expense: number;
  month?: string;
}

export async function updateWidget(data: WidgetData) {
  try {
    if (Platform.OS === 'android') {
      if (!WidgetModule || !WidgetModule.updateWidget) {
        console.log('[WIDGET-ANDROID] Module not available');
        return;
      }
      await WidgetModule.updateWidget(data);
      console.log('[WIDGET-ANDROID] Updated successfully');
    } else if (Platform.OS === 'ios') {
      // iOS Widget update logic normally uses shared user defaults or app groups
      // Example: SharedGroup.set('widget_data', JSON.stringify(data))
      console.log('[WIDGET-IOS] Data ready for shared group update');
    }
  } catch (error) {
    console.error(`[WIDGET-${Platform.OS.toUpperCase()}] Update failed:`, error);
  }
}

export async function setWidgetAPIConfig(apiUrl: string, apiKey: string) {
  try {
    if (Platform.OS === 'android') {
      if (!WidgetModule || !WidgetModule.setAPIConfig) {
        console.log('[WIDGET-ANDROID] Module not available');
        return;
      }
      await WidgetModule.setAPIConfig(apiUrl, apiKey);
      console.log('[WIDGET-ANDROID] API config saved');
    } else if (Platform.OS === 'ios') {
      // iOS logic for API config if needed
      console.log('[WIDGET-IOS] API config ready for secure storage');
    }
  } catch (error) {
    console.error(`[WIDGET-${Platform.OS.toUpperCase()}] Failed to save API config:`, error);
  }
}
