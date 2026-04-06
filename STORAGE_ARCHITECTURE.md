# Storage Architecture - Ingat Uang

## Overview
Aplikasi menggunakan **unified storage architecture** dengan Room Database sebagai primary storage di Android dan AsyncStorage sebagai fallback untuk iOS.

## ✅ Single Source of Truth

**PENTING**: Semua operasi data HARUS melalui `storage-adapter.ts`. Jangan pernah akses `storage.ts` atau `room-storage.ts` langsung dari komponen!

## Database Structure

### Room Database (Android - SQLite)
**Location**: `android/app/src/main/java/com/anonymous/ingatuang/database/`

**Tables**:
1. **transactions** - TransactionEntity
   - id, amount, type, date, categoryId, notes, createdAt
   
2. **categories** - CategoryEntity
   - id, name, icon, color, type
   
3. **subscriptions** - SubscriptionEntity
   - id, name, amount, billingCycle, startDate, nextBillingDate, isActive, description, createdAt
   
4. **split_bills** - SplitBillEntity
   - id, title, taxPercentage, servicePercentage, subtotal, total, createdAt
   - itemsJson, personsJson, assignmentsJson (stored as JSON strings)
   
5. **ai_consent** - AIConsentEntity
   - id, hasShownDialog, hasAccepted, timestamp

**Database Version**: 4

### AsyncStorage (iOS / Fallback)
**Location**: `lib/storage.ts`

**Keys**:
- `@ingat_uang:transactions` (fallback only)
- `@ingat_uang:categories` (fallback only)
- `@ingat_uang:subscriptions` (fallback only)
- `@ingat_uang:split_bills` (fallback only)
- `@ingat_uang:budgets` (all platforms - simple key-value)

## Storage Adapter Pattern

**File**: `lib/storage-adapter.ts`

The storage adapter automatically selects the appropriate storage backend:

```typescript
const useRoom = Platform.OS === 'android' && RoomStorage.isRoomStorageAvailable();
```

### Data Flow

#### Android (Room Available):
```
App → storage-adapter → Room Database (SQLite)
                      ↓
                   AsyncStorage (for Budgets only - simple key-value data)
```

#### iOS or Room Unavailable:
```
App → storage-adapter → AsyncStorage (all data)
```

## ✅ NO MORE DUAL DATABASE!

Sebelumnya ada masalah duplikasi database dimana:
- Transactions disimpan di Room DAN AsyncStorage
- Categories disimpan di Room DAN AsyncStorage  
- Subscriptions disimpan di AsyncStorage saja
- Split Bills disimpan di AsyncStorage saja

**Sekarang sudah diperbaiki:**
- ✅ Semua data utama di Android → Room Database
- ✅ Semua data di iOS → AsyncStorage
- ✅ Tidak ada duplikasi
- ✅ Single source of truth melalui storage-adapter

**Data di Room Database (Android):**
- ✅ Transactions
- ✅ Categories
- ✅ Subscriptions
- ✅ Split Bills
- ✅ AI Consent

**Data di AsyncStorage (semua platform):**
- ⚠️ Budgets (simple key-value, tidak perlu kompleksitas Room)

## Best Practices

### ✅ DO:
- Always use `storage-adapter.ts` for all data operations
- Import: `import { storage } from '@/lib/storage-adapter'`
- Use unified interface: `storage.addTransaction()`, `storage.addCategory()`, etc.

### ❌ DON'T:
- Don't import from `@/lib/storage` directly
- Don't import from `@/lib/room-storage` directly
- Don't use AsyncStorage directly for app data
- Don't bypass the storage adapter

### Example - CORRECT ✅:
```typescript
import { storage } from '@/lib/storage-adapter';

// Add category
await storage.addCategory(newCategory);

// Update category
await storage.updateCategory(id, updates);

// Delete category
await storage.deleteCategory(id);
```

### Example - WRONG ❌:
```typescript
// DON'T DO THIS!
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem('@ingat_uang:categories', JSON.stringify(categories));
```

## Migration Notes

### Version 2 → 3 → 4
- **v3**: Added `SubscriptionEntity` table to Room Database
- **v4**: Added `SplitBillEntity` table to Room Database
- Migrated subscriptions from AsyncStorage-only to Room Database
- Migrated split bills from AsyncStorage-only to Room Database
- Added Category CRUD operations to Room Database
- Updated `storage-adapter.ts` to use Room for all data on Android
- Fixed direct AsyncStorage access in `categories/create.tsx` and `categories/edit.tsx`
- Database migration uses `fallbackToDestructiveMigration()` (data will be cleared on upgrade)

### Important: Data Migration
When upgrading from v2 to v3, existing data in AsyncStorage will NOT be automatically migrated to Room. Users will need to re-add their data or use the migration utility.

## Files Modified

### Java (Android):
- `database/SubscriptionEntity.java` (NEW in v3)
- `database/SubscriptionDao.java` (NEW in v3)
- `database/SplitBillEntity.java` (NEW in v4)
- `database/SplitBillDao.java` (NEW in v4)
- `database/AppDatabase.java` (version bump 2→3→4, added SubscriptionDao & SplitBillDao)
- `RoomStorageModule.java` (added subscription, category, & split bill CRUD methods)

### TypeScript:
- `lib/room-storage.ts` (added Subscription, Category, & SplitBill CRUD functions)
- `lib/storage-adapter.ts` (updated to use Room for subscriptions, categories, & split bills)
- `lib/storage.ts` (added Category CRUD functions, helper functions)
- `app/categories/create.tsx` (fixed to use storage-adapter)
- `app/categories/edit.tsx` (fixed to use storage-adapter)

## Testing

After implementing these changes:

1. **Clean build required**:
   ```bash
   cd mobileApp/ingatuang/android
   ./gradlew clean
   cd ..
   npx react-native run-android
   ```

2. **Test scenarios**:
   - Add new category → should save to Room DB
   - Update category → should update in Room DB
   - Delete category → should delete from Room DB
   - Add new subscription → should appear in transactions
   - Update subscription → should reflect changes
   - Delete subscription → should remove from database
   - Add new split bill → should save to Room DB
   - Delete split bill → should remove from Room DB
   - Clear all data → should clear all from Room DB

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                  React Native App                │
│                                                   │
│  Components (index.tsx, categories/*, etc.)      │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│            storage-adapter.ts                    │
│         (Single Source of Truth)                 │
│                                                   │
│  - Detects platform (Android/iOS)                │
│  - Routes to appropriate storage                 │
└────────────┬────────────────────┬────────────────┘
             │                    │
    ┌────────▼────────┐  ┌────────▼────────┐
    │  Room Database  │  │  AsyncStorage   │
    │   (Android)     │  │   (iOS/Fallback)│
    │                 │  │                 │
    │ - Transactions  │  │ - Transactions  │
    │ - Categories    │  │ - Categories    │
    │ - Subscriptions │  │ - Subscriptions │
    │ - Split Bills   │  │ - Split Bills   │
    │ - AI Consent    │  │ - Budgets       │
    └─────────────────┘  └─────────────────┘
```

## Future Improvements

- [ ] Add proper database migration instead of destructive migration
- [x] ~~Migrate Split Bills to Room Database~~ (DONE in v4)
- [ ] Add data sync utility for migrating existing AsyncStorage data to Room
- [ ] Implement background sync for subscription renewals
- [ ] Add database backup/restore functionality

