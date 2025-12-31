// This screen is never shown - the tab press is intercepted in _layout.tsx
// to show the add menu modal instead
import { View } from 'react-native';

export default function AddScreen() {
  return <View style={{ flex: 1, backgroundColor: '#f9fafb' }} />;
}
