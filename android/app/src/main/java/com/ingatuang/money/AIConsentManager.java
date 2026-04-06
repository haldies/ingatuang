package com.ingatuang.money;

import android.content.Context;
import android.util.Log;
import com.ingatuang.money.database.AppDatabase;
import com.ingatuang.money.database.AIConsentDao;
import com.ingatuang.money.database.AIConsentEntity;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class AIConsentManager {
    private static final String TAG = "AIConsentManager";
    private static final String CONSENT_ID = "default";

    private final AIConsentDao consentDao;

    public AIConsentManager(Context context) {
        AppDatabase db = AppDatabase.getInstance(context);
        consentDao = db.aiConsentDao();
        Log.d(TAG, "AIConsentManager initialized with Room database");
    }

    public boolean hasShownDialog() {
        try {
            AIConsentEntity consent = consentDao.getConsent();
            Log.d(TAG, "hasShownDialog - Consent entity: " + (consent != null ? "found" : "null"));
            
            if (consent == null) {
                Log.d(TAG, "hasShownDialog - No consent found, returning false");
                return false;
            }
            
            boolean hasShown = consent.isHasShownDialog();
            Log.d(TAG, "hasShownDialog - Result: " + hasShown);
            return hasShown;
        } catch (Exception e) {
            Log.e(TAG, "hasShownDialog - Error: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    public boolean hasAccepted() {
        try {
            AIConsentEntity consent = consentDao.getConsent();
            if (consent == null) return false;
            return consent.isHasAccepted();
        } catch (Exception e) {
            Log.e(TAG, "hasAccepted - Error: " + e.getMessage());
            return false;
        }
    }

    public void saveConsent(boolean accepted) {
        try {
            String timestamp = getCurrentTimestamp();
            
            AIConsentEntity consent = new AIConsentEntity(
                CONSENT_ID,
                true,  // hasShownDialog
                accepted,
                timestamp
            );
            
            Log.d(TAG, "saveConsent - Saving to Room: accepted=" + accepted + ", timestamp=" + timestamp);
            
            long result = consentDao.insertConsent(consent);
            
            if (result != -1) {
                Log.d(TAG, "saveConsent - Saved successfully");
            } else {
                Log.e(TAG, "saveConsent - Insert returned -1");
            }
        } catch (Exception e) {
            Log.e(TAG, "saveConsent - Error: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void reset() {
        try {
            Log.d(TAG, "reset - Removing consent data from Room");
            int deleted = consentDao.deleteConsent();
            Log.d(TAG, "reset - Deleted " + deleted + " rows");
        } catch (Exception e) {
            Log.e(TAG, "reset - Error: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String getCurrentTimestamp() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        return sdf.format(new Date());
    }
}
