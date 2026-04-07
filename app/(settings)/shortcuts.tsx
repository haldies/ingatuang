import { Platform } from 'react-native';
import ShortcutsIos from '@/app/(settings)/shortcuts.ios';
import ShortcutsAndroid from '@/app/(settings)/shortcuts.android';

/**
 * Unified Shortcut/Widget Route Bridge
 * Expo Router requires a base file when using platform extensions in the app directory.
 * This dynamically serves the correct screen based on the user's OS.
 */
export default function ShortcutsScreen() {
  const Screen = Platform.select({
    ios: ShortcutsIos,
    android: ShortcutsAndroid,
    default: ShortcutsAndroid,
  });

  return <Screen />;
}
