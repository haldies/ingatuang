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
  UIManager,
  useColorScheme as useNativeColorScheme
} from 'react-native';
import { Header } from '@/components/ui/header';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/utils/format';
import { Colors, getRadius } from '@/constants/theme';
import { CustomAlert } from '@/components/ui/custom-alert';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TaxCalculatorScreen() {
  const { t } = useTranslation();
  const colorScheme = useNativeColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  
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
    <ScreenWrapper backgroundColor={theme.background}>
      <Header title={t('tax.header')} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.formCard, { 
          backgroundColor: isDark ? '#1a1a1a' : '#fff',
          borderRadius: getRadius(240, 'large'),
          borderColor: isDark ? '#262626' : '#f1f5f9',
          borderWidth: isDark ? 1 : 0
        }]}>
          {/* Section 1: Income */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
               <View style={[styles.stepCircle, { backgroundColor: theme.tint + '15' }]}><Text style={[styles.stepText, { color: theme.tint }]}>1</Text></View>
               <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t('tax.monthly_income_label')}</Text>
            </View>
            <View style={[styles.inputBox, { 
              backgroundColor: isDark ? '#0a0a0a' : '#f8fafc',
              borderColor: isDark ? '#262626' : '#f1f5f9',
              borderRadius: getRadius(160, 'medium')
            }]}>
              <Text style={styles.currencyLabel}>Rp</Text>
              <TextInput
                style={[styles.mainInputField, { color: theme.text }]}
                keyboardType="numeric"
                value={income === '0' ? '' : parseFloat(income.replace(/[^0-9]/g, '')).toLocaleString('id-ID')}
                onChangeText={(text) => setIncome(text.replace(/[^0-9]/g, ''))}
                placeholder="0"
                placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
              />
            </View>
          </View>

          <View style={[styles.dividerLine, { backgroundColor: isDark ? '#262626' : '#f1f5f9' }]} />

          {/* Section 2: Status */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
               <View style={[styles.stepCircle, { backgroundColor: theme.tint + '15' }]}><Text style={[styles.stepText, { color: theme.tint }]}>2</Text></View>
               <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t('tax.status_label')}</Text>
            </View>
            <View style={styles.optionRow}>
              <TouchableOpacity 
                onPress={() => setIsMarried(false)}
                style={[
                  styles.optionBtn, 
                  { 
                    backgroundColor: isDark ? '#0a0a0a' : '#f8fafc',
                    borderColor: isDark ? '#262626' : '#f1f5f9',
                    borderRadius: getRadius(160, 'medium')
                  },
                  !isMarried && { borderColor: theme.tint, backgroundColor: theme.tint + '08' }
                ]}
              >
                <View style={[styles.radioOuter, { borderColor: isDark ? '#475569' : '#cbd5e1' }, !isMarried && { borderColor: theme.tint }]}>
                  {!isMarried && <View style={[styles.radioInner, { backgroundColor: theme.tint }]} />}
                </View>
                <Text style={[styles.optionText, !isMarried && { color: theme.tint }]}>{t('tax.single')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setIsMarried(true)}
                style={[
                  styles.optionBtn, 
                  { 
                    backgroundColor: isDark ? '#0a0a0a' : '#f8fafc',
                    borderColor: isDark ? '#262626' : '#f1f5f9',
                    borderRadius: getRadius(160, 'medium')
                  },
                  isMarried && { borderColor: theme.tint, backgroundColor: theme.tint + '08' }
                ]}
              >
                <View style={[styles.radioOuter, { borderColor: isDark ? '#475569' : '#cbd5e1' }, isMarried && { borderColor: theme.tint }]}>
                  {isMarried && <View style={[styles.radioInner, { backgroundColor: theme.tint }]} />}
                </View>
                <Text style={[styles.optionText, isMarried && { color: theme.tint }]}>{t('tax.married')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.dividerLine, { backgroundColor: isDark ? '#262626' : '#f1f5f9' }]} />

          {/* Section 3: Dependents */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
               <View style={[styles.stepCircle, { backgroundColor: theme.tint + '15' }]}><Text style={[styles.stepText, { color: theme.tint }]}>3</Text></View>
               <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t('tax.dependents_label')}</Text>
            </View>
            <View style={styles.chipRow}>
              {[0, 1, 2, 3].map(num => (
                <TouchableOpacity 
                  key={num} 
                  onPress={() => setChildren(num)}
                  style={[
                    styles.chip, 
                    { 
                      backgroundColor: isDark ? '#0a0a0a' : '#f8fafc',
                      borderColor: isDark ? '#262626' : '#f1f5f9',
                      borderRadius: getRadius(140, 'medium')
                    },
                    children === num && { backgroundColor: theme.tint, borderColor: theme.tint },
                    num === 0 && { flex: 1.5 }
                  ]}
                >
                  <Text style={[
                    styles.chipText, 
                    { color: isDark ? '#475569' : '#94a3b8' },
                    children === num && { color: '#fff' }
                  ]}>
                    {num === 0 ? t('tax.no_dependents') : num}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                onPress={() => setAlertVisible(true)}
                style={[styles.chip, { 
                  flex: 0.5,
                  backgroundColor: isDark ? '#0a0a0a' : '#f8fafc',
                  borderColor: isDark ? '#262626' : '#f1f5f9',
                  borderRadius: getRadius(140, 'medium')
                }]}
              >
                <Ionicons name="add" size={20} color={isDark ? '#475569' : '#94a3b8'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Dynamic Results */}
        {result && (
          <View style={styles.resultsArea}>
            <View style={[styles.primaryResultCard, { 
              backgroundColor: theme.tint,
              borderRadius: getRadius(240, 'large'),
              shadowColor: theme.tint 
            }]}>
               <View>
                 <Text style={styles.resLabel}>{t('tax.annual_tax').toUpperCase()}</Text>
                 <Text style={styles.resValue}>{formatCurrency(result.totalTax)}</Text>
               </View>
               <View style={styles.resCircle}>
                  <Ionicons name="receipt-outline" size={24} color="#fff" />
               </View>
            </View>

            <View style={styles.statsCard}>
                <View style={[styles.statItem, { 
                  backgroundColor: isDark ? '#1a1a1a' : '#fff',
                  borderRadius: getRadius(240, 'large'),
                  borderColor: isDark ? '#262626' : '#f1f5f9',
                  borderWidth: isDark ? 1 : 0
                }]}>
                   <Text style={[styles.statLabel, { color: isDark ? '#475569' : '#94a3b8' }]}>{t('tax.monthly_tax')}</Text>
                   <Text style={[styles.statValue, { color: theme.text }]}>{formatCurrency(result.totalTax / 12)}</Text>
                </View>
                <View style={[styles.statItem, { 
                  backgroundColor: isDark ? '#1a1a1a' : '#fff',
                  borderRadius: getRadius(240, 'large'),
                  borderColor: isDark ? '#262626' : '#f1f5f9',
                  borderWidth: isDark ? 1 : 0
                }]}>
                   <Text style={[styles.statLabel, { color: isDark ? '#475569' : '#94a3b8' }]}>{t('tax.pkp_label')}</Text>
                   <Text style={[styles.statValue, { color: theme.text }]}>{formatCurrency(result.pkp)}</Text>
                </View>
            </View>

            {/* Tax Breakdown */}
            <View style={styles.breakdownContainer}>
              <Text style={[styles.breakdownHeader, { color: isDark ? '#475569' : '#94a3b8' }]}>{t('tax.breakdown_title')}</Text>
              
              <View style={[styles.breakdownList, { 
                backgroundColor: isDark ? '#1a1a1a' : '#fff',
                borderRadius: getRadius(240, 'large'),
                borderColor: isDark ? '#262626' : '#f1f5f9',
                borderWidth: isDark ? 1 : 0
              }]}>
                <View style={[styles.rowItem, { borderBottomColor: isDark ? '#262626' : '#f1f5f9' }]}>
                   <Text style={[styles.rowLabel, { color: theme.text }]}>{t('tax.ptkp_label')}</Text>
                   <Text style={[styles.rowValue, { color: theme.text }]}>{formatCurrency(result.ptkp)}</Text>
                </View>
                
                {result.breakdown.length > 0 ? result.breakdown.map((item: any, idx: number) => (
                  <View key={idx} style={[styles.rowItem, { borderBottomColor: isDark ? '#262626' : '#f1f5f9' }]}>
                    <View>
                      <Text style={[styles.rowLabel, { color: theme.text }]}>{t('tax.layer_name', { index: idx + 1 })} ({item.rate}%)</Text>
                      <Text style={[styles.rowMath, { color: isDark ? '#475569' : '#94a3b8' }]}>{formatCurrency(item.amount)} × {item.rate}%</Text>
                    </View>
                    <Text style={[styles.rowValue, { color: theme.text }]}>{formatCurrency(item.tax)}</Text>
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
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 16 },
  formCard: {
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
  stepCircle: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 11, fontWeight: '900' },
  sectionLabel: { fontSize: 13, fontWeight: '800' },
  inputBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderWidth: 1 },
  currencyLabel: { fontSize: 14, fontWeight: '800', color: '#cbd5e1', marginRight: 10 },
  mainInputField: { fontSize: 24, fontWeight: '900', flex: 1, paddingVertical: 16 },
  dividerLine: { height: 1, marginHorizontal: -20, marginVertical: 16 },
  optionRow: { flexDirection: 'row', gap: 12 },
  optionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderWidth: 1 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  optionText: { fontSize: 14, fontWeight: '800', color: '#94a3b8' },
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: { flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: 1 },
  chipText: { fontSize: 14, fontWeight: '800' },
  resultsArea: { gap: 16 },
  primaryResultCard: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 4,
  },
  resCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  resLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.6)', letterSpacing: 1, marginBottom: 4 },
  resValue: { fontSize: 28, fontWeight: '900', color: '#fff' },
  statsCard: { flexDirection: 'row', gap: 12 },
  statItem: { flex: 1, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  statLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 6 },
  statValue: { fontSize: 16, fontWeight: '900' },
  breakdownContainer: { paddingVertical: 8 },
  breakdownHeader: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, paddingLeft: 4 },
  breakdownList: { paddingHorizontal: 20, paddingVertical: 4 },
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1 },
  rowLabel: { fontSize: 13, fontWeight: '800' },
  rowMath: { fontSize: 10, marginTop: 2, fontWeight: '600' },
  rowValue: { fontSize: 14, fontWeight: '900' },
  freeAlert: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 24, justifyContent: 'center' },
  freeAlertText: { fontSize: 13, fontWeight: '700', color: '#10b981' }
});
