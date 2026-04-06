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
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { formatCurrency } from '@/lib/utils/format';
import { Colors } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

type Message = {
  id: string;
  type: 'bot' | 'user';
  text: string;
  data?: any; // To hold results if it's the final message
};

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
      let nextStep = step + 1;
      let updatedData = { ...financeData };

      if (step === 0) {
        updatedData.monthlySpend = val;
        nextBotText = t('retirement.msg3', { amount: formatCurrency(val * 12) });
      } else if (step === 1) {
        updatedData.currentAge = val;
        nextBotText = t('retirement.msg4');
      } else if (step === 2) {
        updatedData.retireAge = val;
        nextBotText = t('retirement.msg5');
      } else if (step === 3) {
        updatedData.currentSaving = val;
        nextBotText = t('retirement.msg6');
      } else if (step === 4) {
        updatedData.monthlyInvest = val;
        nextBotText = t('retirement.msg7');
        setTimeout(() => finalAnalysis(updatedData), 2000);
      }

      setFinanceData(updatedData);
      setStep(nextStep);
      if (nextBotText) {
        setMessages(prev => [...prev, { id: 'bot-' + Date.now(), type: 'bot', text: nextBotText }]);
        setIsTyping(false);
      }
    }, 1000);
  };

  const finalAnalysis = (data: any) => {
    setIsTyping(true);
    const inflation = 0.04;
    const years = Math.max(0, data.retireAge - data.currentAge);
    const months = years * 12;
    const annualSpendAtRetire = (data.monthlySpend * 12) * Math.pow(1 + inflation, years);
    
    // Rule 4% = Money Needed to live forever on interest (Annual / 0.04)
    const moneyNeeded = annualSpendAtRetire / 0.04;

    const roi = 0.08 / 12; // Assuming moderate 8% annual return
    let fv = data.currentSaving * Math.pow(1 + roi, months);
    if (roi > 0) {
      fv += data.monthlyInvest * ((Math.pow(1 + roi, months) - 1) / roi);
    } else {
      fv += data.monthlyInvest * months;
    }

    const totalPokok = data.currentSaving + (data.monthlyInvest * months);
    const totalProfit = fv - totalPokok;
    const isSuccess = fv >= moneyNeeded;

    const resultData = {
      moneyNeeded,
      fv,
      totalPokok,
      totalProfit,
      isSuccess,
      years,
      monthlyPassive: (fv * 0.06) / 12 // Using 6% safe withdrawal for monthly display
    };

    setMessages(prev => [...prev, {
      id: 'result-final',
      type: 'bot',
      text: t('retirement.msg8'),
      data: resultData
    }]);
    setIsTyping(false);
    setStep(5);
  };

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    );
    return () => showSub.remove();
  }, []);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  }, [messages, isTyping]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-100 flex-row items-center bg-white z-10">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <View className="ml-2 flex-row items-center">
          <View 
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: Colors.light.tint + '15' }}
          >
            <Ionicons name="sparkles" size={16} color={Colors.light.tint} />
          </View>
          <View className="ml-3">
            <Text className="font-bold text-gray-900 text-sm">{t('retirement.bot_name')}</Text>
            <View className="flex-row items-center">
              <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
              <Text className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Online</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView 
        ref={scrollRef}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m) => (
          <View key={m.id} className={`mb-6 ${m.type === 'user' ? 'items-end' : 'items-start'}`}>
            <View 
              className={`max-w-[85%] p-4 rounded-2xl ${m.type === 'user' ? 'rounded-tr-none' : 'bg-gray-100 rounded-tl-none shadow-sm'}`}
              style={m.type === 'user' ? { backgroundColor: Colors.light.tint } : {}}
            >
              <Text className={`${m.type === 'user' ? 'text-white font-medium' : 'text-gray-800'} leading-5`}>
                {m.text}
              </Text>
            </View>

            {m.data && (
              <View className="mt-4 w-full bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{t('retirement.target_fund')}</Text>
                <Text className="text-gray-900 text-2xl font-black mb-6">{formatCurrency(m.data.moneyNeeded)}</Text>
                
                <View className="h-[1px] bg-gray-100 mb-6" />
                
                <View 
                  className="p-4 rounded-2xl mb-6 border"
                  style={{ 
                    backgroundColor: m.data.isSuccess ? '#ecfdf5' : '#fff7ed',
                    borderColor: m.data.isSuccess ? '#10b981' : '#f97316',
                    borderStyle: 'dashed'
                  }}
                >
                   <Text className={`text-center font-black text-xs ${m.data.isSuccess ? 'text-emerald-700' : 'text-orange-700'}`}>
                     {m.data.isSuccess ? t('retirement.success_msg') : t('retirement.fail_msg')}
                   </Text>
                </View>

                <View className="space-y-4 mb-8">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-500 text-xs font-medium">{t('retirement.estimated_funds')}</Text>
                    <Text className="text-gray-900 font-bold">{formatCurrency(m.data.fv)}</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-500 text-xs font-medium">{t('retirement.passive_income')}</Text>
                    <Text className="font-bold" style={{ color: Colors.light.tint }}>{formatCurrency(m.data.monthlyPassive)} / {t('common.months').toLowerCase()}</Text>
                  </View>
                  {!m.data.isSuccess && (
                     <View className="flex-row justify-between items-center bg-red-50 p-2 rounded-lg mt-2">
                        <Text className="text-red-600 text-xs font-bold">{t('retirement.shortfall')}</Text>
                        <Text className="text-red-700 font-bold">{formatCurrency(m.data.moneyNeeded - m.data.fv)}</Text>
                     </View>
                  )}
                </View>

                {/* Progress Breakdown */}
                <View>
                  <Text className="text-gray-400 font-black text-[9px] mb-3 uppercase tracking-widest">Breakdown Strategi</Text>
                  <View className="flex-row h-2 rounded-full overflow-hidden bg-gray-100 mb-4">
                    <View style={{ flex: m.data.totalPokok, backgroundColor: Colors.light.tint }} />
                    <View style={{ flex: m.data.totalProfit, backgroundColor: '#f97316' }} />
                  </View>
                  
                  <View className="flex-row justify-between items-start">
                    <View>
                      <Text className="text-[10px] font-black" style={{ color: Colors.light.tint }}>{((m.data.totalPokok / m.data.fv) * 100).toFixed(1)}%</Text>
                      <Text className="text-gray-900 font-bold text-[11px] mt-0.5">{formatCurrency(m.data.totalPokok)}</Text>
                      <Text className="text-gray-400 text-[8px] font-bold uppercase">{t('retirement.pokok_label')}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-orange-500 text-[10px] font-black">{((m.data.totalProfit / m.data.fv) * 100).toFixed(1)}%</Text>
                      <Text className="text-gray-900 font-bold text-[11px] mt-0.5">{formatCurrency(m.data.totalProfit)}</Text>
                      <Text className="text-gray-400 text-[8px] font-bold uppercase">{t('retirement.invest_result_label')}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}
        {isTyping && (
          <View className="bg-gray-100 p-4 rounded-2xl rounded-tl-none self-start w-16 mb-5">
            <ActivityIndicator size="small" color="#9ca3af" />
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        className="bg-white"
      >
        <View className="p-4 border-t border-gray-100 flex-row bg-white items-center">
          <View className="flex-1 bg-gray-50 rounded-2xl px-4 py-1 flex-row items-center border border-gray-100">
            <TextInput
              className="flex-1 text-gray-900 py-3"
              placeholder={step > 4 ? t('retirement.finished') : t('retirement.input_placeholder')}
              keyboardType="numeric"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              editable={step <= 4}
            />
            {step <= 4 && (
              <TouchableOpacity 
                onPress={handleSend}
                disabled={!input}
                className="w-9 h-9 rounded-xl items-center justify-center"
                style={{ backgroundColor: input ? Colors.light.tint : '#e5e7eb' }}
              >
                <Ionicons name="arrow-up" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
