import { useState, useEffect } from 'react';
import { useColorScheme as useNativeColorScheme, ColorSchemeName } from 'react-native';
import { storage } from '@/lib/storage/storage-adapter';
import { eventEmitter, EVENTS } from '@/lib/utils/events';

/**
 * Custom hook to get the current color scheme.
 * Respects manual settings if configured, otherwise falls back to system theme.
 */
export function useColorScheme(): NonNullable<ColorSchemeName> {
  const nativeScheme = useNativeColorScheme();
  const [scheme, setScheme] = useState<NonNullable<ColorSchemeName>>(nativeScheme ?? 'light');

  useEffect(() => {
    const updateScheme = async () => {
      const mode = await storage.getTheme();
      if (mode === 'system') {
        setScheme(nativeScheme ?? 'light');
      } else {
        setScheme(mode as NonNullable<ColorSchemeName>);
      }
    };

    updateScheme();

    const handler = () => {
      updateScheme();
    };

    eventEmitter.on(EVENTS.THEME_CHANGED, handler);
    return () => {
      eventEmitter.off(EVENTS.THEME_CHANGED, handler);
    };
  }, [nativeScheme]);

  return scheme;
}
