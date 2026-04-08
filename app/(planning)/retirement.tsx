import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  Keyboard,
  ActivityIndicator,
  StyleSheet,
  useColorScheme as useNativeColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@/lib/utils/format';
import { Colors, getRadius } from '@/constants/theme';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { Header } from '@/components/ui/header';
import { useTranslation } from 'react-i18next';

type Message = {
  id: string;
  type: 'bot' | 'user';
  text: string;
  data?: any;
};

export default function RetirementChatPlan() {
  const { t } = useTranslation();
  const colorScheme = useNativeColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const scrollRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', type: 'bot', text: t('retirement.msg1') },
    { id: '2', type: 'bot', text: t('retirement.msg2') },
  ]);

  const [input, setInput] = useState('');
  const [step, setStep] = useState(0); 
  const [isTyping, setIsTyping] = useState(false);
  const [financeData, setFinanceData] = useState({
    monthlySpend: 0,
    currentAge: 0,
    retireAge: 0,
    currentSaving: 0,
    monthlyInvest: 0
  });

  const handleSend = () => {
    if (!input || isTyping) return;
    const val = parseFloat(input.replace(/[^0-9]/g, '')) || 0;
    const userMsg: Message = { id: Date.now().toString(), type: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let nextBotText = '';
      let updatedData = { ...financeData };
      if (step === 0) { updatedData.monthlySpend = val; nextBotText = t('retirement.msg3', { amount: formatCurrency(val * 12) }); }
      else if (step === 1) { updatedData.currentAge = val; nextBotText = t('retirement.msg4'); }
      else if (step === 2) { updatedData.retireAge = val; nextBotText = t('retirement.msg5'); }
      else if (step === 3) { updatedData.currentSaving = val; nextBotText = t('retirement.msg6'); }
      else if (step === 4) { updatedData.monthlyInvest = val; nextBotText = t('retirement.msg7'); setTimeout(() => finalAnalysis(updatedData), 2000); }
      setFinanceData(updatedData);
      setStep(prev => prev + 1);
      if (nextBotText) { setMessages(prev => [...prev, { id: 'bot-' + Date.now(), type: 'bot', text: nextBotText }]); setIsTyping(false); }
    }, 1000);
  };

  const finalAnalysis = (data: any) => {
    setIsTyping(true);
    const inflation = 0.04;
    const years = Math.max(0, data.retireAge - data.currentAge);
    const months = years * 12;
    const annualSpendAtRetire = (data.monthlySpend * 12) * Math.pow(1 + inflation, years);
    const moneyNeeded = annualSpendAtRetire / 0.04;
    const roi = 0.08 / 12;
    let fv = data.currentSaving * Math.pow(1 + roi, months);
    if (roi > 0) fv += data.monthlyInvest * ((Math.pow(1 + roi, months) - 1) / roi);
    else fv += data.monthlyInvest * months;
    const totalPokok = data.currentSaving + (data.monthlyInvest * months);
    const resultData = { moneyNeeded, fv, totalPokok, totalProfit: fv - totalPokok, isSuccess: fv >= moneyNeeded, years, monthlyPassive: (fv * 0.06) / 12 };
    setMessages(prev => [...prev, { id: 'result-final', type: 'bot', text: t('retirement.msg8'), data: resultData }]);
    setIsTyping(false); setStep(5);
  };

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => { setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100); });
    return () => showSub.remove();
  }, []);

  useEffect(() => { setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200); }, [messages, isTyping]);

  return (
    <ScreenWrapper backgroundColor={theme.background}>
      <Header title={t('retirement.bot_name')} />
      
      <ScrollView ref={scrollRef} style={styles.chatArea} contentContainerStyle={{ paddingVertical: 20 }} showsVerticalScrollIndicator={false}>
        {messages.map((m) => (
          <View key={m.id} style={[styles.messageContainer, m.type === 'user' ? styles.userAlign : styles.botAlign]}>
            <View style={[
              styles.bubble, 
              m.type === 'user' ? { backgroundColor: theme.tint } : { backgroundColor: isDark ? '#1a1a1a' : '#f1f5f9' }, 
              { borderRadius: getRadius(50) }, 
              m.type === 'user' ? { borderTopRightRadius: 0 } : { borderTopLeftRadius: 0 }
            ]}>
              <Text style={[
                styles.bubbleText, 
                m.type === 'user' ? { color: '#fff' } : { color: theme.text },
                { fontWeight: '700' }
              ]}>{m.text}</Text>
            </View>

            {m.data && (
              <View style={[styles.resultCard, { 
                borderRadius: getRadius(320, 'large'),
                backgroundColor: isDark ? '#1a1a1a' : '#fff',
                borderColor: isDark ? '#262626' : '#f1f5f9'
              }]}>
                <Text style={[styles.resultHeader, { color: isDark ? '#475569' : '#94a3b8' }]}>{t('retirement.target_fund')}</Text>
                <Text style={[styles.resultAmount, { color: theme.text }]}>{formatCurrency(m.data.moneyNeeded)}</Text>
                <View style={[styles.divider, { backgroundColor: isDark ? '#262626' : '#f1f5f9' }]} />
                <View style={[styles.statusBox, { 
                  backgroundColor: m.data.isSuccess ? (isDark ? '#064e3b' : '#ecfdf5') : (isDark ? '#431407' : '#fff7ed'), 
                  borderColor: m.data.isSuccess ? '#10b981' : '#f97316', 
                  borderRadius: getRadius(52) 
                }]}>
                  <Text style={[styles.statusText, { color: m.data.isSuccess ? (isDark ? '#10b981' : '#047857') : (isDark ? '#f97316' : '#c2410c') }]}>
                    {m.data.isSuccess ? t('retirement.success_msg') : t('retirement.fail_msg')}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Estimasi Dana</Text>
                  <Text style={[styles.detailVal, { color: theme.text }]}>{formatCurrency(m.data.fv)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Passive Income</Text>
                  <Text style={[styles.detailVal, { color: theme.tint }]}>{formatCurrency(m.data.monthlyPassive)}/bln</Text>
                </View>
                
                <View style={styles.breakdown}>
                  <Text style={[styles.breakdownHeader, { color: isDark ? '#475569' : '#cbd5e1' }]}>BREAKDOWN STRATEGI</Text>
                  <View style={styles.barContainer}>
                    <View style={{ flex: m.data.totalPokok, backgroundColor: theme.tint }} />
                    <View style={{ flex: m.data.totalProfit, backgroundColor: '#f59e0b' }} />
                  </View>
                  <View style={styles.legendRow}>
                    <View>
                      <Text style={[styles.legPct, { color: theme.tint }]}>{((m.data.totalPokok/m.data.fv)*100).toFixed(0)}%</Text>
                      <Text style={[styles.legLabel, { color: isDark ? '#475569' : '#94a3b8' }]}>POKOK</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.legPct, { color: '#f59e0b' }]}>{((m.data.totalProfit/m.data.fv)*100).toFixed(0)}%</Text>
                      <Text style={[styles.legLabel, { color: isDark ? '#475569' : '#94a3b8' }]}>PROFIT</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}
        {isTyping && <View style={[styles.typingBubble, { 
          borderRadius: getRadius(44),
          backgroundColor: isDark ? '#1a1a1a' : '#f8fafc'
        }]}>
          <ActivityIndicator size="small" color={isDark ? theme.tint : "#94a3b8"} />
        </View>}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
        <View style={[styles.inputContainer, { 
          backgroundColor: theme.background,
          borderTopColor: isDark ? '#1a1a1a' : '#f1f5f9'
        }]}>
          <View style={[styles.inputWrapper, { 
            borderRadius: getRadius(56),
            backgroundColor: isDark ? '#0a0a0a' : '#f8fafc',
            borderColor: isDark ? '#1a1a1a' : '#f1f5f9'
          }]}>
            <TextInput 
              style={[styles.input, { color: theme.text }]} 
              placeholder={step > 4 ? "Selesai" : "Ketik angka..."} 
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
              keyboardType="numeric" 
              value={input} 
              onChangeText={setInput} 
              onSubmitEditing={handleSend} 
              editable={step <= 4} 
            />
            <TouchableOpacity 
              onPress={handleSend} 
              disabled={!input} 
              style={[styles.sendBtn, { 
                backgroundColor: input ? theme.tint : (isDark ? '#1a1a1a' : '#f1f5f9'), 
                borderRadius: getRadius(44) 
              }]}
            >
              <Ionicons name="arrow-up" size={20} color={input ? "#fff" : (isDark ? '#475569' : "#cbd5e1")} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  chatArea: { flex: 1, paddingHorizontal: 20 },
  messageContainer: { marginBottom: 20 },
  userAlign: { alignItems: 'flex-end' },
  botAlign: { alignItems: 'flex-start' },
  bubble: { paddingHorizontal: 18, paddingVertical: 14, maxWidth: '85%' },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  typingBubble: { width: 60, height: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  resultCard: { width: '100%', padding: 24, marginTop: 12, borderWidth: 1, elevation: 2, shadowOpacity: 0.05 },
  resultHeader: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  resultAmount: { fontSize: 28, fontWeight: '900', marginVertical: 8 },
  divider: { height: 1, marginVertical: 20 },
  statusBox: { paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderStyle: 'dotted', marginBottom: 20 },
  statusText: { fontSize: 12, fontWeight: '800' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailLabel: { fontSize: 13, fontWeight: '700' },
  detailVal: { fontSize: 14, fontWeight: '800' },
  breakdown: { marginTop: 12 },
  breakdownHeader: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5, marginBottom: 10 },
  barContainer: { height: 8, flexDirection: 'row', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between' },
  legPct: { fontSize: 12, fontWeight: '900' },
  legLabel: { fontSize: 8, fontWeight: '800' },
  inputContainer: { padding: 16, borderTopWidth: 1 },
  inputWrapper: { flexDirection: 'row', padding: 6, alignItems: 'center', borderWidth: 1 },
  input: { flex: 1, paddingHorizontal: 16, height: 44, fontSize: 16, fontWeight: '700' },
  sendBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
