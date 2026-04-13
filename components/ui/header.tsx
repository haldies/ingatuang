import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme as useNativeColorScheme,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, getRadius } from '@/constants/theme';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightPress?: () => void;
  transparent?: boolean;
  hideBack?: boolean;
  tintColor?: string;
}

export const Header = ({ 
  title, 
  onBack, 
  rightAction, 
  rightIcon,
  onRightPress,
  transparent, 
  hideBack,
  tintColor
}: HeaderProps) => {
  const router = useRouter();
  const colorScheme = useNativeColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const headerTintColor = tintColor || (transparent ? (isDark ? '#fff' : '#0F172A') : theme.text);

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: transparent ? 'transparent' : theme.background,
        borderBottomColor: isDark ? '#262626' : '#f1f5f9',
        borderBottomWidth: transparent ? 0 : 1
      }
    ]}>
      {!hideBack ? (
        <TouchableOpacity 
          onPress={handleBack} 
          style={[styles.backBtn, { borderRadius: getRadius(40) }]} 
          activeOpacity={0.7}
        >
          <Feather 
            name="chevron-left" 
            size={24} 
            color={headerTintColor} 
          />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 8 }} />
      )}
      
      <Text style={[
        styles.title, 
        { color: headerTintColor },
      ]} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.rightAction}>
        {rightAction ? rightAction : (
          rightIcon && (
            <TouchableOpacity 
              onPress={onRightPress} 
              style={[styles.backBtn, { borderRadius: getRadius(40) }]}
              activeOpacity={0.7}
            >
              <Feather 
                name={rightIcon} 
                size={22} 
                color={theme.tint} 
              />
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );
};

const isDark = (useNativeColorScheme() ?? 'light') === 'dark';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 8,
    letterSpacing: -0.5,
  },
  rightAction: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
});
