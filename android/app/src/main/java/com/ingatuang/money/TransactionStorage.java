package com.ingatuang.money;

import android.content.Context;
import android.util.Log;
import com.ingatuang.money.database.TransactionEntity;
import com.ingatuang.money.repository.TransactionRepository;
import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class TransactionStorage {
    private static final String TAG = "TransactionStorage";
    private static final String STORAGE_KEY = "@ingat_uang:transactions";

    /**
     * Save transaction using Room Database
     */
    public static boolean saveTransaction(Context context, TransactionParser.Transaction transaction) {
        try {
            Log.d(TAG, "Saving transaction: " + transaction.notes + " - " + transaction.amount);
            
            TransactionRepository repository = new TransactionRepository(context);
            
            // Use the transaction ID from parser (UUID)
            String id = transaction.id;
            String createdAt = transaction.createdAt;
            
            // Ensure date has proper format
            String date = transaction.date;
            if (!date.contains("T")) {
                date = date + "T00:00:00.000Z";
            }
            
            Log.d(TAG, "Transaction details - ID: " + id + ", Type: " + transaction.type + 
                  ", Amount: " + transaction.amount + ", Category: " + transaction.categoryId + 
                  ", Date: " + date);
            
            TransactionEntity entity = new TransactionEntity(
                id,
                transaction.amount,
                transaction.type,
                date,
                transaction.categoryId,
                transaction.notes,
                createdAt
            );
            
            long result = repository.addTransaction(entity);
            
            if (result != -1) {
                Log.d(TAG, "Transaction saved successfully with row ID: " + result);
                
                // Verify by reading back
                int count = repository.getTransactionCount();
                Log.d(TAG, "Total transactions in database: " + count);
                
                return true;
            } else {
                Log.e(TAG, "Failed to save transaction - insert returned -1");
                return false;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error saving transaction", e);
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Get all transactions as JSONArray for compatibility with React Native
     */
    public static JSONArray getTransactions(Context context) {
        try {
            TransactionRepository repository = new TransactionRepository(context);
            List<TransactionEntity> transactions = repository.getAllTransactions();
            
            JSONArray jsonArray = new JSONArray();
            for (TransactionEntity transaction : transactions) {
                JSONObject json = new JSONObject();
                json.put("id", transaction.getId());
                json.put("amount", transaction.getAmount());
                json.put("type", transaction.getType());
                json.put("date", transaction.getDate());
                json.put("categoryId", transaction.getCategoryId());
                json.put("notes", transaction.getNotes());
                json.put("createdAt", transaction.getCreatedAt());
                jsonArray.put(json);
            }
            
            return jsonArray;
        } catch (Exception e) {
            e.printStackTrace();
            return new JSONArray();
        }
    }

    private static String getCurrentTimestamp() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        return sdf.format(new Date());
    }
}
