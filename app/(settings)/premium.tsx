import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useColorScheme as useNativeColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, getRadius } from '@/constants/theme';
import { Header } from '@/components/ui/header';

const PREMIUM_FEATURES = [
  {
    order: 1,
    title: 'Catat otomatis lebih sering',
    description: 'Gunakan AI tanpa batas harian.',
    color: '#3B82F6',
  },
  {
    order: 2,
    title: 'Data tersimpan di akun',
    description: 'Akses catatan dari perangkat lain.',
    color: '#3B82F6',
  },
  {
    order: 3,
    title: 'Simpan laporan',
    description: 'Export data ke file saat dibutuhkan.',
    color: '#10B981',
  },
  {
    order: 4,
    title: 'Tampilan lebih fleksibel',
    description: 'Pilih gaya tampilan yang nyaman.',
    color: '#3B82F6',
  },
  {
    order: 5,
    title: 'Kunci aplikasi',
    description: 'Lindungi data dengan keamanan perangkat.',
    color: '#EF4444',
  },
];

export default function PremiumScreen() {
  const router = useRouter();
  const colorScheme = useNativeColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [selectedPlan, setSelectedPlan] = React.useState<'monthly' | 'yearly'>('yearly');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header title="Premium" transparent tintColor={theme.text} />

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heroSection}>
            <View style={[styles.premiumBadge, { backgroundColor: theme.tint, borderRadius: getRadius(96, 'small') }]}>
              <Ionicons name="star" size={14} color="#fff" />
              <Text style={styles.premiumBadgeText}>PRO</Text>
            </View>

            <Text style={[styles.heroTitle, { color: theme.text }]}>Upgrade ke Pro</Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Fitur lebih lengkap untuk catatan keuangan.
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            {PREMIUM_FEATURES.map((feature) => (
              <View
                key={feature.title}
                style={[
                  styles.featureCard, 
                  { 
                    borderRadius: getRadius(72),
                    borderColor: theme.border,
                    backgroundColor: theme.card,
                  }
                ]}
              >
                <Text style={[styles.featureTitle, { color: theme.text }]}>{feature.title}</Text>
                <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>{feature.description}</Text>
              </View>
            ))}
          </View>

          <View style={styles.pricingSection}>
            <Text style={[styles.pricingHeader, { color: theme.text }]}>Pilih paket</Text>
            
            <View style={styles.plansContainer}>
              <TouchableOpacity
                style={[
                  styles.planCard,
                  { 
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    borderRadius: getRadius(240) 
                  },
                  selectedPlan === 'monthly' && [styles.selectedPlanCard, { borderColor: theme.tint, backgroundColor: theme.tint + '10' }]
                ]}
                onPress={() => setSelectedPlan('monthly')}
                activeOpacity={0.7}
              >
                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: theme.textSecondary }, selectedPlan === 'monthly' && { color: theme.text }]}>Bulanan</Text>
                  {selectedPlan === 'monthly' && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.tint} />
                  )}
                </View>
                <Text style={[styles.planPrice, { color: theme.text }]}>Rp 19rb<Text style={styles.planPeriod}>/bln</Text></Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.planCard,
                  { 
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    borderRadius: getRadius(240) 
                  },
                  selectedPlan === 'yearly' && [styles.selectedPlanCard, { borderColor: theme.tint, backgroundColor: theme.tint + '10' }]
                ]}
                onPress={() => setSelectedPlan('yearly')}
                activeOpacity={0.7}
              >
                <View style={[styles.planBadge, { backgroundColor: theme.tint, borderRadius: getRadius(100, 'small') }]}>
                  <Text style={styles.planBadgeText}>Hemat 35%</Text>
                </View>
                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: theme.textSecondary }, selectedPlan === 'yearly' && { color: theme.text }]}>Tahunan</Text>
                  {selectedPlan === 'yearly' && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.tint} />
                  )}
                </View>
                <Text style={[styles.planPrice, { color: theme.text }]}>Rp 149rb<Text style={styles.planPeriod}>/thn</Text></Text>
                <Text style={[styles.planSavings, { color: theme.tint }]}>Hanya Rp 12.400 / bln</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <TouchableOpacity style={[styles.subscribeButton, { backgroundColor: theme.tint, borderRadius: getRadius(56, 'small') }]} activeOpacity={0.8}>
          <Text style={styles.subscribeButtonText}>
            {selectedPlan === 'yearly' ? 'Mulai Tahunan' : 'Mulai Bulanan'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => router.push('/privacy-security')}>
            <Text style={[styles.legalLinkText, { color: theme.textSecondary }]}>Privasi</Text>
          </TouchableOpacity>
          <View style={[styles.legalDivider, { backgroundColor: theme.border }]} />
          <TouchableOpacity onPress={() => {}}>
            <Text style={[styles.legalLinkText, { color: theme.textSecondary }]}>Pulihkan</Text>
          </TouchableOpacity>
          <View style={[styles.legalDivider, { backgroundColor: theme.border }]} />
          <TouchableOpacity onPress={() => {}}>
            <Text style={[styles.legalLinkText, { color: theme.textSecondary }]}>Ketentuan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150,
  },
  heroSection: {
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 24,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
    marginBottom: 14,
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 28,
  },
  featureCard: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  pricingSection: {
    paddingHorizontal: 20,
  },
  pricingHeader: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  plansContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  planCard: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedPlanCard: {
    borderWidth: 2,
  },
  planBadge: {
    position: 'absolute',
    top: -12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 1,
  },
  planBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  planPrice: {
    fontSize: 21,
    fontWeight: '800',
  },
  planPeriod: {
    fontSize: 14,
    fontWeight: '400',
    color: '#94A3B8',
  },
  planSavings: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 18,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 12,
  },
  legalLinkText: {
    fontSize: 11,
    fontWeight: '600',
  },
  legalDivider: {
    width: 1,
    height: 10,
  },
});
