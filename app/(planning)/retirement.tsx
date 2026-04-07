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
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

const { width } = Dimensions.get('window');

export default function RetirementChatPlan() {
  const router = useRouter();
  const { t } = useTranslation();
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
    <ScreenWrapper backgroundColor="#fff">
      <Header title={t('retirement.bot_name')} />
      
      <ScrollView ref={scrollRef} style={styles.chatArea} contentContainerStyle={{ paddingVertical: 20 }} showsVerticalScrollIndicator={false}>
        {messages.map((m) => (
          <View key={m.id} style={[styles.messageContainer, m.type === 'user' ? styles.userAlign : styles.botAlign]}>
            <View style={[styles.bubble, m.type === 'user' ? styles.userBubble : styles.botBubble, { borderRadius: getRadius(50) }, m.type === 'user' ? { borderTopRightRadius: 0 } : { borderTopLeftRadius: 0 }]}>
              <Text style={[styles.bubbleText, m.type === 'user' ? styles.userText : styles.botText]}>{m.text}</Text>
            </View>

            {m.data && (
              <View style={[styles.resultCard, { borderRadius: getRadius(320, 'large') }]}>
                <Text style={styles.resultHeader}>{t('retirement.target_fund')}</Text>
                <Text style={styles.resultAmount}>{formatCurrency(m.data.moneyNeeded)}</Text>
                <View style={styles.divider} />
                <View style={[styles.statusBox, { backgroundColor: m.data.isSuccess ? '#ecfdf5' : '#fff7ed', borderColor: m.data.isSuccess ? '#10b981' : '#f97316', borderRadius: getRadius(52) }]}>
                  <Text style={[styles.statusText, { color: m.data.isSuccess ? '#047857' : '#c2410c' }]}>{m.data.isSuccess ? t('retirement.success_msg') : t('retirement.fail_msg')}</Text>
                </View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Estimasi Dana</Text><Text style={styles.detailVal}>{formatCurrency(m.data.fv)}</Text></View>
                <View style={styles.detailRow}><Text style={styles.detailLabel}>Passive Income</Text><Text style={[styles.detailVal, { color: Colors.light.tint }]}>{formatCurrency(m.data.monthlyPassive)}/bln</Text></View>
                
                <View style={styles.breakdown}>
                  <Text style={styles.breakdownHeader}>BREAKDOWN STRATEGI</Text>
                  <View style={styles.barContainer}><View style={{ flex: m.data.totalPokok, backgroundColor: Colors.light.tint }} /><View style={{ flex: m.data.totalProfit, backgroundColor: '#f59e0b' }} /></View>
                  <View style={styles.legendRow}>
                    <View><Text style={[styles.legPct, { color: Colors.light.tint }]}>{((m.data.totalPokok/m.data.fv)*100).toFixed(0)}%</Text><Text style={styles.legLabel}>POKOK</Text></View>
                    <View style={{ alignItems: 'flex-end' }}><Text style={[styles.legPct, { color: '#f59e0b' }]}>{((m.data.totalProfit/m.data.fv)*100).toFixed(0)}%</Text><Text style={styles.legLabel}>PROFIT</Text></View>
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}
        {isTyping && <View style={[styles.typingBubble, { borderRadius: getRadius(44) }]}><ActivityIndicator size="small" color="#94a3b8" /></View>}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
        <View style={styles.inputContainer}>
          <View style={[styles.inputWrapper, { borderRadius: getRadius(56) }]}>
            <TextInput style={styles.input} placeholder={step > 4 ? "Selesai" : "Ketik angka..."} keyboardType="numeric" value={input} onChangeText={setInput} onSubmitEditing={handleSend} editable={step <= 4} />
            <TouchableOpacity onPress={handleSend} disabled={!input} style={[styles.sendBtn, { backgroundColor: input ? Colors.light.tint : '#f1f5f9', borderRadius: getRadius(44) }]}>
              <Ionicons name="arrow-up" size={20} color={input ? "#fff" : "#cbd5e1"} />
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
  userBubble: { backgroundColor: Colors.light.tint },
  botBubble: { backgroundColor: '#f1f5f9' },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff', fontWeight: '500' },
  botText: { color: '#334155' },
  typingBubble: { width: 60, height: 44, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  resultCard: { width: '100%', backgroundColor: '#fff', padding: 24, marginTop: 12, borderWidth: 1, borderColor: '#f1f5f9', elevation: 2, shadowOpacity: 0.05 },
  resultHeader: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },
  resultAmount: { fontSize: 28, fontWeight: '900', color: '#0f172a', marginVertical: 8 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 20 },
  statusBox: { paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderStyle: 'dotted', marginBottom: 20 },
  statusText: { fontSize: 12, fontWeight: '800' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  detailVal: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  breakdown: { marginTop: 12 },
  breakdownHeader: { fontSize: 9, fontWeight: '900', color: '#cbd5e1', letterSpacing: 0.5, marginBottom: 10 },
  barContainer: { height: 8, flexDirection: 'row', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between' },
  legPct: { fontSize: 12, fontWeight: '900' },
  legLabel: { fontSize: 8, color: '#94a3b8', fontWeight: '800' },
  inputContainer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  inputWrapper: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 6, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  input: { flex: 1, paddingHorizontal: 16, height: 44, fontSize: 16, color: '#0f172a' },
  sendBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
