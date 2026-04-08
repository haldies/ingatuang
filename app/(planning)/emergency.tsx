import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme as useNativeColorScheme,
} from 'react-native';
import { Header } from '@/components/ui/header';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { Colors, getRadius } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export default function EmergencyFundScreen() {
  const { t } = useTranslation();
  const colorScheme = useNativeColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [expense, setExpense] = useState('5000000');
  const [months, setMonths] = useState('6');
  const [savings, setSavings] = useState('10000000');

  const target = parseFloat(expense) * parseFloat(months);
  const gap = Math.max(0, target - parseFloat(savings || '0'));
  const progress = target > 0 ? (parseFloat(savings || '0') / target) * 100 : 0;

  return (
    <ScreenWrapper backgroundColor={theme.background}>
      <Header title={t('emergency.header')} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.resultCard, { borderRadius: getRadius(240, 'large'), backgroundColor: theme.tint, shadowColor: theme.tint }]}>
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
            <Text style={[styles.inputLabel, { color: theme.text }]}>{t('emergency.monthly_expense_label')}</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', 
                borderColor: isDark ? '#262626' : '#e2e8f0',
                color: theme.text,
                borderRadius: getRadius(56, 'small')
              }]}
              value={expense}
              onChangeText={setExpense}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>{t('emergency.tenure_label')}</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', 
                borderColor: isDark ? '#262626' : '#e2e8f0',
                color: theme.text,
                borderRadius: getRadius(56, 'small')
              }]}
              value={months}
              onChangeText={setMonths}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>{t('emergency.current_savings_label')}</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', 
                borderColor: isDark ? '#262626' : '#e2e8f0',
                color: theme.text,
                borderRadius: getRadius(56, 'small')
              }]}
              value={savings}
              onChangeText={setSavings}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            />
          </View>

          <View style={[styles.infoBox, { 
            backgroundColor: isDark ? theme.tint + '15' : theme.tint + '10',
            borderRadius: getRadius(56, 'small')
          }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.tint} />
            <Text style={[styles.infoText, { color: isDark ? '#94a3b8' : '#065f46' }]}>
              {t('emergency.info_text')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
  },
  resultCard: {
    padding: 24,
    marginBottom: 32,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  resultLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  resultValue: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '900',
    marginBottom: 16,
  },
  progressContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    fontWeight: '800',
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
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '800',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    marginTop: 12,
    gap: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
});
