import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getSplitBills, type SplitBill } from '@/lib/storage';
import { formatCurrency, formatDate } from '@/lib/format';

export default function SplitBillScreen() {
  const router = useRouter();
  const [splitBills, setSplitBills] = useState<SplitBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await getSplitBills();
      setSplitBills(data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading split bills:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateNew = () => {
    router.push('/split-bill/create');
  };

  const handleViewDetail = (id: string) => {
    router.push(`/split-bill/${id}`);
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Split Bill</Text>
            <Text style={styles.headerSubtitle}>Bagi tagihan dengan mudah</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleCreateNew}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Empty State */}
        {splitBills.length === 0 && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
            </View>
            <Text style={styles.emptyTitle}>Belum Ada Split Bill</Text>
            <Text style={styles.emptyText}>
              Buat split bill pertama Anda untuk membagi tagihan dengan teman
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleCreateNew}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Buat Split Bill</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Split Bill List */}
        {splitBills.length > 0 && (
          <View style={styles.listContainer}>
            {splitBills.map((splitBill) => (
              <TouchableOpacity
                key={splitBill.id}
                style={styles.card}
                onPress={() => handleViewDetail(splitBill.id)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardIcon}>
                    <Ionicons name="receipt" size={24} color="#3b82f6" />
                  </View>
                  <View style={styles.cardHeaderContent}>
                    <Text style={styles.cardTitle}>{splitBill.title}</Text>
                    <Text style={styles.cardDate}>{formatDate(splitBill.createdAt)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardBody}>
                  <View style={styles.cardStat}>
                    <Text style={styles.cardStatLabel}>Total</Text>
                    <Text style={styles.cardStatValue}>{formatCurrency(splitBill.total)}</Text>
                  </View>
                  <View style={styles.cardStat}>
                    <Text style={styles.cardStatLabel}>Items</Text>
                    <Text style={styles.cardStatValue}>{splitBill.items.length}</Text>
                  </View>
                  <View style={styles.cardStat}>
                    <Text style={styles.cardStatLabel}>Persons</Text>
                    <Text style={styles.cardStatValue}>{splitBill.persons.length}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 12,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cardStat: {
    alignItems: 'center',
  },
  cardStatLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  cardStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
});
