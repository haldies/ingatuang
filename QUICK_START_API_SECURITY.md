# Quick Start - API Security Setup

## 🚀 Quick Setup (5 menit)

### 1. Install Dependencies

```bash
cd mobileApp/ingatuang
npx expo install expo-secure-store
```

### 2. Rebuild App

```bash
npm run android
```

### 3. Configure API Key

1. Buka app
2. **Profile** → **API Settings**
3. Input API key dari backend
4. Klik **Simpan**
5. Klik **Test Koneksi**

✅ Done! API key sekarang tersimpan dengan aman.

---

## 📱 User Flow

```
Profile Screen
    ↓
API Settings
    ↓
Input API Key → [Save] → Encrypted Storage
    ↓
Test Connection → ✅ Success
    ↓
Use Split Bill → API Call with Secure Key
```

---

## 🔐 Security Features

| Feature | Status |
|---------|--------|
| Encrypted Storage | ✅ iOS/Android |
| No Hardcoded Keys | ✅ |
| User Manageable | ✅ |
| Auto-Delete on Uninstall | ✅ |
| Show/Hide Toggle | ✅ |
| Connection Test | ✅ |
| Custom URL Support | ✅ |

---

## 📁 Files Changed

### New Files:
- `lib/secure-storage.ts`
- `app/api-settings.tsx`

### Modified Files:
- `lib/api-client.ts`
- `app/(tabs)/profile.tsx`

---

## 🧪 Testing

```bash
# 1. Save API key
Profile → API Settings → Input → Save

# 2. Restart app
Close and reopen app

# 3. Verify persistence
Profile → API Settings → Key should still be there

# 4. Test connection
API Settings → Test Koneksi → Should succeed

# 5. Test API call
Split Bill → Create → Assign → Test API → Should work
```

---

## ⚠️ Important Notes

1. **Tidak bisa pakai Expo Go** - Harus build native app
2. **Web menggunakan localStorage** - Tidak encrypted
3. **API key persist** - Tetap ada setelah restart
4. **Auto-delete** - Hilang saat uninstall

---

## 🐛 Troubleshooting

### API key not found
→ Buka API Settings dan save API key

### Connection failed
→ Check backend server running
→ Verify API key valid

### Key tidak persist
→ Rebuild app: `npm run android`
→ Jangan pakai Expo Go

---

## 📚 Documentation

- **Setup Guide**: `SECURE_STORAGE_SETUP.md`
- **Security Summary**: `SECURITY_IMPLEMENTATION_SUMMARY.md`
- **API Integration**: `API_INTEGRATION_GUIDE.md`

---

## ✅ Checklist

- [ ] Install expo-secure-store
- [ ] Rebuild native app
- [ ] Open API Settings
- [ ] Save API key
- [ ] Test connection
- [ ] Test split bill API
- [ ] Verify persistence (restart app)

---

**Status:** ✅ Production Ready (Android/iOS)
**Security:** 🛡️ High
**User Experience:** 👍 Simple & Clear
