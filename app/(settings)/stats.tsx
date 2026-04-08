import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  useColorScheme as useNativeColorScheme,
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
  const colorScheme = useNativeColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

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
    <ScreenWrapper backgroundColor={theme.background}>
      <Header title="Statistik & Laporan" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[
          styles.mainCard, 
          { 
            backgroundColor: isDark ? '#171717' : '#fff',
            borderColor: isDark ? '#262626' : '#f1f5f9',
            borderRadius: getRadius(180, 'large') 
          }
        ]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { borderRadius: getRadius(56), backgroundColor: theme.tint + '15' }]}>
              <Ionicons name="bar-chart" size={24} color={theme.tint} />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Laporan Finansial</Text>
              <Text style={[styles.cardSubtitle, { color: isDark ? '#94A3B8' : '#64748b' }]}>Terima statistik lengkap kamu dalam format yang mudah dibaca.</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>PERIODE ANALISA</Text>
            <TouchableOpacity 
              style={[
                styles.dropdown, 
                { 
                  backgroundColor: isDark ? '#1a1a1a' : '#fff',
                  borderColor: isDark ? '#262626' : '#f1f5f9',
                  borderRadius: getRadius(64) 
                }
              ]} 
              onPress={() => setShowPeriodDropdown(!showPeriodDropdown)}
            >
              <Text style={[styles.dropdownText, { color: theme.text }]}>
                {PERIOD_OPTIONS.find(opt => opt.value === period)?.label || 'Pilih periode'}
              </Text>
              <Ionicons name={showPeriodDropdown ? "chevron-up" : "chevron-down"} size={20} color="#94a3b8" />
            </TouchableOpacity>
            
            {showPeriodDropdown && (
              <View style={[
                styles.dropdownMenu, 
                { 
                  backgroundColor: isDark ? '#1a1a1a' : '#fff',
                  borderColor: isDark ? '#262626' : '#f1f5f9',
                  borderRadius: getRadius(120) 
                }
              ]}>
                {PERIOD_OPTIONS.map((option) => (
                  <TouchableOpacity 
                    key={option.value} 
                    style={[
                      styles.dropdownItem, 
                      { borderBottomColor: isDark ? '#262626' : '#f1f5f9' },
                      period === option.value && (isDark ? { backgroundColor: theme.tint + '15' } : styles.dropdownActive)
                    ]} 
                    onPress={() => { setPeriod(option.value as ExportPeriod); setShowPeriodDropdown(false); }}
                  >
                    <Text style={[styles.itemText, { color: isDark ? '#94A3B8' : '#475569' }, period === option.value && { color: theme.tint, fontWeight: '800' }]}>{option.label}</Text>
                    {period === option.value && <Ionicons name="checkmark-circle" size={20} color={theme.tint} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {period === 'custom' && (
            <View style={styles.section}>
              <Text style={styles.label}>PILIH RENTANG KUSTOM</Text>
              <TouchableOpacity 
                style={[
                  styles.dropdown, 
                  { 
                    backgroundColor: isDark ? '#1a1a1a' : '#fff',
                    borderColor: isDark ? '#262626' : '#f1f5f9',
                    borderRadius: getRadius(64) 
                  }
                ]} 
                onPress={() => setShowCalendar(true)}
              >
                <Text style={[styles.dropdownText, !customDate && { color: '#94a3b8' }, customDate && { color: theme.text }]}>
                  {customDate ? customDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : 'Ketuk untuk pilih...'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            style={[
              styles.exportBtn, 
              { 
                borderRadius: getRadius(64), 
                backgroundColor: theme.tint 
              }, 
              (isExporting || (period === 'custom' && !customDate)) && { opacity: 0.5 }
            ]} 
            onPress={handleExport} 
            disabled={isExporting || (period === 'custom' && !customDate)}
          >
            <Ionicons name={isExporting ? 'sync-outline' : 'stats-chart-outline'} size={20} color="#fff" />
            <Text style={styles.exportBtnText}>{isExporting ? 'Memproses...' : 'BUAT LAPORAN SEKARANG'}</Text>
          </TouchableOpacity>
        </View>

        <View style={[
          styles.infoBox, 
          { 
            borderRadius: getRadius(100),
            backgroundColor: isDark ? '#064e3b20' : '#f0fdfa',
            borderColor: isDark ? '#065f46' : '#ccfbf1'
          }
        ]}>
           <Ionicons name="shield-checkmark" size={20} color={isDark ? '#10b981' : '#059669'} />
           <Text style={[styles.infoText, { color: isDark ? '#10b981' : '#0f766e' }]}>Analisa statistik dilakukan secara privat di dalam sistem kita tanpa mengirimkan data ke cloud.</Text>
        </View>
      </ScrollView>

      <Modal visible={showCalendar} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowCalendar(false)}>
          <View style={[styles.calendarSheet, { backgroundColor: isDark ? '#171717' : '#fff', borderRadius: getRadius(120) }]}>
            <Calendar 
              onDayPress={(day: any) => { setCustomDate(new Date(day.dateString)); setShowCalendar(false); }} 
              theme={{ 
                calendarBackground: isDark ? '#171717' : '#fff',
                textSectionTitleColor: isDark ? '#94A3B8' : '#b6c1cd',
                dayTextColor: isDark ? '#fff' : '#2d4150',
                todayTextColor: theme.tint, 
                selectedDayBackgroundColor: theme.tint, 
                arrowColor: theme.tint,
                monthTextColor: isDark ? '#fff' : '#2d4150',
                textDisabledColor: isDark ? '#404040' : '#d9e1e8',
              }} 
            />
          </View>
        </Pressable>
      </Modal>

      <CustomAlert visible={alertVisible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} buttons={alertConfig.buttons} onClose={() => setAlertVisible(false)} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 10 },
  mainCard: { 
    padding: 24, 
    borderWidth: 1, 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 10 
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  iconBox: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '900' },
  cardSubtitle: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  section: { marginBottom: 24 },
  label: { fontSize: 10, fontWeight: '800', color: '#94a3b8', marginBottom: 12, letterSpacing: 1 },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1 },
  dropdownText: { fontSize: 14, fontWeight: '800' },
  dropdownMenu: { marginTop: 8, borderWidth: 1, overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  dropdownActive: { backgroundColor: Colors.light.tint + '08' },
  itemText: { fontSize: 14, fontWeight: '600' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, marginTop: 12 },
  exportBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  infoBox: { marginTop: 32, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1 },
  infoText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 18 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  calendarSheet: { padding: 16, overflow: 'hidden' },
});
