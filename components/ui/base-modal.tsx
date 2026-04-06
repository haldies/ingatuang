import { Modal, View, Pressable } from 'react-native';
import React from 'react';

interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  containerClassName?: string;
  overlayClassName?: string;
  animationType?: 'fade' | 'slide' | 'none';
  statusBarTranslucent?: boolean;
}

export function BaseModal({
  visible,
  onClose,
  children,
  containerClassName = "w-full max-w-[340px]",
  overlayClassName = "flex-1 bg-black/50 justify-center items-center px-5",
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
      <View className="flex-1">
        <Pressable 
          className={overlayClassName} 
          onPress={onClose}
        >
          <Pressable 
            className={containerClassName} 
            onPress={(e) => e.stopPropagation()}
          >
            {children}
          </Pressable>
        </Pressable>
      </View>
    </Modal>
  );
}
