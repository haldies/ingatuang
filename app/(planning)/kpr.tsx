import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { formatCurrency } from '@/lib/utils/format';
import { Colors, getRadius } from '@/constants/theme';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { Header } from '@/components/ui/header';
import { useTranslation } from 'react-i18next';

export default function KPRCalculator() {
  const router = useRouter();
  const { t } = useTranslation();
  
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
    <ScreenWrapper backgroundColor="#fff">
      <Header title={t('features.kpr')} />
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        
        <View style={[styles.mainCard, { borderRadius: getRadius(200, 'large'), backgroundColor: Colors.light.tint }]}>
          <Text style={styles.cardLabel}>ANGSURAN PER BULAN (ESTIMASI)</Text>
          <Text style={styles.cardAmount}>{formatCurrency(result.monthlyPayment)}</Text>
          <View style={styles.divider} />
          <View style={styles.footer}>
             <View><Text style={styles.footLabel}>PINJAMAN POKOK</Text><Text style={styles.footVal}>{formatCurrency(result.loanAmount)}</Text></View>
             <View style={{ alignItems: 'flex-end' }}><Text style={styles.footLabel}>BUNGA TOTAL</Text><Text style={[styles.footVal, { fontWeight: '900' }]}>{formatCurrency(result.totalInterest)}</Text></View>
          </View>
        </View>

        <View style={styles.form}>
          <View style={[styles.inputBox, { borderRadius: getRadius(100) }]}><Text style={styles.inputLabel}>HARGA PROPERTI (Rp)</Text><TextInput style={styles.inputText} keyboardType="numeric" value={propertyPrice} onChangeText={setPropertyPrice} /></View>
          <View style={styles.row}>
            <View style={[styles.inputBox, { flex: 1, borderRadius: getRadius(100) }]}><Text style={styles.inputLabel}>DP (%)</Text><TextInput style={styles.inputText} keyboardType="numeric" value={downPaymentPct} onChangeText={setDownPaymentPct} /></View>
            <View style={[styles.inputBox, { flex: 1, borderRadius: getRadius(100) }]}><Text style={styles.inputLabel}>SUKU BUNGA (%)</Text><TextInput style={styles.inputText} keyboardType="numeric" value={interestRate} onChangeText={setInterestRate} /></View>
          </View>
          <View style={[styles.inputBox, { borderRadius: getRadius(100) }]}><Text style={styles.inputLabel}>TENOR (TAHUN)</Text><TextInput style={styles.inputText} keyboardType="numeric" value={tenorYears} onChangeText={setTenorYears} /></View>
        </View>

        <View style={[styles.summary, { borderRadius: getRadius(120) }]}>
           <Text style={styles.sumTitle}>RINGKASAN PEMBAYARAN</Text>
           <View style={styles.sumRow}><Text style={styles.sumLabel}>Total Dikembalikan (Pokok + Bunga)</Text><Text style={styles.sumVal}>{formatCurrency(result.totalPayment)}</Text></View>
           <View style={styles.sumRow}><Text style={styles.sumLabel}>Uang Muka (Down Payment)</Text><Text style={styles.sumVal}>{formatCurrency(result.dp)}</Text></View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainCard: { padding: 28, marginBottom: 24, elevation: 12, shadowColor: Colors.light.tint, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  cardLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5 },
  cardAmount: { fontSize: 32, fontWeight: '900', color: '#fff', marginVertical: 10 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  footLabel: { fontSize: 8, fontWeight: '800', color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  footVal: { fontSize: 14, fontWeight: '700', color: '#fff' },
  form: { gap: 14 },
  inputBox: { padding: 16, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9' },
  inputLabel: { fontSize: 9, fontWeight: '900', color: '#94a3b8', marginBottom: 4, letterSpacing: 0.5 },
  inputText: { fontSize: 18, fontWeight: '800', color: '#0f172a', padding: 0 },
  row: { flexDirection: 'row', gap: 12 },
  summary: { marginTop: 32, padding: 24, backgroundColor: '#f1f5f9' },
  sumTitle: { fontSize: 10, fontWeight: '900', color: '#64748b', letterSpacing: 1, marginBottom: 16 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sumLabel: { fontSize: 12, color: '#475569', fontWeight: '500' },
  sumVal: { fontSize: 13, fontWeight: '800', color: '#1e293b' },
});
