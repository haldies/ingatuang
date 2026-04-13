import React from 'react';
import {
  View,
  StatusBar,
  StyleSheet,
  ViewProps,
  Platform,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

interface ScreenWrapperProps extends ViewProps {
  children: React.ReactNode;
  edges?: Edge[];
  backgroundColor?: string;
  statusBarStyle?: 'light' | 'dark';
}

/**
 * Universal Screen Wrapper for consistent Page Layout & Safe Area Management
 */
export const ScreenWrapper = ({ 
  children, 
  edges = ['top'], 
  backgroundColor,
  statusBarStyle,
  style,
  ...props 
}: ScreenWrapperProps) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  
  const finalBackgroundColor = backgroundColor || theme.background;
  const finalStatusBarStyle = statusBarStyle || (colorScheme === 'dark' ? 'light' : 'dark');

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: finalBackgroundColor }]} 
      edges={edges}
      {...props}
    >
      <StatusBar 
        barStyle={finalStatusBarStyle === 'light' ? 'light-content' : 'dark-content'}
        backgroundColor={Platform.OS === 'android' ? 'transparent' : undefined}
        translucent={true}
      />
      <View style={[styles.content, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
