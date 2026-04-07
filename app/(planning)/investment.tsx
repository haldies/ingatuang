import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { formatCurrency } from '@/lib/utils/format';
import { Colors, getRadius } from '@/constants/theme';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { Header } from '@/components/ui/header';
import { useTranslation } from 'react-i18next';

export default function InvestmentCalculator() {
  const router = useRouter();
  const { t } = useTranslation();
  const [initialCapital, setInitialCapital] = useState('5000000');
  const [targetYears, setTargetYears] = useState('5');
  const [monthlyTopup, setMonthlyTopup] = useState('1000000');
  const [annualRoi, setAnnualRoi] = useState('12');

  const result = useMemo(() => {
    const p = parseFloat(initialCapital) || 0;
    const pmt = parseFloat(monthlyTopup) || 0;
    const years = parseInt(targetYears) || 0;
    const r = (parseFloat(annualRoi) || 0) / 100 / 12;
    const n = years * 12;

    if (n === 0) return { total: p, profit: 0, totalDeposit: p };
    let fv = p * Math.pow(1 + r, n);
    if (r > 0) fv += pmt * ((Math.pow(1 + r, n) - 1) / r);
    else fv += pmt * n;
    const totalDeposit = p + (pmt * n);
    return { total: fv, profit: fv - totalDeposit, totalDeposit };
  }, [initialCapital, targetYears, monthlyTopup, annualRoi]);

  return (
    <ScreenWrapper backgroundColor="#fff">
      <Header title={t('investment.header')} />
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View style={[styles.resultCard, { borderRadius: getRadius(220, 'large'), backgroundColor: Colors.light.tint }]}>
          <Text style={styles.resultLabel}>{t('investment.future_value')}</Text>
          <Text style={styles.resultAmount}>{formatCurrency(result.total)}</Text>
          <View style={styles.resDivider} />
          <View style={styles.resFooter}>
            <View><Text style={styles.resSubLabel}>{t('investment.total_deposit_label')}</Text><Text style={styles.resSubAmount}>{formatCurrency(result.totalDeposit)}</Text></View>
            <View style={{ alignItems: 'flex-end' }}><Text style={styles.resSubLabel}>{t('investment.total_profit_label')}</Text><Text style={styles.profitAmount}>+{formatCurrency(result.profit)}</Text></View>
          </View>
        </View>

        <View style={styles.form}>
           <View style={[styles.inputBox, { borderRadius: getRadius(100) }]}><Text style={styles.inputLabel}>{t('investment.initial_amount_label')}</Text><TextInput style={styles.inputText} keyboardType="numeric" value={initialCapital} onChangeText={setInitialCapital} /></View>
           <View style={[styles.inputBox, { borderRadius: getRadius(100) }]}><Text style={styles.inputLabel}>{t('investment.monthly_topup_label')}</Text><TextInput style={styles.inputText} keyboardType="numeric" value={monthlyTopup} onChangeText={setMonthlyTopup} /></View>
           <View style={styles.row}>
              <View style={[styles.inputBox, styles.flex1, { borderRadius: getRadius(100) }]}><Text style={styles.inputLabel}>{t('investment.years_label')}</Text><TextInput style={styles.inputText} keyboardType="numeric" value={targetYears} onChangeText={setTargetYears} /></View>
              <View style={[styles.inputBox, styles.flex1, { borderRadius: getRadius(100) }]}><Text style={styles.inputLabel}>{t('investment.return_rate_label')}</Text><TextInput style={styles.inputText} keyboardType="numeric" value={annualRoi} onChangeText={setAnnualRoi} /></View>
           </View>
        </View>

        <View style={[styles.infoBox, { borderRadius: getRadius(120) }]}><Ionicons name="information-circle-outline" size={18} color="#047857" style={{ marginBottom: 8 }} /><Text style={styles.infoText}>{t('investment.info_text')}</Text></View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  resultCard: { padding: 28, marginBottom: 24, elevation: 8, shadowColor: Colors.light.tint, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
  resultLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  resultAmount: { fontSize: 30, fontWeight: '900', color: '#fff', marginVertical: 8 },
  resDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 20 },
  resFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  resSubLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  resSubAmount: { fontSize: 14, fontWeight: '800', color: '#fff' },
  profitAmount: { fontSize: 14, fontWeight: '800', color: '#fff' },
  form: { gap: 16 },
  inputBox: { padding: 18, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9' },
  inputLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', marginBottom: 6, letterSpacing: 0.5 },
  inputText: { fontSize: 18, fontWeight: '900', color: '#0f172a', padding: 0 },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  infoBox: { marginTop: 32, padding: 20, backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#d1fae5' },
  infoText: { fontSize: 12, color: '#065f46', lineHeight: 20, fontWeight: '500' },
});
