import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '@/constants/theme';
import { BaseModal } from '../ui/base-modal';

interface AIConsentDialogProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function AIConsentDialog({ visible, onAccept, onDecline }: AIConsentDialogProps) {
  const [isChecked, setIsChecked] = React.useState(false);

  return (
    <BaseModal
      visible={visible}
      onClose={onDecline}
      overlayClassName="flex-1 bg-slate-900/40 justify-center items-center p-6"
      containerClassName="bg-white rounded-[32px] p-6 w-full max-w-[500px] max-h-[85%]"
    >
      {/* Title */}
      <Text className="text-[22px] font-extrabold text-gray-900 text-center mb-5 tracking-tighter">
        Fitur Quick Add dengan AI
      </Text>

      {/* Content */}
      <ScrollView 
        className="max-h-[400px]"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[15px] text-gray-600 leading-[22px] mb-5 text-center">
          Fitur Quick Add menggunakan AI untuk membantu Anda menambahkan transaksi dengan cepat dan mudah.
        </Text>

        <View className="mb-5">
          <Text className="text-base font-semibold text-gray-900 mb-2">Apa yang kami lakukan</Text>
          <Text className="text-sm text-gray-500 leading-5">
            • Memproses teks transaksi Anda secara lokal{"\n"}
            • Mendeteksi nominal, kategori, dan deskripsi otomatis{"\n"}
            • Menyimpan transaksi ke database lokal Anda
          </Text>
        </View>

        <View className="mb-5">
          <Text className="text-base font-semibold text-gray-900 mb-2">Privasi Anda</Text>
          <Text className="text-sm text-gray-500 leading-5">
            • Data transaksi Anda tetap di perangkat Anda{"\n"}
            • Kami tidak mengirim data ke server eksternal{"\n"}
            • Anda dapat menghapus data kapan saja
          </Text>
        </View>

        <View className="mb-5">
          <Text className="text-base font-semibold text-gray-900 mb-2">Peningkatan AI</Text>
          <Text className="text-sm text-gray-500 leading-5 mb-1">
            Dengan persetujuan Anda, kami dapat menggunakan data transaksi yang telah dianonimkan untuk:
          </Text>
          <Text className="text-sm text-gray-500 leading-5">
            • Meningkatkan akurasi deteksi kategori{"\n"}
            • Memperbaiki parsing nominal dan deskripsi{"\n"}
            • Mengembangkan fitur AI yang lebih baik
          </Text>
          <Text className="text-[13px] text-gray-400 italic mt-2 leading-[18px]">
             Data yang digunakan akan dianonimkan dan tidak mengandung informasi pribadi Anda.
          </Text>
        </View>
      </ScrollView>

      {/* Consent Checkbox */}
      <TouchableOpacity 
        className="flex-row items-center mt-5 gap-3 px-1"
        onPress={() => setIsChecked(!isChecked)}
        activeOpacity={0.7}
      >
        <View className={`w-[22px] h-[22px] rounded-full border-2 items-center justify-center ${isChecked ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
          {isChecked && <View className="w-2 h-2 rounded-full bg-white" />}
        </View>
        <Text className="text-sm text-gray-600 font-medium">Saya menyetujui ketentuan di atas</Text>
      </TouchableOpacity>

      {/* Buttons */}
      <View className="flex-row gap-3 mt-6">
        <TouchableOpacity
          className="flex-1 py-3.5 rounded-2xl border border-slate-200 items-center justify-center"
          onPress={onDecline}
        >
          <Text className="text-[15px] font-bold text-slate-500">Lewati</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-2xl ${isChecked ? 'bg-blue-500' : 'bg-slate-200'}`}
          onPress={onAccept}
          disabled={!isChecked}
        >
          <Text className="text-[15px] font-bold text-white">Terima</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-[12px] text-gray-400 text-center mt-4 leading-4">
        Anda dapat mengubah preferensi ini kapan saja di Pengaturan
      </Text>
    </BaseModal>
  );
}
