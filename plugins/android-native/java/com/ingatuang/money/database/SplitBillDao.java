package com.ingatuang.money.database;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Update;
import androidx.room.Delete;
import java.util.List;

@Dao
public interface SplitBillDao {
    @Query("SELECT * FROM split_bills ORDER BY createdAt DESC")
    List<SplitBillEntity> getAllSplitBills();
    
    @Query("SELECT * FROM split_bills WHERE id = :id LIMIT 1")
    SplitBillEntity getSplitBillById(String id);
    
    @Insert
    void insertSplitBill(SplitBillEntity splitBill);
    
    @Update
    void updateSplitBill(SplitBillEntity splitBill);
    
    @Delete
    void deleteSplitBill(SplitBillEntity splitBill);
    
    @Query("DELETE FROM split_bills WHERE id = :id")
    void deleteSplitBillById(String id);
    
    @Query("DELETE FROM split_bills")
    void deleteAllSplitBills();
    
    @Query("SELECT COUNT(*) FROM split_bills")
    int getSplitBillCount();
}
