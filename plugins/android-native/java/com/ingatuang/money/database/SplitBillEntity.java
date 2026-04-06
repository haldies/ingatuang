package com.ingatuang.money.database;

import androidx.room.Entity;
import androidx.room.PrimaryKey;
import androidx.annotation.NonNull;

@Entity(tableName = "split_bills")
public class SplitBillEntity {
    @PrimaryKey
    @NonNull
    private String id;
    
    @NonNull
    private String title;
    
    private double taxPercentage;
    
    private double servicePercentage;
    
    private double subtotal;
    
    private double total;
    
    @NonNull
    private String createdAt;
    
    // Store items, persons, and assignments as JSON strings
    @NonNull
    private String itemsJson;
    
    @NonNull
    private String personsJson;
    
    @NonNull
    private String assignmentsJson;

    public SplitBillEntity(@NonNull String id, @NonNull String title, 
                          double taxPercentage, double servicePercentage,
                          double subtotal, double total, @NonNull String createdAt,
                          @NonNull String itemsJson, @NonNull String personsJson,
                          @NonNull String assignmentsJson) {
        this.id = id;
        this.title = title;
        this.taxPercentage = taxPercentage;
        this.servicePercentage = servicePercentage;
        this.subtotal = subtotal;
        this.total = total;
        this.createdAt = createdAt;
        this.itemsJson = itemsJson;
        this.personsJson = personsJson;
        this.assignmentsJson = assignmentsJson;
    }

    // Getters
    @NonNull
    public String getId() { return id; }
    
    @NonNull
    public String getTitle() { return title; }
    
    public double getTaxPercentage() { return taxPercentage; }
    
    public double getServicePercentage() { return servicePercentage; }
    
    public double getSubtotal() { return subtotal; }
    
    public double getTotal() { return total; }
    
    @NonNull
    public String getCreatedAt() { return createdAt; }
    
    @NonNull
    public String getItemsJson() { return itemsJson; }
    
    @NonNull
    public String getPersonsJson() { return personsJson; }
    
    @NonNull
    public String getAssignmentsJson() { return assignmentsJson; }

    // Setters
    public void setId(@NonNull String id) { this.id = id; }
    
    public void setTitle(@NonNull String title) { this.title = title; }
    
    public void setTaxPercentage(double taxPercentage) { this.taxPercentage = taxPercentage; }
    
    public void setServicePercentage(double servicePercentage) { this.servicePercentage = servicePercentage; }
    
    public void setSubtotal(double subtotal) { this.subtotal = subtotal; }
    
    public void setTotal(double total) { this.total = total; }
    
    public void setCreatedAt(@NonNull String createdAt) { this.createdAt = createdAt; }
    
    public void setItemsJson(@NonNull String itemsJson) { this.itemsJson = itemsJson; }
    
    public void setPersonsJson(@NonNull String personsJson) { this.personsJson = personsJson; }
    
    public void setAssignmentsJson(@NonNull String assignmentsJson) { this.assignmentsJson = assignmentsJson; }
}
