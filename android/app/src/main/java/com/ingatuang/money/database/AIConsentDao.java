package com.ingatuang.money.database;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

@Dao
public interface AIConsentDao {
    
    @Query("SELECT * FROM ai_consent WHERE id = 'default' LIMIT 1")
    AIConsentEntity getConsent();
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    long insertConsent(AIConsentEntity consent);
    
    @Update
    int updateConsent(AIConsentEntity consent);
    
    @Query("DELETE FROM ai_consent WHERE id = 'default'")
    int deleteConsent();
    
    @Query("SELECT COUNT(*) FROM ai_consent")
    int getConsentCount();
}
