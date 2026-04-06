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
import { useTranslation } from 'react-i18next';

export default function EducationFundScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [currentCost, setCurrentCost] = useState('100000000');
  const [inflation, setInflation] = useState('6');
  const [yearsUntilNeeded, setYearsUntilNeeded] = useState('10');

  const calculateFutureCost = () => {
    const cost = parseFloat(currentCost);
    const i = parseFloat(inflation) / 100;
    const n = parseFloat(yearsUntilNeeded);

    if (!cost || isNaN(i) || isNaN(n)) return 0;

    return Math.round(cost * Math.pow(1 + i, n));
  };

  const futureCost = calculateFutureCost();
  const monthlySavingsNeeded = futureCost / (parseFloat(yearsUntilNeeded) * 12 || 1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('education.header')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>{t('education.future_cost')}</Text>
            <Text style={styles.resultValue}>Rp {futureCost.toLocaleString('id-ID')}</Text>
            
            <View style={styles.divider} />
            
            <View style={styles.detailsRow}>
              <View>
                <Text style={styles.detailLabel}>{t('education.monthly_savings')}</Text>
                <Text style={styles.detailValue}>Rp {Math.round(monthlySavingsNeeded).toLocaleString('id-ID')}</Text>
              </View>
              <View>
                <Text style={styles.detailLabel}>{t('education.time_left')}</Text>
                <Text style={styles.detailValue}>{yearsUntilNeeded} {t('common.years')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('education.current_cost_label')}</Text>
            <TextInput
              style={styles.input}
              value={currentCost}
              onChangeText={setCurrentCost}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('education.inflation_label')}</Text>
            <TextInput
              style={styles.input}
              value={inflation}
              onChangeText={setInflation}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('education.years_until_label')}</Text>
            <TextInput
              style={styles.input}
              value={yearsUntilNeeded}
              onChangeText={setYearsUntilNeeded}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="school-outline" size={20} color="#a855f7" />
            <Text style={styles.infoText}>
              {t('education.info_text')}
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
    backgroundColor: '#a855f7',
    padding: 24,
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#a855f7',
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
    backgroundColor: '#f3e8ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    gap: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#6b21a8',
    lineHeight: 18,
  },
});
