import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  useColorScheme as useNativeColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  useSharedValue,
} from 'react-native-reanimated';
import { Colors, getRadius } from '@/constants/theme';
import { Header } from '@/components/ui/header';

const { width } = Dimensions.get('window');

const PREMIUM_FEATURES = [
  {
    order: 1,
    icon: 'infinite',
    title: 'AI Tanpa Batas',
    description: 'Catat transaksi otomatis sepuasnya dengan bantuan AI cerdas.',
    color: '#8B5CF6',
  },
  {
    order: 2,
    icon: 'cloud-upload',
    title: 'Cloud Sync',
    description: 'Data Anda aman di awan dan dapat diakses dari perangkat mana pun.',
    color: '#3B82F6',
  },
  {
    order: 3,
    icon: 'document-text',
    title: 'Export Laporan',
    description: 'Download laporan keuangan dalam format Excel atau PDF secara instan.',
    color: '#10B981',
  },
  {
    order: 4,
    icon: 'color-palette',
    title: 'Tema Kustom',
    description: 'Personalisasi tampilan aplikasi dengan beragam tema premium.',
    color: '#F59E0B',
  },
  {
    order: 5,
    icon: 'shield-checkmark',
    title: 'Keamanan Ekstra',
    description: 'Proteksi aplikasi dengan Biometric (FaceID/Fingerprint).',
    color: '#EF4444',
  },
];

export default function PremiumScreen() {
  const router = useRouter();
  const colorScheme = useNativeColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const [selectedPlan, setSelectedPlan] = React.useState<'monthly' | 'yearly'>('yearly');
  
  const glowValue = useSharedValue(0.4);

  React.useEffect(() => {
    glowValue.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0.4, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowValue.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : theme.background }]}>
      <LinearGradient
        colors={isDark ? ['#0F172A', '#000', '#000'] : ['#F8FAFC', '#FFFFFF', '#F8FAFC']}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header title="Premium Access" transparent />

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero Section */}
          <Animated.View 
            entering={FadeInDown.duration(800)}
            style={styles.heroSection}
          >
            <View style={styles.premiumBadgeContainer}>
              <Animated.View style={[styles.glowEffect, glowStyle, { borderRadius: getRadius(200, 'small') }]} />
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={[styles.premiumBadge, { borderRadius: getRadius(200, 'small') }]}
              >
                <Ionicons name="star" size={16} color="#000" />
                <Text style={styles.premiumBadgeText}>PREMIUM ACCESS</Text>
              </LinearGradient>
            </View>

            <Text style={[styles.heroTitle, { color: theme.text }]}>Upgrade ke Pro</Text>
            <Text style={[styles.heroSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Kelola keuangan lebih cerdas dengan fitur eksklusif IngatUang Pro.
            </Text>
          </Animated.View>

          {/* Features Grid */}
          <View style={styles.featuresContainer}>
            {PREMIUM_FEATURES.map((feature, index) => (
              <Animated.View
                key={feature.title}
                entering={FadeInDown.delay(200 + index * 100).duration(800)}
                style={[
                  styles.featureCard, 
                  { 
                    borderRadius: getRadius(200),
                    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' 
                  }
                ]}
              >
                <BlurView intensity={isDark ? 20 : 10} tint={isDark ? "dark" : "light"} style={styles.featureBlur}>
                  <View style={[styles.featureIconContainer, { backgroundColor: feature.color + '20', borderRadius: getRadius(140, 'small') }]}>
                    <Ionicons name={feature.icon as any} size={24} color={feature.color} />
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={[styles.featureTitle, { color: theme.text }]}>{feature.title}</Text>
                    <Text style={[styles.featureDescription, { color: isDark ? '#94A3B8' : '#64748B' }]}>{feature.description}</Text>
                  </View>
                </BlurView>
              </Animated.View>
            ))}
          </View>

          {/* Pricing Section */}
          <Animated.View 
            entering={FadeInUp.delay(800).duration(800)}
            style={styles.pricingSection}
          >
            <Text style={[styles.pricingHeader, { color: theme.text }]}>Pilih Paket Anda</Text>
            
            <View style={styles.plansContainer}>
              <TouchableOpacity
                style={[
                  styles.planCard,
                  { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    borderRadius: getRadius(240) 
                  },
                  selectedPlan === 'monthly' && [styles.selectedPlanCard, { borderColor: theme.tint, backgroundColor: theme.tint + '10' }]
                ]}
                onPress={() => setSelectedPlan('monthly')}
                activeOpacity={0.7}
              >
                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: isDark ? '#94A3B8' : '#64748B' }, selectedPlan === 'monthly' && { color: theme.text }]}>Bulanan</Text>
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
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
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
                  <Text style={[styles.planName, { color: isDark ? '#94A3B8' : '#64748B' }, selectedPlan === 'yearly' && { color: theme.text }]}>Tahunan</Text>
                  {selectedPlan === 'yearly' && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.tint} />
                  )}
                </View>
                <Text style={[styles.planPrice, { color: theme.text }]}>Rp 149rb<Text style={styles.planPeriod}>/thn</Text></Text>
                <Text style={[styles.planSavings, { color: theme.tint }]}>Hanya Rp 12.400 / bln</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* Footer / Subscribe Button Overlay */}
      <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={[styles.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
        <TouchableOpacity style={[styles.subscribeButton, { borderRadius: getRadius(160, 'small') }]} activeOpacity={0.8}>
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.subscribeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.subscribeButtonText}>
              {selectedPlan === 'yearly' ? 'Mulai Langganan Tahunan' : 'Mulai Langganan Bulanan'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#000" />
          </LinearGradient>
        </TouchableOpacity>
        
        {/* Apple Store Compliance Links */}
        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => router.push('/privacy-security')}>
            <Text style={styles.legalLinkText}>Privacy Policy</Text>
          </TouchableOpacity>
          <View style={[styles.legalDivider, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.legalLinkText}>Restore Purchase</Text>
          </TouchableOpacity>
          <View style={[styles.legalDivider, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.legalLinkText}>Terms of Use</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.cancelText}>Tagihan akan diproses melalui akun App Store Anda. Langganan diperbarui otomatis kecuali dibatalkan minimal 24 jam sebelum masa berakhir.</Text>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 180,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 10,
    marginBottom: 40,
  },
  premiumBadgeContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    backgroundColor: '#F59E0B',
    opacity: 0.5,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  premiumBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 40,
  },
  featureCard: {
    overflow: 'hidden',
    borderWidth: 1,
  },
  featureBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  plansContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  planCard: {
    flex: 1,
    padding: 20,
    borderWidth: 2,
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
    color: '#000',
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
    fontSize: 24,
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
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  subscribeButton: {
    overflow: 'hidden',
  },
  subscribeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  subscribeButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },
  cancelText: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 14,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 12,
  },
  legalLinkText: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },
  legalDivider: {
    width: 1,
    height: 10,
  },
});
