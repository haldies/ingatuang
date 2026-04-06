package com.ingatuang.money.database;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Update;
import androidx.room.Delete;
import java.util.List;

@Dao
public interface SubscriptionDao {
    @Query("SELECT * FROM subscriptions ORDER BY createdAt DESC")
    List<SubscriptionEntity> getAllSubscriptions();
    
    @Query("SELECT * FROM subscriptions WHERE id = :id LIMIT 1")
    SubscriptionEntity getSubscriptionById(String id);
    
    @Query("SELECT * FROM subscriptions WHERE isActive = 1 ORDER BY nextBillingDate ASC")
    List<SubscriptionEntity> getActiveSubscriptions();
    
    @Insert
    void insertSubscription(SubscriptionEntity subscription);
    
    @Update
    void updateSubscription(SubscriptionEntity subscription);
    
    @Delete
    void deleteSubscription(SubscriptionEntity subscription);
    
    @Query("DELETE FROM subscriptions WHERE id = :id")
    void deleteSubscriptionById(String id);
    
    @Query("DELETE FROM subscriptions")
    void deleteAllSubscriptions();
    
    @Query("SELECT COUNT(*) FROM subscriptions")
    int getSubscriptionCount();
}
