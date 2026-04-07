import { useEffect } from 'react';
import { useGlobalSearchParams, useRouter } from 'expo-router';

interface DeepLinkConfig {
  onQuickAdd: (text: string) => void;
  onManualAdd: () => void;
}

/**
 * Hook to centralize deep link handling for Shortcuts and Widgets
 */
export function useDeepLinkHandler({ onQuickAdd, onManualAdd }: DeepLinkConfig) {
  const params = useGlobalSearchParams();
  const router = useRouter();
  
  useEffect(() => {
    // 1. Handle Quick Add (AI) shortcut
    if (params.quickAdd === 'true' && params.text) {
      const text = params.text as string;
      
      // Clear params immediately to prevent re-triggering on re-renders
      router.setParams({ quickAdd: undefined, text: undefined });
      
      onQuickAdd(text);
    } 
    // 2. Handle Manual Add shortcut
    else if (params.manualAdd === 'true') {
      // Clear params immediately
      router.setParams({ manualAdd: undefined });
      
      onManualAdd();
    }
  }, [params, onQuickAdd, onManualAdd, router]);
}
