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
import { useTranslation } from 'react-i18next';
import { Colors, getRadius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function VacationPlanScreen() {
  const { t } = useTranslation();
  const colorScheme = useNativeColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [destination, setDestination] = useState('Japan');
  const [targetAmount, setTargetAmount] = useState('30000000');
  const [targetDate, setTargetDate] = useState('12'); // Months

  const monthlySavings = parseFloat(targetAmount) / (parseFloat(targetDate) || 1);

  return (
    <ScreenWrapper backgroundColor={theme.background}>
      <Header title={t('vacation.header')} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[
            styles.resultCard, 
            { 
              backgroundColor: theme.tint, 
              borderRadius: getRadius(240, 'large'),
              shadowColor: theme.tint 
            }
          ]}>
            <Text style={styles.resultLabel}>{t('vacation.monthly_target')}</Text>
            <Text style={styles.resultValue}>Rp {Math.round(monthlySavings).toLocaleString('id-ID')}</Text>
            
            <View style={styles.divider} />
            
            <View style={styles.detailsRow}>
              <View>
                <Text style={styles.detailLabel}>{t('vacation.destination_label')}</Text>
                <Text style={styles.detailValue}>{destination}</Text>
              </View>
              <View>
                <Text style={styles.detailLabel}>{t('vacation.target_budget')}</Text>
                <Text style={styles.detailValue}>Rp {parseInt(targetAmount || '0').toLocaleString('id-ID')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{t('vacation.destination_label')}</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', 
                borderColor: isDark ? '#262626' : '#e2e8f0',
                color: theme.text,
                borderRadius: getRadius(56, 'small')
              }]}
              value={destination}
              onChangeText={setDestination}
              placeholder="e.g. Japan"
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{t('vacation.budget_label')}</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', 
                borderColor: isDark ? '#262626' : '#e2e8f0',
                color: theme.text,
                borderRadius: getRadius(56, 'small')
              }]}
              value={targetAmount}
              onChangeText={setTargetAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{t('vacation.months_until_label')}</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', 
                borderColor: isDark ? '#262626' : '#e2e8f0',
                color: theme.text,
                borderRadius: getRadius(56, 'small')
              }]}
              value={targetDate}
              onChangeText={setTargetDate}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            />
          </View>

          <View style={[styles.infoBox, { 
            backgroundColor: isDark ? theme.tint + '15' : theme.tint + '10',
            borderRadius: getRadius(56, 'small')
          }]}>
            <Ionicons name="airplane-outline" size={20} color={theme.tint} />
            <Text style={[styles.infoText, { color: isDark ? '#94a3b8' : '#0369a1' }]}>
              {t('vacation.info_text')}
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
    fontWeight: '700',
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
