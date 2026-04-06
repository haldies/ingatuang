package com.ingatuang.money.database;

import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import java.util.List;

@Dao
public interface TransactionDao {
    @Query("SELECT * FROM transactions ORDER BY created_at DESC, date DESC")
    List<TransactionEntity> getAllTransactions();

    @Query("SELECT * FROM transactions WHERE id = :id LIMIT 1")
    TransactionEntity getTransactionById(String id);

    @Query("SELECT * FROM transactions WHERE date BETWEEN :startDate AND :endDate ORDER BY date DESC")
    List<TransactionEntity> getTransactionsByDateRange(String startDate, String endDate);

    @Query("SELECT * FROM transactions WHERE type = :type ORDER BY date DESC")
    List<TransactionEntity> getTransactionsByType(String type);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    long insertTransaction(TransactionEntity transaction);

    @Update
    int updateTransaction(TransactionEntity transaction);

    @Delete
    int deleteTransaction(TransactionEntity transaction);

    @Query("DELETE FROM transactions WHERE id = :id")
    int deleteTransactionById(String id);

    @Query("DELETE FROM transactions")
    int deleteAllTransactions();

    @Query("SELECT COUNT(*) FROM transactions")
    int getTransactionCount();
}
