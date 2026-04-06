import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { BaseModal } from './base-modal';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  onClose?: () => void;
}

export function CustomAlert({
  visible,
  title,
  message,
  type = 'info',
  buttons = [{ text: 'OK', style: 'default' }],
  onClose,
}: CustomAlertProps) {
  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return { 
          name: 'checkmark-outline' as const, 
          color: '#10b981', 
          bgClass: 'bg-emerald-50', 
          borderClass: 'border-emerald-100' 
        };
      case 'error':
        return { 
          name: 'alert-circle-outline' as const, 
          color: '#ef4444', 
          bgClass: 'bg-red-50', 
          borderClass: 'border-red-100' 
        };
      case 'warning':
        return { 
          name: 'warning-outline' as const, 
          color: '#f59e0b', 
          bgClass: 'bg-amber-50', 
          borderClass: 'border-amber-100' 
        };
      default:
        return { 
          name: 'information-circle-outline' as const, 
          color: Colors.light.tint, 
          bgClass: 'bg-blue-50', 
          borderClass: 'border-blue-100' 
        };
    }
  };

  const icon = getIconConfig();

  const handleButtonPress = (button: typeof buttons[0]) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <BaseModal
      visible={visible}
      onClose={onClose || (() => {})}
      overlayClassName="flex-1 bg-slate-900/40 justify-center items-center p-6"
      containerClassName="w-full max-w-[320px]"
    >
      <View className="bg-white rounded-[24px] px-5 pt-6 pb-5 items-center shadow-2xl elevation-10">
        <View className="mb-5">
          <View className={`w-16 h-16 rounded-full justify-center items-center border ${icon.bgClass} ${icon.borderClass}`}>
            <Ionicons name={icon.name} size={32} color={icon.color} />
          </View>
        </View>

        <Text className="text-xl font-extrabold text-gray-900 text-center mb-2 tracking-tighter">{title}</Text>
        <Text className="text-[15px] text-slate-500 text-center leading-[22px] mb-5">{message}</Text>

        <View className={`flex-row gap-2.5 w-full ${buttons.length > 2 ? 'flex-col' : ''}`}>
          {buttons.map((button, index) => {
            let buttonClass = "flex-1 py-3.5 px-4 rounded-2xl items-center justify-center";
            let textClass = "text-[15px] font-bold";

            if (button.style === 'cancel') {
              buttonClass += " bg-slate-100";
              textClass += " text-slate-500";
            } else if (button.style === 'destructive') {
              buttonClass += " bg-red-500";
              textClass += " text-white";
            } else {
              buttonClass += " bg-blue-500";
              textClass += " text-white";
            }

            return (
              <TouchableOpacity
                key={index}
                className={buttonClass}
                onPress={() => handleButtonPress(button)}
                activeOpacity={0.8}
              >
                <Text className={textClass}>{button.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </BaseModal>
  );
}
