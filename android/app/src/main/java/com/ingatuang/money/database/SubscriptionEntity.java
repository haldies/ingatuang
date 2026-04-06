package com.ingatuang.money.database;

import androidx.room.Entity;
import androidx.room.PrimaryKey;
import androidx.annotation.NonNull;

@Entity(tableName = "subscriptions")
public class SubscriptionEntity {
    @PrimaryKey
    @NonNull
    private String id;
    
    @NonNull
    private String name;
    
    private double amount;
    
    @NonNull
    private String billingCycle; // DAILY, WEEKLY, MONTHLY, YEARLY
    
    @NonNull
    private String startDate;
    
    @NonNull
    private String nextBillingDate;
    
    private boolean isActive;
    
    private String description;
    
    @NonNull
    private String createdAt;

    public SubscriptionEntity(@NonNull String id, @NonNull String name, double amount, 
                            @NonNull String billingCycle, @NonNull String startDate,
                            @NonNull String nextBillingDate, boolean isActive,
                            String description, @NonNull String createdAt) {
        this.id = id;
        this.name = name;
        this.amount = amount;
        this.billingCycle = billingCycle;
        this.startDate = startDate;
        this.nextBillingDate = nextBillingDate;
        this.isActive = isActive;
        this.description = description;
        this.createdAt = createdAt;
    }

    // Getters
    @NonNull
    public String getId() { return id; }
    
    @NonNull
    public String getName() { return name; }
    
    public double getAmount() { return amount; }
    
    @NonNull
    public String getBillingCycle() { return billingCycle; }
    
    @NonNull
    public String getStartDate() { return startDate; }
    
    @NonNull
    public String getNextBillingDate() { return nextBillingDate; }
    
    public boolean isActive() { return isActive; }
    
    public String getDescription() { return description; }
    
    @NonNull
    public String getCreatedAt() { return createdAt; }

    // Setters
    public void setId(@NonNull String id) { this.id = id; }
    
    public void setName(@NonNull String name) { this.name = name; }
    
    public void setAmount(double amount) { this.amount = amount; }
    
    public void setBillingCycle(@NonNull String billingCycle) { this.billingCycle = billingCycle; }
    
    public void setStartDate(@NonNull String startDate) { this.startDate = startDate; }
    
    public void setNextBillingDate(@NonNull String nextBillingDate) { this.nextBillingDate = nextBillingDate; }
    
    public void setActive(boolean active) { isActive = active; }
    
    public void setDescription(String description) { this.description = description; }
    
    public void setCreatedAt(@NonNull String createdAt) { this.createdAt = createdAt; }
}
