import { Platform } from 'react-native';
import { useShortcutSync as useShortcutSyncIos } from '@/lib/hooks/use-shortcut-sync.ios';
import { useShortcutSync as useShortcutSyncAndroid } from '@/lib/hooks/use-shortcut-sync.android';

/**
 * Unified Shortcut Sync Hook
 * Automatically chooses the correct platform implementation.
 * 
 * iOS: Processes background Siri Shortcut JSON queues.
 * Android: Does nothing (Widgets process data separately).
 */
export const useShortcutSync = Platform.select({
  ios: useShortcutSyncIos,
  default: useShortcutSyncAndroid,
}) as () => void;
