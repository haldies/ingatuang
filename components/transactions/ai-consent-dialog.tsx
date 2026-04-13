import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
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
      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.title}>
          Syarat & Ketentuan
        </Text>
        <Text style={styles.subtitle}>
          Selamat datang di IngatUang
        </Text>

        {/* Content */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <Text style={styles.description}>
            Sebelum Anda menggunakan layanan kami untuk mencatat keuangan pribadi, mohon luangkan waktu untuk membaca Syarat & Ketentuan serta Kebijakan Privasi dasar aplikasi ini.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Privasi & Penyimpanan Data</Text>
            <Text style={styles.sectionContent}>
              • Secara default, semua data transaksi keuangan Anda disimpan <Text style={styles.boldText}>secara lokal</Text> di perangkat Anda.{"\n"}
              • Kami tidak dapat mengakses, melihat, atau membagikan catatan keuangan pribadi Anda ke pihak ketiga mana pun tanpa izin eksplisit (misal: saat sinkronisasi cloud).
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Tanggung Jawab Pengguna</Text>
            <Text style={styles.sectionContent}>
              • IngatUang adalah alat pencatatan finansial pribadi. Kami tidak memberikan saran finansial, investasi, atau akuntansi resmi.{"\n"}
              • Keakuratan data yang dimasukkan sepenuhnya adalah tanggung jawab Anda.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Keamanan Perangkat</Text>
            <Text style={styles.sectionContent}>
              • Keamanan data yang disimpan bergantung pada keamanan perangkat keras Anda (seperti PIN, sidik jari, atau FaceID bawaan OS Anda). Pastikan untuk selalu melengkapi perangkat Anda dengan keamanan.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Peningkatan Layanan</Text>
            <Text style={styles.sectionContent}>
              • Aplikasi mungkin secara otomatis mengumpulkan log error (*crash report*) anonim yang _tidak memuat identitas atau data keuangan_ Anda. Data ini semata-mata digunakan developer untuk memperbaiki *bug* dan stabilitas sistem.
            </Text>
          </View>
        </ScrollView>

        {/* Footer Area / Action */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setIsChecked(!isChecked)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.checkbox, 
              isChecked ? styles.checkboxChecked : styles.checkboxUnchecked
            ]}>
              {isChecked && <View style={styles.checkboxInner} />}
            </View>
            <Text style={styles.checkboxLabel}>
              Saya telah membaca dan menyetujui Ketentuan Layanan & Privasi IngatUang
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              isChecked ? styles.buttonEnabled : styles.buttonDisabled
            ]}
            onPress={onAccept}
            disabled={!isChecked}
          >
            <Text style={[
              styles.buttonText,
              isChecked ? styles.buttonTextEnabled : styles.buttonTextDisabled
            ]}>
              Mulai Gunakan IngatUang
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827', // gray-900
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#3b82f6', // blue-500
    marginBottom: 32,
  },
  scrollView: {
    flex: 1,
  },
  description: {
    fontSize: 15,
    color: '#4b5563', // gray-600
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'left',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827', // gray-900
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: '#6b7280', // gray-500
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '700',
    color: '#374151', // gray-700
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6', // gray-100
    backgroundColor: '#fff',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxUnchecked: {
    borderColor: '#d1d5db', // gray-300
  },
  checkboxChecked: {
    borderColor: '#3b82f6', // blue-500
    backgroundColor: '#3b82f6',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151', // gray-700
    fontWeight: '500',
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  button: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  buttonEnabled: {
    backgroundColor: '#3b82f6',
    ...Platform.select({
      ios: {
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonDisabled: {
    backgroundColor: '#e2e8f0', // slate-200
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextEnabled: {
    color: '#fff',
  },
  buttonTextDisabled: {
    color: '#94a3b8', // slate-400
  },
});
