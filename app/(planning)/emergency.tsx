import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

export default function EmergencyFundScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [expense, setExpense] = useState('5000000');
  const [months, setMonths] = useState('6');
  const [savings, setSavings] = useState('10000000');

  const target = parseFloat(expense) * parseFloat(months);
  const gap = Math.max(0, target - parseFloat(savings || '0'));
  const progress = target > 0 ? (parseFloat(savings || '0') / target) * 100 : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('emergency.header')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>{t('emergency.target_amount')}</Text>
            <Text style={styles.resultValue}>Rp {target.toLocaleString('id-ID')}</Text>
            
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${Math.min(100, progress)}%` }]} />
            </View>
            <Text style={styles.progressText}>{t('common.progress')}: {Math.min(100, progress).toFixed(1)}%</Text>
            
            <View style={styles.divider} />
            
            <View style={styles.detailsRow}>
              <View>
                <Text style={styles.detailLabel}>{t('emergency.deficit')}</Text>
                <Text style={styles.detailValue}>Rp {gap.toLocaleString('id-ID')}</Text>
              </View>
              <View>
                <Text style={styles.detailLabel}>{t('emergency.saved')}</Text>
                <Text style={styles.detailValue}>Rp {parseInt(savings || '0').toLocaleString('id-ID')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('emergency.monthly_expense_label')}</Text>
            <TextInput
              style={styles.input}
              value={expense}
              onChangeText={setExpense}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('emergency.tenure_label')}</Text>
            <TextInput
              style={styles.input}
              value={months}
              onChangeText={setMonths}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('emergency.current_savings_label')}</Text>
            <TextInput
              style={styles.input}
              value={savings}
              onChangeText={setSavings}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#10b981" />
            <Text style={styles.infoText}>
              {t('emergency.info_text')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  resultCard: {
    backgroundColor: '#10b981',
    padding: 24,
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  resultLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '800',
    marginBottom: 16,
  },
  progressContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#ecfdf5',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    gap: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#065f46',
    lineHeight: 18,
  },
});
