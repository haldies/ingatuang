import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * Redirects to the main Split Bill index (Coming Soon)
 * This prevents users from accessing old/incomplete routes directly.
 */
export default function SplitBillDetailRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/split-bill');
  }, []);

  return null;
}
