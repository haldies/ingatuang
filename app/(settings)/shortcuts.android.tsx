import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Header } from '@/components/ui/header';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { getRadius } from '@/constants/theme';

export default function ShortcutsAndroidScreen() {
  const shortcutItems = [
    {
      id: 'ai',
      title: 'Voice Add (AI)',
      command: 'Katakan: "Ok Google, catat..."',
      icon: 'mic',
      color: '#3b82f6',
    },
    {
      id: 'manual',
      title: 'Manual Shortcut',
      command: 'Input form cepat',
      icon: 'edit-3',
      color: '#10b981',
    },
  ];

  return (
    <ScreenWrapper backgroundColor="#fff">
      <Header title="Android Shortcuts" />

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.list}>
          {shortcutItems.map((item) => (
            <View key={item.id} style={[styles.card, { borderRadius: getRadius(100, 'medium') }]}>
              <View style={[styles.iconBox, { backgroundColor: item.color + '15', borderRadius: getRadius(48, 'small') }]}>
                <Feather name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={styles.textDetails}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.commandText}>{item.command}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Fitur ini memanfaatkan asisten suara Android Anda.
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 20 },
  list: { gap: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  iconBox: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textDetails: { flex: 1, marginLeft: 16 },
  title: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  commandText: { fontSize: 12, color: '#64748b', marginTop: 4, fontStyle: 'italic' },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 12, color: '#94a3b8', textAlign: 'center' },
});
