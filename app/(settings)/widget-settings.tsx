import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { updateWidget } from '@/lib/utils/widget';
import { CustomAlert } from '@/components/ui/custom-alert';

export default function WidgetSettingsScreen() {
  const router = useRouter();
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'error' | 'warning',
  });

  const showAlert = (title: string, message: string, type: any = 'info') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  const handleSelectWidgetPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Izin Ditolak', 'Maaf, kami butuh izin akses galeri untuk mengganti foto widget.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      try {
        const sourceUri = result.assets[0].uri;
        const targetUri = FileSystem.documentDirectory + 'widget_photo.jpg';
        
        // Copy to internal storage
        await FileSystem.copyAsync({
          from: sourceUri,
          to: targetUri
        });

        // Trigger widget update
        await updateWidget({
          balance: 0,
          income: 0,
          expense: 0
        });

        showAlert('Berhasil', 'Foto widget berhasil diperbarui! Perubahan akan terlihat di Home Screen Anda.', 'success');
      } catch (error) {
        console.error('Error saving widget photo:', error);
        showAlert('Error', 'Gagal menyimpan foto widget.', 'error');
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-800">Widget Settings</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Android Specific Section */}
        {Platform.OS === 'android' && (
          <View className="mt-6 px-4">
            <View className="flex-row items-center gap-2 mb-3 px-1">
              <Ionicons name="images-outline" size={20} color="#64748b" />
              <Text className="text-[13px] font-semibold text-slate-500 uppercase tracking-widest">Foto Widget</Text>
            </View>
            
            <View className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-black/5">
              <TouchableOpacity 
                className="flex-row items-center p-4 gap-4"
                onPress={handleSelectWidgetPhoto}
              >
                <View className="w-9 h-9 rounded-xl bg-slate-50 items-center justify-center">
                  <Feather name="image" size={18} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-slate-800">Ubah Foto Galeri</Text>
                  <Text className="text-xs text-slate-500 mt-0.5">Foto akan muncul di latar belakang widget</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View className="flex-row bg-slate-100 p-3 rounded-xl mt-3 gap-2.5">
              <Ionicons name="information-circle-outline" size={20} color="#64748b" />
              <Text className="flex-1 text-xs leading-[18px] text-slate-600">
                Foto ini akan otomatis terpasang pada semua widget kotak IngatUang di Home Screen Anda.
              </Text>
            </View>
          </View>
        )}

        {/* Info Section */}
        <View className="mt-6 px-4 mb-10">
          <Text className="text-[13px] font-semibold text-slate-500 uppercase tracking-widest mb-3 px-1">Bantuan</Text>
          <View className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-black/5">
            <View className="p-8 items-center justify-center">
              <Ionicons name="help-circle-outline" size={32} color="#9ca3af" />
              <Text className="text-base font-bold text-slate-800 mt-4 text-center">Cara Menambahkan Widget</Text>
              <Text className="text-[13px] text-slate-500 text-center mt-2 leading-5">
                Tahan area kosong di Home Screen HP Anda, pilih "Widgets", cari "IngatUang", lalu tarik widget ke layar.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <CustomAlert 
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
}
