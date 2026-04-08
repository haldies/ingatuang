import React from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Header } from '@/components/ui/header';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { Colors, getRadius } from '@/constants/theme';

export default function ShortcutsAndroidScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

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
    <ScreenWrapper backgroundColor={theme.background}>
      <Header title="Android Shortcuts" />

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.list}>
          {shortcutItems.map((item) => (
            <View 
              key={item.id} 
              style={[
                styles.card, 
                { 
                  backgroundColor: isDark ? '#1a1a1a' : '#f8fafc',
                  borderColor: isDark ? '#262626' : '#f1f5f9',
                  borderRadius: getRadius(100, 'medium') 
                }
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color + '15', borderRadius: getRadius(48, 'small') }]}>
                <Feather name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={styles.textDetails}>
                <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.commandText, { color: isDark ? '#94a3b8' : '#64748b' }]}>{item.command}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: isDark ? '#404040' : '#94a3b8' }]}>
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
    borderWidth: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textDetails: { flex: 1, marginLeft: 16 },
  title: { fontSize: 16, fontWeight: '700' },
  commandText: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 12, textAlign: 'center' },
});
