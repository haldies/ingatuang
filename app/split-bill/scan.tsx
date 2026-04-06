import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Redirects to the main Split Bill index (Coming Soon)
 * This prevents users from accessing old/incomplete scan functionality directly.
 */
export default function SplitBillScanRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/split-bill');
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="small" color="#1e293b" />
    </View>
  );
}
