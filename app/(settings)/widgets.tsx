import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Header } from '@/components/ui/header';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { Colors, getRadius } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function WidgetsScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const widgetItems = [
    {
      id: 'ai',
      title: t('settings.widgets.voice_add'),
      command: t('settings.widgets.voice_desc'),
      icon: 'mic',
      color: '#3b82f6',
    },
    {
      id: 'manual',
      title: t('settings.widgets.manual_widget'),
      command: t('settings.widgets.manual_desc'),
      icon: 'layout',
      color: '#10b981',
    },
  ];

  return (
    <ScreenWrapper backgroundColor={theme.background}>
      <Header title={t('settings.widgets.title')} />

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.list}>
          {widgetItems.map((item) => (
            <View 
              key={item.id} 
              style={[
                styles.card, 
                { 
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  borderRadius: getRadius(100, 'medium') 
                }
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color + '15', borderRadius: getRadius(48, 'small') }]}>
                <Feather name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={styles.textDetails}>
                <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.commandText, { color: theme.textSecondary }]}>{item.command}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            {t('settings.local_data_notice')}
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingBottom: 60 },
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
