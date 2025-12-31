import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { exportTransactions, type ExportPeriod } from '@/lib/export';
import { Calendar } from 'react-native-calendars';

const PERIOD_OPTIONS = [
  { value: 'current-month', label: 'Bulan Ini' },
  { value: 'last-3-months', label: '3 Bulan Terakhir' },
  { value: 'last-6-months', label: '6 Bulan Terakhir' },
  { value: 'last-year', label: '1 Tahun Terakhir' },
  { value: 'custom', label: 'Custom' },
  { value: 'all', label: 'Semua Data' },
] as const;

export default function ExportScreen() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [period, setPeriod] = useState<ExportPeriod>('current-month');
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);

  const handleExport = async () => {
    if (period === 'custom' && !customDate) {
      Alert.alert('Pilih Bulan', 'Silakan pilih bulan untuk export data');
      return;
    }

    setIsExporting(true);
    try {
      const result = await exportTransactions(period, customDate);
      
      if (result.success) {
        Alert.alert(
          'Export Berhasil',
          result.message,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Export Gagal', result.message, [{ text: 'OK' }]);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Gagal export data',
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(false);
    }
  };

  const formatCustomDate = () => {
    if (!customDate) return 'Pilih bulan';
    return customDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  const handleDateSelect = (day: any) => {
    const selected = new Date(day.dateString);
    setCustomDate(selected);
    setShowCalendar(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Export Data</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Export Card */}
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="document-text" size={24} color="#3b82f6" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Export Transaksi</Text>
                <Text style={styles.cardSubtitle}>
                  Pilih periode data yang ingin diexport
                </Text>
              </View>
            </View>

            {/* Period Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Periode</Text>
              <View style={styles.periodGrid}>
                {PERIOD_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.periodOption,
                      period === option.value && styles.periodOptionActive,
                    ]}
                    onPress={() => setPeriod(option.value as ExportPeriod)}
                  >
                    <Text
                      style={[
                        styles.periodOptionText,
                        period === option.value && styles.periodOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Custom Date Picker */}
            {period === 'custom' && (
              <View style={styles.section}>
                <Text style={styles.label}>Pilih Bulan</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowCalendar(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                  <Text
                    style={[
                      styles.dateButtonText,
                      !customDate && styles.dateButtonTextPlaceholder,
                    ]}
                  >
                    {formatCustomDate()}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
            )}

            {/* Export Button */}
            <TouchableOpacity
              style={[
                styles.exportButton,
                (isExporting || (period === 'custom' && !customDate)) &&
                  styles.exportButtonDisabled,
              ]}
              onPress={handleExport}
              disabled={isExporting || (period === 'custom' && !customDate)}
            >
              <Ionicons
                name={isExporting ? 'hourglass-outline' : 'download-outline'}
                size={20}
                color="#fff"
              />
              <Text style={styles.exportButtonText}>
                {isExporting ? 'Sedang Export...' : 'Export ke CSV'}
              </Text>
            </TouchableOpacity>

            {/* Info */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <Text style={styles.infoText}>
                File CSV akan disimpan dan dapat dibagikan ke aplikasi lain
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCalendar(false)}
        >
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Pilih Bulan</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={
                customDate
                  ? {
                      [customDate.toISOString().split('T')[0]]: {
                        selected: true,
                        selectedColor: '#3b82f6',
                      },
                    }
                  : {}
              }
              theme={{
                todayTextColor: '#3b82f6',
                selectedDayBackgroundColor: '#3b82f6',
                selectedDayTextColor: '#ffffff',
                arrowColor: '#3b82f6',
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  periodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  periodOptionActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  periodOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  periodOptionTextActive: {
    color: '#3b82f6',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  dateButtonText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  dateButtonTextPlaceholder: {
    color: '#9ca3af',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    marginBottom: 16,
  },
  exportButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  exportButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#3b82f6',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 400,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
});
