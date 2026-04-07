import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/ui/header';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { exportTransactions, type ExportPeriod } from '@/lib/utils/export';
import { Calendar } from 'react-native-calendars';
import { CustomAlert } from '@/components/ui/custom-alert';
import { Colors, getRadius } from '@/constants/theme';

const PERIOD_OPTIONS = [
  { value: 'current-month', label: 'Bulan Ini' },
  { value: 'last-3-months', label: '3 Bulan Terakhir' },
  { value: 'last-6-months', label: '6 Bulan Terakhir' },
  { value: 'last-year', label: '1 Tahun Terakhir' },
  { value: 'custom', label: 'Kustom' },
  { value: 'all', label: 'Semua Data' },
] as const;

export default function StatsReportScreen() {
  const [isExporting, setIsExporting] = useState(false);
  const [period, setPeriod] = useState<ExportPeriod>('current-month');
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>;
  }>({ title: '', message: '', type: 'info', buttons: [{ text: 'OK', style: 'default' }] });

  const handleExport = async () => {
    if (period === 'custom' && !customDate) {
      setAlertConfig({ title: 'Pilih Rentang', message: 'Silakan pilih rentang waktu secara spesifik.', type: 'warning' });
      setAlertVisible(true);
      return;
    }
    setIsExporting(true);
    try {
      const result = await exportTransactions(period, customDate);
      setAlertConfig({ title: result.success ? 'Berhasil' : 'Gagal', message: result.message, type: result.success ? 'success' : 'error' });
      setAlertVisible(true);
    } catch (error) {
      setAlertConfig({ title: 'Error', message: 'Gagal memproses data laporan.', type: 'error' });
      setAlertVisible(true);
    } finally { setIsExporting(false); }
  };

  return (
    <ScreenWrapper backgroundColor="#fff">
      <Header title="Statistik & Laporan" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.mainCard, { borderRadius: getRadius(180, 'large') }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { borderRadius: getRadius(56), backgroundColor: Colors.light.tint + '15' }]}>
              <Ionicons name="bar-chart" size={24} color={Colors.light.tint} />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.cardTitle}>Laporan Finansial</Text>
              <Text style={styles.cardSubtitle}>Terima statistik lengkap kamu dalam format yang mudah dibaca.</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>PERIODE ANALISA</Text>
            <TouchableOpacity style={[styles.dropdown, { borderRadius: getRadius(64) }]} onPress={() => setShowPeriodDropdown(!showPeriodDropdown)}>
              <Text style={styles.dropdownText}>{PERIOD_OPTIONS.find(opt => opt.value === period)?.label || 'Pilih periode'}</Text>
              <Ionicons name={showPeriodDropdown ? "chevron-up" : "chevron-down"} size={20} color="#94a3b8" />
            </TouchableOpacity>
            
            {showPeriodDropdown && (
              <View style={[styles.dropdownMenu, { borderRadius: getRadius(120) }]}>
                {PERIOD_OPTIONS.map((option) => (
                  <TouchableOpacity key={option.value} style={[styles.dropdownItem, period === option.value && styles.dropdownActive]} onPress={() => { setPeriod(option.value as ExportPeriod); setShowPeriodDropdown(false); }}>
                    <Text style={[styles.itemText, period === option.value && { color: Colors.light.tint, fontWeight: '800' }]}>{option.label}</Text>
                    {period === option.value && <Ionicons name="checkmark-circle" size={20} color={Colors.light.tint} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {period === 'custom' && (
            <View style={styles.section}>
              <Text style={styles.label}>PILIH RENTANG KUSTOM</Text>
              <TouchableOpacity style={[styles.dropdown, { borderRadius: getRadius(64) }]} onPress={() => setShowCalendar(true)}>
                <Text style={[styles.dropdownText, !customDate && { color: '#94a3b8' }]}>
                  {customDate ? customDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : 'Ketuk untuk pilih...'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={[styles.exportBtn, { borderRadius: getRadius(64), backgroundColor: Colors.light.tint }, (isExporting || (period === 'custom' && !customDate)) && { opacity: 0.5 }]} onPress={handleExport} disabled={isExporting || (period === 'custom' && !customDate)}>
            <Ionicons name={isExporting ? 'sync-outline' : 'stats-chart-outline'} size={20} color="#fff" />
            <Text style={styles.exportBtnText}>{isExporting ? 'Memproses...' : 'BUAT LAPORAN SEKARANG'}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoBox, { borderRadius: getRadius(100) }]}>
           <Ionicons name="shield-checkmark" size={20} color="#059669" />
           <Text style={styles.infoText}>Analisa statistik dilakukan secara privat di dalam sistem kita tanpa mengirimkan data ke cloud.</Text>
        </View>
      </ScrollView>

      <Modal visible={showCalendar} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowCalendar(false)}>
          <View style={[styles.calendarSheet, { borderRadius: getRadius(120) }]}>
            <Calendar onDayPress={(day: any) => { setCustomDate(new Date(day.dateString)); setShowCalendar(false); }} theme={{ todayTextColor: Colors.light.tint, selectedDayBackgroundColor: Colors.light.tint, arrowColor: Colors.light.tint }} />
          </View>
        </Pressable>
      </Modal>

      <CustomAlert visible={alertVisible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} buttons={alertConfig.buttons} onClose={() => setAlertVisible(false)} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 10 },
  mainCard: { backgroundColor: '#fff', padding: 24, borderWidth: 1, borderColor: '#f1f5f9', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  iconBox: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  cardSubtitle: { fontSize: 13, color: '#64748b', fontWeight: '500', marginTop: 2 },
  section: { marginBottom: 24 },
  label: { fontSize: 10, fontWeight: '800', color: '#94a3b8', marginBottom: 12, letterSpacing: 1 },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9' },
  dropdownText: { fontSize: 14, color: '#1e293b', fontWeight: '800' },
  dropdownMenu: { marginTop: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownActive: { backgroundColor: Colors.light.tint + '08' },
  itemText: { fontSize: 14, color: '#475569', fontWeight: '600' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, marginTop: 12 },
  exportBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  infoBox: { marginTop: 32, padding: 20, backgroundColor: '#f0fdfa', flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#ccfbf1' },
  infoText: { flex: 1, fontSize: 12, color: '#0f766e', fontWeight: '600', lineHeight: 18 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  calendarSheet: { backgroundColor: '#fff', padding: 16, overflow: 'hidden' },
});
