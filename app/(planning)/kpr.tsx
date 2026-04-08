import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, useColorScheme as useNativeColorScheme } from 'react-native';
import { Header } from '@/components/ui/header';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { formatCurrency } from '@/lib/utils/format';
import { Colors, getRadius } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

export default function KPRCalculator() {
  const { t } = useTranslation();
  const colorScheme = useNativeColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  
  const [propertyPrice, setPropertyPrice] = useState('500000000');
  const [downPaymentPct, setDownPaymentPct] = useState('20');
  const [interestRate, setInterestRate] = useState('8');
  const [tenorYears, setTenorYears] = useState('15');

  const result = useMemo(() => {
    const price = parseFloat(propertyPrice) || 0;
    const dp = (parseFloat(downPaymentPct) || 0) / 100 * price;
    const loanAmount = price - dp;
    const rate = (parseFloat(interestRate) || 0) / 100 / 12;
    const months = (parseInt(tenorYears) || 0) * 12;

    if (months === 0 || rate === 0) return { monthlyPayment: loanAmount / (months || 1), totalPayment: loanAmount, totalInterest: 0, loanAmount, dp };

    const monthlyPayment = (loanAmount * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    const totalPayment = monthlyPayment * months;
    
    return { monthlyPayment, totalPayment, totalInterest: totalPayment - loanAmount, loanAmount, dp };
  }, [propertyPrice, downPaymentPct, interestRate, tenorYears]);

  return (
    <ScreenWrapper backgroundColor={theme.background}>
      <Header title={t('features.kpr')} />
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        
        <View style={[styles.mainCard, { borderRadius: getRadius(200, 'large'), backgroundColor: theme.tint, shadowColor: theme.tint }]}>
          <Text style={styles.cardLabel}>ANGSURAN PER BULAN (ESTIMASI)</Text>
          <Text style={styles.cardAmount}>{formatCurrency(result.monthlyPayment)}</Text>
          <View style={styles.divider} />
          <View style={styles.footer}>
             <View><Text style={styles.footLabel}>PINJAMAN POKOK</Text><Text style={styles.footVal}>{formatCurrency(result.loanAmount)}</Text></View>
             <View style={{ alignItems: 'flex-end' }}><Text style={styles.footLabel}>BUNGA TOTAL</Text><Text style={[styles.footVal, { fontWeight: '900' }]}>{formatCurrency(result.totalInterest)}</Text></View>
          </View>
        </View>

        <View style={styles.form}>
          <View style={[styles.inputBox, { 
            borderRadius: getRadius(100), 
            backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', 
            borderColor: isDark ? '#262626' : '#f1f5f9' 
          }]}>
            <Text style={styles.inputLabel}>HARGA PROPERTI (Rp)</Text>
            <TextInput 
              style={[styles.inputText, { color: theme.text }]} 
              keyboardType="numeric" 
              value={propertyPrice} 
              onChangeText={setPropertyPrice} 
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputBox, { 
              flex: 1, 
              borderRadius: getRadius(100), 
              backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', 
              borderColor: isDark ? '#262626' : '#f1f5f9' 
            }]}>
              <Text style={styles.inputLabel}>DP (%)</Text>
              <TextInput 
                style={[styles.inputText, { color: theme.text }]} 
                keyboardType="numeric" 
                value={downPaymentPct} 
                onChangeText={setDownPaymentPct} 
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
              />
            </View>
            <View style={[styles.inputBox, { 
              flex: 1, 
              borderRadius: getRadius(100), 
              backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', 
              borderColor: isDark ? '#262626' : '#f1f5f9' 
            }]}>
              <Text style={styles.inputLabel}>SUKU BUNGA (%)</Text>
              <TextInput 
                style={[styles.inputText, { color: theme.text }]} 
                keyboardType="numeric" 
                value={interestRate} 
                onChangeText={setInterestRate} 
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
              />
            </View>
          </View>
          <View style={[styles.inputBox, { 
            borderRadius: getRadius(100), 
            backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', 
            borderColor: isDark ? '#262626' : '#f1f5f9' 
          }]}>
            <Text style={styles.inputLabel}>TENOR (TAHUN)</Text>
            <TextInput 
              style={[styles.inputText, { color: theme.text }]} 
              keyboardType="numeric" 
              value={tenorYears} 
              onChangeText={setTenorYears} 
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            />
          </View>
        </View>

        <View style={[styles.summary, { 
          borderRadius: getRadius(120),
          backgroundColor: isDark ? '#171717' : '#f1f5f9',
          borderColor: isDark ? '#262626' : '#e2e8f0',
          borderWidth: isDark ? 1 : 0
        }]}>
           <Text style={[styles.sumTitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>RINGKASAN PEMBAYARAN</Text>
           <View style={styles.sumRow}><Text style={[styles.sumLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>Total Dikembalikan (Pokok + Bunga)</Text><Text style={[styles.sumVal, { color: theme.text }]}>{formatCurrency(result.totalPayment)}</Text></View>
           <View style={styles.sumRow}><Text style={[styles.sumLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>Uang Muka (Down Payment)</Text><Text style={[styles.sumVal, { color: theme.text }]}>{formatCurrency(result.dp)}</Text></View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainCard: { padding: 28, marginBottom: 24, elevation: 12, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  cardLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5 },
  cardAmount: { fontSize: 32, fontWeight: '900', color: '#fff', marginVertical: 10 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  footLabel: { fontSize: 8, fontWeight: '800', color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  footVal: { fontSize: 14, fontWeight: '700', color: '#fff' },
  form: { gap: 14 },
  inputBox: { padding: 16, borderWidth: 1 },
  inputLabel: { fontSize: 9, fontWeight: '900', color: '#94a3b8', marginBottom: 4, letterSpacing: 0.5 },
  inputText: { fontSize: 18, fontWeight: '800', padding: 0 },
  row: { flexDirection: 'row', gap: 12 },
  summary: { marginTop: 32, padding: 24 },
  sumTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 16 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sumLabel: { fontSize: 12, fontWeight: '600' },
  sumVal: { fontSize: 13, fontWeight: '800' },
});
