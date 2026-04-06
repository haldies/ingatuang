import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { formatCurrency } from '@/lib/utils/format';
import { useTranslation } from 'react-i18next';

export default function InvestmentCalculator() {
  const router = useRouter();
  const { t } = useTranslation();
  
  // States
  const [initialCapital, setInitialCapital] = useState('5000000'); // 5jt
  const [targetYears, setTargetYears] = useState('5');
  const [monthlyTopup, setMonthlyTopup] = useState('1000000'); // 1jt
  const [annualRoi, setAnnualRoi] = useState('12'); // 12%

  const result = useMemo(() => {
    const p = parseFloat(initialCapital) || 0;
    const pmt = parseFloat(monthlyTopup) || 0;
    const years = parseInt(targetYears) || 0;
    const r = (parseFloat(annualRoi) || 0) / 100 / 12; // Monthly rate
    const n = years * 12; // Total months

    if (n === 0) return { total: p, profit: 0, totalDeposit: p };

    // Future Value Formula
    let fv = p * Math.pow(1 + r, n);
    if (r > 0) {
      fv += pmt * ((Math.pow(1 + r, n) - 1) / r);
    } else {
      fv += pmt * n;
    }

    const totalDeposit = p + (pmt * n);
    const profit = fv - totalDeposit;

    return { total: fv, profit, totalDeposit };
  }, [initialCapital, targetYears, monthlyTopup, annualRoi]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="ml-2 text-lg font-bold text-gray-900">{t('investment.header')}</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        {/* Result Area */}
        <View className="p-6 mb-6 rounded-3xl bg-emerald-600 shadow-xl shadow-emerald-200">
          <Text className="text-emerald-100 text-sm font-medium mb-1">{t('investment.future_value')}</Text>
          <Text className="text-white text-3xl font-black mb-4">{formatCurrency(result.total)}</Text>
          
          <View className="flex-row justify-between border-t border-emerald-500 pt-4">
            <View>
              <Text className="text-emerald-100 text-xs opacity-80 uppercase">{t('investment.total_deposit_label')}</Text>
              <Text className="text-white font-bold">{formatCurrency(result.totalDeposit)}</Text>
            </View>
            <View className="items-end">
              <Text className="text-emerald-100 text-xs opacity-80 uppercase">{t('investment.total_profit_label')}</Text>
              <Text className="text-white font-bold">+{formatCurrency(result.profit)}</Text>
            </View>
          </View>
        </View>

        {/* Inputs */}
        <View className="space-y-4">
          <View className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Text className="text-xs font-semibold text-gray-400 mb-2 uppercase">{t('investment.initial_amount_label')}</Text>
            <TextInput
              className="text-xl font-bold text-gray-900 p-0"
              keyboardType="numeric"
              value={initialCapital}
              onChangeText={setInitialCapital}
            />
          </View>

          <View className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Text className="text-xs font-semibold text-gray-400 mb-2 uppercase">{t('investment.monthly_topup_label')}</Text>
            <TextInput
              className="text-xl font-bold text-gray-900 p-0"
              keyboardType="numeric"
              value={monthlyTopup}
              onChangeText={setMonthlyTopup}
            />
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Text className="text-xs font-semibold text-gray-400 mb-2 uppercase">{t('investment.years_label')}</Text>
              <TextInput
                className="text-xl font-bold text-gray-900 p-0"
                keyboardType="numeric"
                value={targetYears}
                onChangeText={setTargetYears}
              />
            </View>
            <View className="flex-1 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Text className="text-xs font-semibold text-gray-400 mb-2 uppercase">{t('investment.return_rate_label')}</Text>
              <TextInput
                className="text-xl font-bold text-gray-900 p-0"
                keyboardType="numeric"
                value={annualRoi}
                onChangeText={setAnnualRoi}
              />
            </View>
          </View>
        </View>

        {/* Note */}
        <View className="mt-8 p-4 bg-emerald-50 rounded-2xl">
          <Text className="text-emerald-700 text-xs leading-5">
            {t('investment.info_text')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
