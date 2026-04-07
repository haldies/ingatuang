import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getRadius } from '@/constants/theme';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  transparent?: boolean;
  hideBack?: boolean;
}

export const Header = ({ title, onBack, rightAction, transparent, hideBack }: HeaderProps) => {
  const router = useRouter();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, transparent && styles.transparent]}>
      {!hideBack && (
        <TouchableOpacity onPress={handleBack} style={[styles.backBtn, { borderRadius: getRadius(40) }]} activeOpacity={0.7}>
          <Feather name="chevron-left" size={24} color={transparent ? '#fff' : '#0f172a'} />
        </TouchableOpacity>
      )}
      
      <Text style={[
        styles.title, 
        transparent && styles.transparentTitle,
        hideBack && { marginLeft: 0 }
      ]} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.rightAction}>
        {rightAction}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  transparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -4,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginLeft: 8,
    letterSpacing: -0.5,
  },
  transparentTitle: {
    color: '#fff',
  },
  rightAction: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
});
