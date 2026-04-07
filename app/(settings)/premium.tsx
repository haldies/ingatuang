import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
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

import { Header } from '@/components/ui/header';

export default function PremiumScreen() {
  const router = useRouter();
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
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#0F172A']}
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
              <Animated.View style={[styles.glowEffect, glowStyle]} />
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.premiumBadge}
              >
                <Ionicons name="star" size={16} color="#000" />
                <Text style={styles.premiumBadgeText}>PREMIUM ACCESS</Text>
              </LinearGradient>
            </View>

            <Text style={styles.heroTitle}>Upgrade ke Pro</Text>
            <Text style={styles.heroSubtitle}>
              Kelola keuangan lebih cerdas dengan fitur eksklusif IngatUang Pro.
            </Text>
          </Animated.View>

          {/* Features Grid */}
          <View style={styles.featuresContainer}>
            {PREMIUM_FEATURES.map((feature, index) => (
              <Animated.View
                key={feature.title}
                entering={FadeInDown.delay(200 + index * 100).duration(800)}
                style={styles.featureCard}
              >
                <BlurView intensity={20} tint="dark" style={styles.featureBlur}>
                  <View style={[styles.featureIconContainer, { backgroundColor: feature.color + '20' }]}>
                    <Ionicons name={feature.icon as any} size={24} color={feature.color} />
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
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
            <Text style={styles.pricingHeader}>Pilih Paket Anda</Text>
            
            <View style={styles.plansContainer}>
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'monthly' && styles.selectedPlanCard
                ]}
                onPress={() => setSelectedPlan('monthly')}
                activeOpacity={0.7}
              >
                <View style={styles.planHeader}>
                  <Text style={[styles.planName, selectedPlan === 'monthly' && styles.selectedPlanText]}>Bulanan</Text>
                  {selectedPlan === 'monthly' && (
                    <Ionicons name="checkmark-circle" size={20} color="#F59E0B" />
                  )}
                </View>
                <Text style={styles.planPrice}>Rp 19rb<Text style={styles.planPeriod}>/bln</Text></Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'yearly' && styles.selectedPlanCard
                ]}
                onPress={() => setSelectedPlan('yearly')}
                activeOpacity={0.7}
              >
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>Hemat 35%</Text>
                </View>
                <View style={styles.planHeader}>
                  <Text style={[styles.planName, selectedPlan === 'yearly' && styles.selectedPlanText]}>Tahunan</Text>
                  {selectedPlan === 'yearly' && (
                    <Ionicons name="checkmark-circle" size={20} color="#F59E0B" />
                  )}
                </View>
                <Text style={styles.planPrice}>Rp 149rb<Text style={styles.planPeriod}>/thn</Text></Text>
                <Text style={styles.planSavings}>Hanya Rp 12.400 / bln</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* Footer / Subscribe Button Overlay */}
      <BlurView intensity={80} tint="dark" style={styles.footer}>
        <TouchableOpacity style={styles.subscribeButton} activeOpacity={0.8}>
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
          <View style={styles.legalDivider} />
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.legalLinkText}>Restore Purchase</Text>
          </TouchableOpacity>
          <View style={styles.legalDivider} />
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
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 150,
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
    borderRadius: 20,
    backgroundColor: '#F59E0B',
    opacity: 0.5,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 40,
  },
  featureCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  pricingSection: {
    paddingHorizontal: 20,
  },
  pricingHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  plansContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  planCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedPlanCard: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  planBadge: {
    position: 'absolute',
    top: -12,
    right: 12,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
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
    color: '#94A3B8',
    flex: 1,
  },
  selectedPlanText: {
    color: '#fff',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  planPeriod: {
    fontSize: 14,
    fontWeight: '400',
    color: '#94A3B8',
  },
  planSavings: {
    fontSize: 11,
    color: '#F59E0B',
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
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  subscribeButton: {
    borderRadius: 16,
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
    backgroundColor: '#334155',
  },
});
