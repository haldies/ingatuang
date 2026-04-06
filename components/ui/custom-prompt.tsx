import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BaseModal } from './base-modal';

interface CustomPromptProps {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function CustomPrompt({
  visible,
  title,
  message,
  placeholder = '',
  defaultValue = '',
  onConfirm,
  onCancel,
}: CustomPromptProps) {
  const [value, setValue] = useState(defaultValue);

  const handleConfirm = () => {
    onConfirm(value);
    setValue('');
  };

  const handleCancel = () => {
    onCancel();
    setValue(defaultValue);
  };

  return (
    <BaseModal
      visible={visible}
      onClose={handleCancel}
      containerClassName="w-full max-w-[340px]"
    >
      <View className="bg-white rounded-[20px] p-6 shadow-2xl elevation-10">
        {/* Icon */}
        <View className="w-14 h-14 rounded-full bg-blue-50 justify-center items-center self-center mb-4">
          <Ionicons name="create-outline" size={32} color="#3b82f6" />
        </View>

        {/* Title */}
        <Text className="text-xl font-bold text-gray-900 mb-2 text-center">{title}</Text>

        {/* Message */}
        {message && <Text className="text-sm text-gray-500 text-center mb-4">{message}</Text>}

        {/* Input */}
        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] text-gray-900 mb-5"
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          autoFocus={true}
          onSubmitEditing={handleConfirm}
        />

        {/* Buttons */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 py-3.5 rounded-xl items-center bg-gray-100"
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text className="text-base font-semibold text-gray-500">Batal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 py-3.5 rounded-xl items-center bg-blue-500"
            onPress={handleConfirm}
            activeOpacity={0.7}
          >
            <Text className="text-base font-semibold text-white">Simpan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BaseModal>
  );
}
