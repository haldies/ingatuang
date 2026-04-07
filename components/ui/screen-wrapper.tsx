import React from 'react';
import {
  View,
  StatusBar,
  StyleSheet,
  ViewProps,
  Platform,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

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
  backgroundColor = '#fff',
  statusBarStyle = 'dark',
  style,
  ...props 
}: ScreenWrapperProps) => {
  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor }]} 
      edges={edges}
      {...props}
    >
      <StatusBar 
        barStyle={statusBarStyle === 'light' ? 'light-content' : 'dark-content'}
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
