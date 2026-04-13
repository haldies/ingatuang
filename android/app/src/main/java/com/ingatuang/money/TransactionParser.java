package com.ingatuang.money;

import android.content.Context;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TransactionParser {
    
    public static boolean parseAndSave(Context context, String text) {
        try {
            // Parse transaction from text
            Transaction transaction = parse(context, text);
            
            if (transaction == null) {
                return false;
            }

            // Save to storage
            return TransactionStorage.saveTransaction(context, transaction);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public static Transaction parse(Context context, String text) {
        try {
            text = text.toLowerCase().trim();

            // Detect type (income/expense)
            String type = detectType(text);
            
            // Extract amount
            double amount = extractAmount(text);
            if (amount <= 0) {
                return null;
            }

            // Extract category ID
            String categoryId = detectCategory(context, text, type);

            // Extract name/description
            String notes = extractName(text, amount);

            // Create transaction
            Transaction transaction = new Transaction();
            transaction.id = UUID.randomUUID().toString();
            transaction.type = type;
            transaction.amount = amount;
            transaction.categoryId = categoryId;
            transaction.notes = notes;
            transaction.date = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
            transaction.createdAt = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(new Date());

            return transaction;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private static String detectType(String text) {
        return TransactionParserCore.detectType(text);
    }

    private static double extractAmount(String text) {
        return TransactionParserCore.extractAmount(text);
    }

    private static String detectCategory(Context context, String text, String type) {
        loadRules(context);
        
        // Convert rules to Core data objects
        TransactionParserCore.CategoryRuleData[] incomeCore = convertRules(incomeRules);
        TransactionParserCore.CategoryRuleData[] expenseCore = convertRules(expenseRules);
        
        return TransactionParserCore.detectCategoryFromRules(
            text, type, incomeCore, expenseCore, MIN_CONFIDENCE_THRESHOLD
        );
    }

    private static TransactionParserCore.CategoryRuleData[] convertRules(CategoryRule[] rules) {
        if (rules == null) return null;
        TransactionParserCore.CategoryRuleData[] coreRules = new TransactionParserCore.CategoryRuleData[rules.length];
        for (int i = 0; i < rules.length; i++) {
            coreRules[i] = new TransactionParserCore.CategoryRuleData(
                rules[i].categoryId, rules[i].priority, rules[i].keywords
            );
        }
        return coreRules;
    }

    private static String extractName(String text, double amount) {
        // Use Core implementation for notes extraction
        return TransactionParserCore.extractNotes(text);
    }

    // Merchant & Keyword Rules Engine
    private static class CategoryRule {
        String categoryId;
        String[] keywords;
        int priority;
        
        CategoryRule(String categoryId, int priority, String[] keywords) {
            this.categoryId = categoryId;
            this.keywords = keywords;
            this.priority = priority;
        }
        
        // Check if text matches any keyword
        boolean matches(String text) {
            for (String keyword : keywords) {
                if (text.contains(keyword.toLowerCase())) {
                    return true;
                }
            }
            return false;
        }
        
        // Count how many keywords match (for confidence scoring)
        int countMatches(String text) {
            int count = 0;
            for (String keyword : keywords) {
                if (text.contains(keyword.toLowerCase())) {
                    count++;
                }
            }
            return count;
        }
        
        // Get confidence score (0-100)
        int getConfidence(String text) {
            int matches = countMatches(text);
            if (matches == 0) return 0;
            
            // Higher priority categories need fewer matches for high confidence
            // Priority 100: 1 match = 80% confidence
            // Priority 50: 1 match = 50% confidence
            int baseConfidence = (priority * matches) / 2;
            return Math.min(100, baseConfidence);
        }
    }
    
    private static class CategoryMatch {
        String categoryId;
        int confidence;
        
        CategoryMatch(String categoryId, int confidence) {
            this.categoryId = categoryId;
            this.confidence = confidence;
        }
    }
    
    private static CategoryRule[] incomeRules = null;
    private static CategoryRule[] expenseRules = null;
    
    // Minimum confidence threshold to accept a category
    private static final int MIN_CONFIDENCE_THRESHOLD = 25;
    
    // Load rules from JSON file
    private static void loadRules(Context context) {
        if (incomeRules != null && expenseRules != null) {
            return; // Already loaded
        }
        
        try {
            // Read JSON from raw resources
            java.io.InputStream is = context.getResources().openRawResource(R.raw.category_rules);
            byte[] buffer = new byte[is.available()];
            is.read(buffer);
            is.close();
            String json = new String(buffer, "UTF-8");
            
            JSONObject root = new JSONObject(json);
            
            // Load income rules
            JSONArray incomeArray = root.getJSONArray("income_rules");
            incomeRules = new CategoryRule[incomeArray.length()];
            for (int i = 0; i < incomeArray.length(); i++) {
                JSONObject rule = incomeArray.getJSONObject(i);
                String categoryId = rule.getString("categoryId");
                int priority = rule.getInt("priority");
                JSONArray keywordsArray = rule.getJSONArray("keywords");
                String[] keywords = new String[keywordsArray.length()];
                for (int j = 0; j < keywordsArray.length(); j++) {
                    keywords[j] = keywordsArray.getString(j);
                }
                incomeRules[i] = new CategoryRule(categoryId, priority, keywords);
            }
            
            // Load expense rules
            JSONArray expenseArray = root.getJSONArray("expense_rules");
            expenseRules = new CategoryRule[expenseArray.length()];
            for (int i = 0; i < expenseArray.length(); i++) {
                JSONObject rule = expenseArray.getJSONObject(i);
                String categoryId = rule.getString("categoryId");
                int priority = rule.getInt("priority");
                JSONArray keywordsArray = rule.getJSONArray("keywords");
                String[] keywords = new String[keywordsArray.length()];
                for (int j = 0; j < keywordsArray.length(); j++) {
                    keywords[j] = keywordsArray.getString(j);
                }
                expenseRules[i] = new CategoryRule(categoryId, priority, keywords);
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            // Fallback to default rules if JSON loading fails
            initDefaultRules();
        }
    }
    
    // Fallback default rules
    private static void initDefaultRules() {
        incomeRules = new CategoryRule[] {
            new CategoryRule("1", 100, new String[]{"gaji", "salary"}),
            new CategoryRule("2", 100, new String[]{"bonus", "thr"}),
            new CategoryRule("3", 100, new String[]{"investasi", "saham"}),
            new CategoryRule("4", 50, new String[]{"freelance", "project"})
        };
        
        expenseRules = new CategoryRule[] {
            new CategoryRule("9", 100, new String[]{"tagihan", "listrik", "pulsa"}),
            new CategoryRule("10", 100, new String[]{"kesehatan", "dokter", "obat"}),
            new CategoryRule("11", 100, new String[]{"pendidikan", "sekolah", "kuliah"}),
            new CategoryRule("5", 90, new String[]{"makan", "food", "resto"}),
            new CategoryRule("6", 80, new String[]{"transport", "bensin", "grab"}),
            new CategoryRule("8", 70, new String[]{"hiburan", "nonton", "game"}),
            new CategoryRule("7", 50, new String[]{"belanja", "beli", "shopping"})
        };
    }

    public static class Transaction {
        public String id;
        public String type;
        public double amount;
        public String categoryId;
        public String notes;
        public String date;
        public String createdAt;

        public JSONObject toJSON() throws Exception {
            JSONObject json = new JSONObject();
            json.put("id", id);
            json.put("type", type);
            json.put("amount", amount);
            json.put("categoryId", categoryId);
            json.put("notes", notes);
            json.put("date", date + "T00:00:00.000Z");
            json.put("createdAt", createdAt);
            return json;
        }
    }
}
