import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getSplitBillById, deleteSplitBill, calculateSplitBillSummary, type SplitBill } from '@/lib/storage';
import { formatCurrency, formatDate } from '@/lib/format';

export default function SplitBillDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as string;

  const [splitBill, setSplitBill] = useState<SplitBill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const data = await getSplitBillById(id);
      setSplitBill(data);
    } catch (error) {
      console.error('Error loading split bill:', error);
      Alert.alert('Error', 'Gagal memuat split bill');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Hapus Split Bill',
      'Apakah Anda yakin ingin menghapus split bill ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSplitBill(id);
              router.replace('/split-bill');
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus split bill');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!splitBill) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Split bill tidak ditemukan</Text>
        </View>
      </SafeAreaView>
    );
  }

  const summaries = calculateSplitBillSummary(splitBill);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Split Bill</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Card */}
        <View style={styles.titleCard}>
          <Text style={styles.title}>{splitBill.title}</Text>
          <Text style={styles.date}>{formatDate(splitBill.createdAt)}</Text>
        </View>

        {/* Total Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Tagihan</Text>
          <Text style={styles.totalValue}>{formatCurrency(splitBill.total)}</Text>
          <View style={styles.totalBreakdown}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Subtotal</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(splitBill.subtotal)}</Text>
            </View>
            {splitBill.taxPercentage > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Pajak ({splitBill.taxPercentage}%)</Text>
                <Text style={styles.breakdownValue}>
                  {formatCurrency((splitBill.subtotal * splitBill.taxPercentage) / 100)}
                </Text>
              </View>
            )}
            {splitBill.servicePercentage > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Service ({splitBill.servicePercentage}%)</Text>
                <Text style={styles.breakdownValue}>
                  {formatCurrency((splitBill.subtotal * splitBill.servicePercentage) / 100)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Per Person Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pembagian Per Orang</Text>
          
          {summaries.map((summary) => (
            <View key={summary.personId} style={styles.personCard}>
              <View style={styles.personHeader}>
                <View style={styles.personAvatar}>
                  <Text style={styles.personAvatarText}>
                    {summary.personName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.personInfo}>
                  <Text style={styles.personName}>{summary.personName}</Text>
                  <Text style={styles.personItemCount}>{summary.items.length} items</Text>
                </View>
                <Text style={styles.personTotal}>{formatCurrency(summary.total)}</Text>
              </View>

              {/* Items */}
              <View style={styles.personItems}>
                {summary.items.map((item) => (
                  <View key={item.itemId} style={styles.personItem}>
                    <View style={styles.personItemInfo}>
                      <Text style={styles.personItemName}>{item.itemName}</Text>
                      <Text style={styles.personItemDetail}>
                        {item.quantity}x @ {formatCurrency(item.itemPrice)}
                        {item.sharedWith > 1 && ` (dibagi ${item.sharedWith})`}
                      </Text>
                    </View>
                    <Text style={styles.personItemShare}>{formatCurrency(item.share)}</Text>
                  </View>
                ))}
              </View>

              {/* Summary */}
              <View style={styles.personSummary}>
                <View style={styles.personSummaryRow}>
                  <Text style={styles.personSummaryLabel}>Subtotal</Text>
                  <Text style={styles.personSummaryValue}>{formatCurrency(summary.subtotal)}</Text>
                </View>
                {summary.tax > 0 && (
                  <View style={styles.personSummaryRow}>
                    <Text style={styles.personSummaryLabel}>Pajak</Text>
                    <Text style={styles.personSummaryValue}>{formatCurrency(summary.tax)}</Text>
                  </View>
                )}
                {summary.service > 0 && (
                  <View style={styles.personSummaryRow}>
                    <Text style={styles.personSummaryLabel}>Service</Text>
                    <Text style={styles.personSummaryValue}>{formatCurrency(summary.service)}</Text>
                  </View>
                )}
                <View style={styles.personSummaryDivider} />
                <View style={styles.personSummaryRow}>
                  <Text style={styles.personSummaryTotalLabel}>Total</Text>
                  <Text style={styles.personSummaryTotalValue}>{formatCurrency(summary.total)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  deleteButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
  },
  totalCard: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  totalBreakdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  personCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  personAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  personAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  personItemCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  personTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3b82f6',
  },
  personItems: {
    marginBottom: 12,
  },
  personItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  personItemInfo: {
    flex: 1,
  },
  personItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  personItemDetail: {
    fontSize: 12,
    color: '#6b7280',
  },
  personItemShare: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  personSummary: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
  },
  personSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  personSummaryLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  personSummaryValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
  },
  personSummaryDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  personSummaryTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  personSummaryTotalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
  },
});
