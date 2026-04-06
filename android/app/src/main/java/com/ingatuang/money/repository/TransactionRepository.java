package com.ingatuang.money.repository;

import android.content.Context;
import com.ingatuang.money.database.AppDatabase;
import com.ingatuang.money.database.TransactionDao;
import com.ingatuang.money.database.TransactionEntity;
import com.ingatuang.money.database.CategoryDao;
import com.ingatuang.money.database.CategoryEntity;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class TransactionRepository {
    private final TransactionDao transactionDao;
    private final CategoryDao categoryDao;
    private final AppDatabase database;

    public TransactionRepository(Context context) {
        database = AppDatabase.getInstance(context);
        transactionDao = database.transactionDao();
        categoryDao = database.categoryDao();
    }

    // Transaction operations
    public List<TransactionEntity> getAllTransactions() {
        return transactionDao.getAllTransactions();
    }

    public TransactionEntity getTransactionById(String id) {
        return transactionDao.getTransactionById(id);
    }

    public List<TransactionEntity> getTransactionsByDateRange(String startDate, String endDate) {
        return transactionDao.getTransactionsByDateRange(startDate, endDate);
    }

    public List<TransactionEntity> getTransactionsByType(String type) {
        return transactionDao.getTransactionsByType(type);
    }

    public long addTransaction(double amount, String type, String date, String categoryId, String notes) {
        String id = String.valueOf(System.currentTimeMillis());
        String createdAt = getCurrentTimestamp();
        
        TransactionEntity transaction = new TransactionEntity(
            id, amount, type, date, categoryId, notes, createdAt
        );
        
        return transactionDao.insertTransaction(transaction);
    }

    public long addTransaction(TransactionEntity transaction) {
        return transactionDao.insertTransaction(transaction);
    }

    public int updateTransaction(TransactionEntity transaction) {
        return transactionDao.updateTransaction(transaction);
    }

    public int deleteTransaction(String id) {
        return transactionDao.deleteTransactionById(id);
    }

    public int deleteAllTransactions() {
        return transactionDao.deleteAllTransactions();
    }

    public int getTransactionCount() {
        return transactionDao.getTransactionCount();
    }

    // Category operations
    public List<CategoryEntity> getAllCategories() {
        return categoryDao.getAllCategories();
    }

    public CategoryEntity getCategoryById(String id) {
        return categoryDao.getCategoryById(id);
    }

    public List<CategoryEntity> getCategoriesByType(String type) {
        return categoryDao.getCategoriesByType(type);
    }

    public long addCategory(CategoryEntity category) {
        return categoryDao.insertCategory(category);
    }

    public int updateCategory(CategoryEntity category) {
        return categoryDao.updateCategory(category);
    }

    public int deleteCategory(String id) {
        return categoryDao.deleteCategoryById(id);
    }

    // Helper methods
    private String getCurrentTimestamp() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        return sdf.format(new Date());
    }

    public String getTodayDate() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        return sdf.format(new Date());
    }
}
