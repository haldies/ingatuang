package com.ingatuang.money.database;

import androidx.room.Entity;
import androidx.room.PrimaryKey;
import androidx.annotation.NonNull;

@Entity(tableName = "ai_consent")
public class AIConsentEntity {
    @PrimaryKey
    @NonNull
    private String id; // Always "default" - single row table
    
    private boolean hasShownDialog;
    private boolean hasAccepted;
    private String timestamp;

    public AIConsentEntity(@NonNull String id, boolean hasShownDialog, boolean hasAccepted, String timestamp) {
        this.id = id;
        this.hasShownDialog = hasShownDialog;
        this.hasAccepted = hasAccepted;
        this.timestamp = timestamp;
    }

    @NonNull
    public String getId() {
        return id;
    }

    public void setId(@NonNull String id) {
        this.id = id;
    }

    public boolean isHasShownDialog() {
        return hasShownDialog;
    }

    public void setHasShownDialog(boolean hasShownDialog) {
        this.hasShownDialog = hasShownDialog;
    }

    public boolean isHasAccepted() {
        return hasAccepted;
    }

    public void setHasAccepted(boolean hasAccepted) {
        this.hasAccepted = hasAccepted;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}
