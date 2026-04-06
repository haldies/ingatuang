import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/utils/format';
import { Colors } from '@/constants/theme';
import { CustomAlert } from '@/components/ui/custom-alert';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TaxCalculatorScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [income, setIncome] = useState('0');
  const [isMarried, setIsMarried] = useState(false);
  const [children, setChildren] = useState(0);
  const [result, setResult] = useState<any>(null);
  
  const [alertVisible, setAlertVisible] = useState(false);

  const calculateTax = () => {
    const rawIncome = (parseFloat(income.replace(/[^0-9]/g, '')) || 0) * 12;
    
    // PTKP calculation (capped at 3 children per UU HPP 2021)
    let ptkp = 54000000;
    if (isMarried) ptkp += 4500000;
    const effectiveChildren = Math.min(children, 3);
    ptkp += effectiveChildren * 4500000;
    
    const pkp = Math.max(0, rawIncome - ptkp);
    const layers = [
      { limit: 60000000, rate: 0.05 },
      { limit: 250000000, rate: 0.15 },
      { limit: 500000000, rate: 0.25 },
      { limit: 5000000000, rate: 0.30 },
      { limit: Infinity, rate: 0.35 },
    ];
    
    let remainingPKP = pkp;
    let totalTax = 0;
    const breakdown = [];
    let prevLimit = 0;
    
    for (const layer of layers) {
      if (remainingPKP <= 0) break;
      const currentLayerLimit = layer.limit - prevLimit;
      const amountInThisLayer = Math.min(remainingPKP, currentLayerLimit);
      const taxInThisLayer = amountInThisLayer * layer.rate;
      totalTax += taxInThisLayer;
      breakdown.push({ amount: amountInThisLayer, rate: layer.rate * 100, tax: taxInThisLayer });
      remainingPKP -= amountInThisLayer;
      prevLimit = layer.limit;
    }
    setResult({ ptkp, pkp, totalTax, breakdown });
  };

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    calculateTax();
  }, [income, isMarried, children]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('tax.header')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          {/* Section 1: Income */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
               <View style={styles.stepCircle}><Text style={styles.stepText}>1</Text></View>
               <Text style={styles.sectionLabel}>{t('tax.monthly_income_label')}</Text>
            </View>
            <View style={styles.inputBox}>
              <Text style={styles.currencyLabel}>Rp</Text>
              <TextInput
                style={styles.mainInputField}
                keyboardType="numeric"
                value={income === '0' ? '' : parseFloat(income.replace(/[^0-9]/g, '')).toLocaleString('id-ID')}
                onChangeText={(text) => setIncome(text.replace(/[^0-9]/g, ''))}
                placeholder="0"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={styles.dividerLine} />

          {/* Section 2: Status */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
               <View style={styles.stepCircle}><Text style={styles.stepText}>2</Text></View>
               <Text style={styles.sectionLabel}>{t('tax.status_label')}</Text>
            </View>
            <View style={styles.optionRow}>
              <TouchableOpacity 
                onPress={() => setIsMarried(false)}
                style={[styles.optionBtn, !isMarried && styles.optionBtnActive]}
              >
                <View style={[styles.radioOuter, !isMarried && styles.radioActive]}>
                  {!isMarried && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.optionText, !isMarried && styles.optionTextActive]}>{t('tax.single')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setIsMarried(true)}
                style={[styles.optionBtn, isMarried && styles.optionBtnActive]}
              >
                <View style={[styles.radioOuter, isMarried && styles.radioActive]}>
                  {isMarried && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.optionText, isMarried && styles.optionTextActive]}>{t('tax.married')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.dividerLine} />

          {/* Section 3: Dependents */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
               <View style={styles.stepCircle}><Text style={styles.stepText}>3</Text></View>
               <Text style={styles.sectionLabel}>{t('tax.dependents_label')}</Text>
            </View>
            <View style={styles.chipRow}>
              {[0, 1, 2, 3].map(num => (
                <TouchableOpacity 
                  key={num} 
                  onPress={() => setChildren(num)}
                  style={[styles.chip, children === num && styles.chipActive, num === 0 && { flex: 1.5 }]}
                >
                  <Text style={[styles.chipText, children === num && styles.chipTextActive]}>
                    {num === 0 ? t('tax.no_dependents') : num}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                onPress={() => setAlertVisible(true)}
                style={[styles.chip, { flex: 0.5 }]}
              >
                <Ionicons name="add" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Dynamic Results */}
        {result && (
          <View style={styles.resultsArea}>
            <View style={styles.primaryResultCard}>
               <View>
                 <Text style={styles.resLabel}>{t('tax.annual_tax').toUpperCase()}</Text>
                 <Text style={styles.resValue}>{formatCurrency(result.totalTax)}</Text>
               </View>
               <View style={styles.resCircle}>
                  <Ionicons name="receipt-outline" size={24} color="#fff" />
               </View>
            </View>

            <View style={styles.statsCard}>
                <View style={styles.statItem}>
                   <Text style={styles.statLabel}>{t('tax.monthly_tax')}</Text>
                   <Text style={styles.statValue}>{formatCurrency(result.totalTax / 12)}</Text>
                </View>
                <View style={styles.statItem}>
                   <Text style={styles.statLabel}>{t('tax.pkp_label')}</Text>
                   <Text style={styles.statValue}>{formatCurrency(result.pkp)}</Text>
                </View>
            </View>

            {/* Tax Breakdown */}
            <View style={styles.breakdownContainer}>
              <Text style={styles.breakdownHeader}>{t('tax.breakdown_title')}</Text>
              
              <View style={styles.breakdownList}>
                <View style={styles.rowItem}>
                   <Text style={styles.rowLabel}>{t('tax.ptkp_label')}</Text>
                   <Text style={styles.rowValue}>{formatCurrency(result.ptkp)}</Text>
                </View>
                
                {result.breakdown.length > 0 ? result.breakdown.map((item: any, idx: number) => (
                  <View key={idx} style={styles.rowItem}>
                    <View>
                      <Text style={styles.rowLabel}>{t('tax.layer_name', { index: idx + 1 })} ({item.rate}%)</Text>
                      <Text style={styles.rowMath}>{formatCurrency(item.amount)} × {item.rate}%</Text>
                    </View>
                    <Text style={styles.rowValue}>{formatCurrency(item.tax)}</Text>
                  </View>
                )) : (
                  <View style={styles.freeAlert}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#059669" />
                    <Text style={styles.freeAlertText}>{t('tax.tax_free_msg')}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
        
        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        title={t('tax.ptkp_alert_title')}
        message={t('tax.ptkp_alert_msg')}
        type="info"
        buttons={[{ text: 'OK', onPress: () => setAlertVisible(false) }]}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  
  content: { flex: 1, padding: 16 },
  
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
  },
  formSection: { marginVertical: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  stepCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.light.tint + '15', alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 11, fontWeight: '900', color: Colors.light.tint },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  currencyLabel: { fontSize: 14, fontWeight: '800', color: '#cbd5e1', marginRight: 10 },
  mainInputField: { fontSize: 24, fontWeight: '900', color: '#1e293b', flex: 1, paddingVertical: 16 },
  
  dividerLine: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: -20, marginVertical: 16 },
  
  optionRow: { flexDirection: 'row', gap: 12 },
  optionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 14, borderRadius: 16, gap: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  optionBtnActive: { borderColor: Colors.light.tint, backgroundColor: Colors.light.tint + '05' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.light.tint },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.light.tint },
  optionText: { fontSize: 14, fontWeight: '700', color: '#94a3b8' },
  optionTextActive: { color: Colors.light.tint },
  
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9' },
  chipActive: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  chipText: { fontSize: 14, fontWeight: '800', color: '#94a3b8' },
  chipTextActive: { color: '#fff' },
  
  resultsArea: { gap: 16 },
  primaryResultCard: {
    backgroundColor: Colors.light.tint,
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 4,
  },
  resCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  resLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.6)', letterSpacing: 1, marginBottom: 4 },
  resValue: { fontSize: 28, fontWeight: '900', color: '#fff' },
  
  statsCard: { flexDirection: 'row', gap: 12 },
  statItem: { flex: 1, backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  statLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 },
  statValue: { fontSize: 16, fontWeight: '900', color: '#1e293b' },
  
  breakdownContainer: { paddingVertical: 8 },
  breakdownHeader: { fontSize: 12, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, paddingLeft: 4 },
  breakdownList: { backgroundColor: '#fff', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 4 },
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowLabel: { fontSize: 13, fontWeight: '700', color: '#334155' },
  rowMath: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  rowValue: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  
  freeAlert: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 24, justifyContent: 'center' },
  freeAlertText: { fontSize: 13, fontWeight: '700', color: '#10b981' }
});
