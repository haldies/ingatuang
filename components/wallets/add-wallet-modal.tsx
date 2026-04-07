import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type Wallet, storage } from '@/lib/storage/storage-adapter';
import { Colors, getRadius } from '@/constants/theme';

interface AddWalletModalProps {
  visible: boolean;
  onClose: () => void;
  wallet?: Wallet | null;
  onSuccess: () => void;
}

const WALLET_ICONS = ['wallet', 'card', 'cash', 'business', 'home', 'car', 'gift', 'heart', 'airplane', 'briefcase', 'book', 'cart', 'cafe', 'game-controller'];
const WALLET_COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#6366f1', '#4b5563'];

export function AddWalletModal({ visible, onClose, wallet, onSuccess }: AddWalletModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('wallet');
  const [color, setColor] = useState(Colors.light.tint);

  useEffect(() => {
    if (wallet) {
      setName(wallet.name);
      setIcon(wallet.icon);
      setColor(wallet.color);
    } else {
      setName('');
      setIcon('wallet');
      setColor(Colors.light.tint);
    }
  }, [wallet, visible]);

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (wallet) {
        await storage.updateWallet(wallet.id, { name: name.trim(), icon, color });
      } else {
        await storage.addWallet({ id: Date.now().toString(), name: name.trim(), icon, color, createdAt: new Date().toISOString() });
      }
      onSuccess();
      onClose();
    } catch (error) { console.error(error); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContent}>
          <View style={[styles.sheet, { borderTopLeftRadius: getRadius(400, 'large'), borderTopRightRadius: getRadius(400, 'large') }]}>
            <View style={styles.header}>
              <Text style={styles.title}>{wallet ? 'Ubah Dompet' : 'Tambah Dompet'}</Text>
              <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#0f172a" /></TouchableOpacity>
            </View>
            <View style={styles.body}>
              <Text style={styles.label}>NAMA DOMPET</Text>
              <TextInput style={[styles.input, { borderRadius: getRadius(56) }]} placeholder="Masukkan nama dompet..." value={name} onChangeText={setName} />
              
              <Text style={styles.label}>PILIH IKON</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                {WALLET_ICONS.map(i => (
                  <TouchableOpacity key={i} style={[styles.iconItem, icon === i && { borderColor: color, backgroundColor: color + '15' }, { borderRadius: getRadius(100) }]} onPress={() => setIcon(i)}>
                    <Ionicons name={i as any} size={24} color={icon === i ? color : '#64748b'} />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>WARNA TEMA</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                {WALLET_COLORS.map(c => (
                  <TouchableOpacity key={c} style={[styles.colorItem, { backgroundColor: c }, color === c && { borderWidth: 3, borderColor: '#000' }]} onPress={() => setColor(c)} />
                ))}
              </ScrollView>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.light.tint, borderRadius: getRadius(56) }]} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { width: '100%' },
  sheet: { backgroundColor: '#fff', paddingBottom: 40 },
  header: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  body: { padding: 24 },
  label: { fontSize: 10, fontWeight: '800', color: '#94a3b8', marginBottom: 12, letterSpacing: 0.5 },
  input: { backgroundColor: '#f8fafc', padding: 16, fontSize: 16, color: '#0f172a', borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 24 },
  pickerScroll: { marginBottom: 24 },
  iconItem: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', marginRight: 10, borderWidth: 1.5, borderColor: '#f1f5f9' },
  colorItem: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  saveBtn: { paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
