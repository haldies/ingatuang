import { NativeModules, Platform } from 'react-native';

const { WidgetModule } = NativeModules;

export async function updateWidget(data: {
  balance: number;
  income: number;
  expense: number;
  month?: string;
}) {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    if (!WidgetModule || !WidgetModule.updateWidget) {
      console.log('[WIDGET] Module not available');
      return;
    }
    await WidgetModule.updateWidget(data);
    console.log('[WIDGET] Updated successfully');
  } catch (error) {
    console.error('[WIDGET] Update failed:', error);
  }
}

export async function setWidgetAPIConfig(apiUrl: string, apiKey: string) {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    if (!WidgetModule || !WidgetModule.setAPIConfig) {
      console.log('[WIDGET] Module not available');
      return;
    }
    await WidgetModule.setAPIConfig(apiUrl, apiKey);
    console.log('[WIDGET] API config saved');
  } catch (error) {
    console.error('[WIDGET] Failed to save API config:', error);
  }
}
