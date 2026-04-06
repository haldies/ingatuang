import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { formatCurrency } from '@/lib/utils/format';
import type { DashboardStats } from '@/lib/storage/storage-adapter';
import { useTranslation } from 'react-i18next';

interface BalanceCardProps {
  stats: DashboardStats;
}

export function BalanceCard({ stats }: BalanceCardProps) {
  const { t } = useTranslation();
  
  return (
    <View className="mx-4 my-4">
      <View className="bg-white rounded-[24px] p-6 shadow-sm shadow-black/5 elevation-2">
        {/* Main Balance */}
        <View className="items-center mb-6">
          <Text className="text-sm text-slate-500 font-medium mb-2 tracking-widest uppercase">
            {t('dashboard.total_balance')}
          </Text>
          <Text className="text-[40px] font-extrabold text-slate-700 tracking-tighter">
            {formatCurrency(stats.totalBalance)}
          </Text>
          
          {stats.balanceChange !== undefined && (
            <View className="flex-row items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl">
              <Text className={`text-[13px] font-semibold ${stats.balanceChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {stats.balanceChange >= 0 ? '+' : ''}{stats.balanceChange.toFixed(1)}%
              </Text>
              <Text className="text-xs text-slate-500">{t('dashboard.vs_last_month')}</Text>
            </View>
          )}
        </View>

        {/* Income & Expense Row */}
        <View className="flex-row items-center bg-slate-50 rounded-2xl p-3">
          <View className="flex-1 flex-row items-center gap-2">
            <View className="w-8 h-8 items-center justify-center">
              <Feather name="arrow-down-circle" size={20} color="#374151" />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] text-slate-500 font-medium">{t('dashboard.income')}</Text>
              <Text className="text-[13px] font-bold text-slate-700" numberOfLines={1}>
                {formatCurrency(stats.totalIncome)}
              </Text>
            </View>
          </View>

          <View className="w-[1px] h-8 bg-slate-200 mx-3" />

          <View className="flex-1 flex-row items-center gap-2">
            <View className="w-8 h-8 items-center justify-center">
              <Feather name="arrow-up-circle" size={20} color="#374151" />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] text-slate-500 font-medium">{t('dashboard.expense')}</Text>
              <Text className="text-[13px] font-bold text-slate-700" numberOfLines={1}>
                {formatCurrency(stats.totalExpense)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

