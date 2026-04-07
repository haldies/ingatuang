import { Modal, View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import React from 'react';

interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  containerClassName?: string;
  overlayClassName?: string;
  style?: ViewStyle;
  overlayStyle?: ViewStyle;
  animationType?: 'fade' | 'slide' | 'none';
  statusBarTranslucent?: boolean;
}

export function BaseModal({
  visible,
  onClose,
  children,
  containerClassName = "",
  overlayClassName = "",
  style,
  overlayStyle,
  animationType = "fade",
  statusBarTranslucent = true,
}: BaseModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
      statusBarTranslucent={statusBarTranslucent}
    >
      <View style={styles.flex}>
        <Pressable 
          className={overlayClassName}
          style={[styles.overlay, overlayStyle, !overlayClassName && !overlayStyle && styles.defaultOverlay]} 
          onPress={onClose}
        >
          <Pressable 
            className={containerClassName}
            style={[styles.container, style, !containerClassName && !style && styles.defaultContainer]}
            onPress={(e) => e.stopPropagation()}
          >
            {children}
          </Pressable>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    overflow: 'hidden',
  },
  defaultOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  defaultContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
  }
});
