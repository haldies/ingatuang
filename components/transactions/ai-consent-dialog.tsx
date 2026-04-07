import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AIConsentDialogProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function AIConsentDialog({ visible, onAccept, onDecline }: AIConsentDialogProps) {
  const [isChecked, setIsChecked] = React.useState(false);

  if (!visible) return null;

  return (
    <SafeAreaView 
      style={[StyleSheet.absoluteFill, { backgroundColor: '#fff', zIndex: 9999 }]} 
      edges={['top', 'bottom']}
    >
      <View className="flex-1 px-6 pt-12 pb-6 bg-white">
      {/* Title */}
      <Text className="text-[28px] font-extrabold text-gray-900 mb-2 tracking-tighter">
        Syarat & Ketentuan
      </Text>
      <Text className="text-[15px] font-medium text-blue-500 mb-8">
        Selamat datang di IngatUang
      </Text>

      {/* Content */}
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <Text className="text-[15px] text-gray-600 leading-[24px] mb-8 text-left">
          Sebelum Anda menggunakan layanan kami untuk mencatat keuangan pribadi, mohon luangkan waktu untuk membaca Syarat & Ketentuan serta Kebijakan Privasi dasar aplikasi ini.
        </Text>

        <View className="mb-5">
          <Text className="text-base font-semibold text-gray-900 mb-2">1. Privasi & Penyimpanan Data</Text>
          <Text className="text-[14px] text-gray-500 leading-[22px]">
            • Secara default, semua data transaksi keuangan Anda disimpan <Text className="font-bold text-gray-700">secara lokal</Text> di perangkat Anda.{"\n"}
            • Kami tidak dapat mengakses, melihat, atau membagikan catatan keuangan pribadi Anda ke pihak ketiga mana pun tanpa izin eksplisit (misal: saat sinkronisasi cloud).
          </Text>
        </View>

        <View className="mb-5">
          <Text className="text-base font-semibold text-gray-900 mb-2">2. Tanggung Jawab Pengguna</Text>
          <Text className="text-[14px] text-gray-500 leading-[22px]">
            • IngatUang adalah alat pencatatan finansial pribadi. Kami tidak memberikan saran finansial, investasi, atau akuntansi resmi.{"\n"}
            • Keakuratan data yang dimasukkan sepenuhnya adalah tanggung jawab Anda.
          </Text>
        </View>

        <View className="mb-5">
          <Text className="text-base font-semibold text-gray-900 mb-2">3. Keamanan Perangkat</Text>
          <Text className="text-[14px] text-gray-500 leading-[22px]">
            • Keamanan data yang disimpan bergantung pada keamanan perangkat keras Anda (seperti PIN, sidik jari, atau FaceID bawaan OS Anda). Pastikan untuk selalu melengkapi perangkat Anda dengan keamanan.
          </Text>
        </View>

        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">4. Peningkatan Layanan</Text>
          <Text className="text-[14px] text-gray-500 leading-[22px]">
            • Aplikasi mungkin secara otomatis mengumpulkan log error (*crash report*) anonim yang _tidak memuat identitas atau data keuangan_ Anda. Data ini semata-mata digunakan developer untuk memperbaiki *bug* dan stabilitas sistem.
          </Text>
        </View>
      </ScrollView>

      {/* Footer Area / Action */}
      <View className="pt-4 border-t border-gray-100 bg-white">
        <TouchableOpacity 
          className="flex-row items-center mb-6 gap-3 px-1"
          onPress={() => setIsChecked(!isChecked)}
          activeOpacity={0.7}
        >
          <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isChecked ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
            {isChecked && <View className="w-2.5 h-2.5 rounded-full bg-white" />}
          </View>
          <Text className="text-[14px] text-gray-700 font-medium leading-5 pr-4">
            Saya telah membaca dan menyetujui Ketentuan Layanan & Privasi IngatUang
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`w-full flex-row items-center justify-center gap-2 py-4 rounded-2xl ${isChecked ? 'bg-blue-500 shadow-sm shadow-blue-500/30' : 'bg-slate-200'}`}
          onPress={onAccept}
          disabled={!isChecked}
        >
          <Text className={`text-[16px] font-bold ${isChecked ? 'text-white' : 'text-slate-400'}`}>
            Mulai Gunakan IngatUang
          </Text>
        </TouchableOpacity>
      </View>
      </View>
    </SafeAreaView>
  );
}
