package com.ingatuang.money.database;

import android.content.Context;
import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;
import androidx.room.migration.Migration;
import androidx.sqlite.db.SupportSQLiteDatabase;
import androidx.annotation.NonNull;

@Database(entities = {TransactionEntity.class, CategoryEntity.class, AIConsentEntity.class, SubscriptionEntity.class, SplitBillEntity.class}, version = 4, exportSchema = false)
public abstract class AppDatabase extends RoomDatabase {
    private static final String DATABASE_NAME = "ingat_uang_db";
    private static volatile AppDatabase INSTANCE;

    public abstract TransactionDao transactionDao();
    public abstract CategoryDao categoryDao();
    public abstract AIConsentDao aiConsentDao();
    public abstract SubscriptionDao subscriptionDao();
    public abstract SplitBillDao splitBillDao();

    // Migration from version 2 to 3 (add subscriptions table)
    static final Migration MIGRATION_2_3 = new Migration(2, 3) {
        @Override
        public void migrate(@NonNull SupportSQLiteDatabase database) {
            // Create subscriptions table
            database.execSQL(
                "CREATE TABLE IF NOT EXISTS subscriptions (" +
                "id TEXT PRIMARY KEY NOT NULL, " +
                "name TEXT NOT NULL, " +
                "amount REAL NOT NULL, " +
                "billingCycle TEXT NOT NULL, " +
                "startDate TEXT NOT NULL, " +
                "nextBillingDate TEXT NOT NULL, " +
                "isActive INTEGER NOT NULL, " +
                "description TEXT, " +
                "createdAt TEXT NOT NULL)"
            );
        }
    };

    // Migration from version 3 to 4 (add split_bills table)
    static final Migration MIGRATION_3_4 = new Migration(3, 4) {
        @Override
        public void migrate(@NonNull SupportSQLiteDatabase database) {
            // Create split_bills table
            database.execSQL(
                "CREATE TABLE IF NOT EXISTS split_bills (" +
                "id TEXT PRIMARY KEY NOT NULL, " +
                "title TEXT NOT NULL, " +
                "taxPercentage REAL NOT NULL, " +
                "servicePercentage REAL NOT NULL, " +
                "subtotal REAL NOT NULL, " +
                "total REAL NOT NULL, " +
                "createdAt TEXT NOT NULL, " +
                "itemsJson TEXT NOT NULL, " +
                "personsJson TEXT NOT NULL, " +
                "assignmentsJson TEXT NOT NULL)"
            );
        }
    };

    public static AppDatabase getInstance(Context context) {
        if (INSTANCE == null) {
            synchronized (AppDatabase.class) {
                if (INSTANCE == null) {
                    INSTANCE = Room.databaseBuilder(
                            context.getApplicationContext(),
                            AppDatabase.class,
                            DATABASE_NAME
                    )
                    .allowMainThreadQueries() // For widget usage - consider using background threads in production
                    .addMigrations(MIGRATION_2_3, MIGRATION_3_4)
                    .fallbackToDestructiveMigration() // Only if migration fails
                    .build();
                    
                    // Initialize default categories
                    initializeDefaultCategories(INSTANCE);
                }
            }
        }
        return INSTANCE;
    }

    private static void initializeDefaultCategories(AppDatabase db) {
        CategoryDao categoryDao = db.categoryDao();
        
        // Check if categories already exist
        if (categoryDao.getCategoryCount() > 0) {
            return;
        }

        // Insert default categories
        categoryDao.insertCategory(new CategoryEntity("1", "Gaji", "💰", "#10b981", "INCOME"));
        categoryDao.insertCategory(new CategoryEntity("2", "Bonus", "🎁", "#059669", "INCOME"));
        categoryDao.insertCategory(new CategoryEntity("3", "Investasi", "📈", "#34d399", "INCOME"));
        categoryDao.insertCategory(new CategoryEntity("4", "Lainnya", "💵", "#6ee7b7", "INCOME"));
        
        categoryDao.insertCategory(new CategoryEntity("5", "Makanan", "🍔", "#ef4444", "EXPENSE"));
        categoryDao.insertCategory(new CategoryEntity("6", "Transport", "🚗", "#f59e0b", "EXPENSE"));
        categoryDao.insertCategory(new CategoryEntity("7", "Belanja", "🛒", "#8b5cf6", "EXPENSE"));
        categoryDao.insertCategory(new CategoryEntity("8", "Hiburan", "🎮", "#ec4899", "EXPENSE"));
        categoryDao.insertCategory(new CategoryEntity("9", "Tagihan", "📱", "#3b82f6", "EXPENSE"));
        categoryDao.insertCategory(new CategoryEntity("10", "Kesehatan", "🏥", "#14b8a6", "EXPENSE"));
        categoryDao.insertCategory(new CategoryEntity("11", "Pendidikan", "📚", "#f97316", "EXPENSE"));
        categoryDao.insertCategory(new CategoryEntity("12", "Lainnya", "💸", "#6366f1", "EXPENSE"));
    }

    public static void destroyInstance() {
        INSTANCE = null;
    }
}
