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
        if (text.contains("terima") || text.contains("dapat") || 
            text.contains("gaji") || text.contains("bonus") ||
            text.contains("income") || text.contains("masuk")) {
            return "INCOME";
        }
        return "EXPENSE";
    }

    private static double extractAmount(String text) {
        // Pattern untuk angka dengan atau tanpa separator dan unit
        // Improved pattern to capture numbers after "rp" prefix
        Pattern pattern = Pattern.compile("(?:rp\\s*)?([\\d]+(?:[.,][\\d]+)?)\\s*(ribu|rb|k|juta|jt|m|ratus)?", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);

        double maxAmount = 0;
        boolean foundWithUnit = false;
        
        while (matcher.find()) {
            String numberStr = matcher.group(1).replace(",", ".");
            String unit = matcher.group(2);

            try {
                double number = Double.parseDouble(numberStr);

                // Apply multiplier
                if (unit != null) {
                    String unitLower = unit.toLowerCase();
                    if (unitLower.equals("ribu") || unitLower.equals("rb") || unitLower.equals("k")) {
                        number *= 1000;
                    } else if (unitLower.equals("juta") || unitLower.equals("jt") || unitLower.equals("m")) {
                        number *= 1000000;
                    } else if (unitLower.equals("ratus")) {
                        number *= 100;
                    }
                }

                // Priority logic:
                // 1. Numbers with units (e.g., "10 ribu", "5k") - highest priority
                // 2. Numbers >= 1000 (e.g., "10000", "5000") - likely prices
                // 3. Small numbers (< 1000) - likely quantities, only use if nothing else found
                
                if (unit != null) {
                    // Number with unit - highest priority
                    if (!foundWithUnit || number > maxAmount) {
                        maxAmount = number;
                        foundWithUnit = true;
                    }
                } else if (number >= 1000) {
                    // Large number without unit - second priority
                    // Only update if we haven't found a number with unit yet
                    if (!foundWithUnit && number > maxAmount) {
                        maxAmount = number;
                    }
                } else {
                    // Small number (< 1000) - lowest priority
                    // Only use if we haven't found anything else
                    if (maxAmount == 0 && !foundWithUnit) {
                        maxAmount = number;
                    }
                }
            } catch (NumberFormatException e) {
                // Skip invalid numbers
            }
        }

        return maxAmount;
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
    private static final int MIN_CONFIDENCE_THRESHOLD = 30;
    
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
    
    private static String detectCategory(Context context, String text, String type) {
        // Load rules if not loaded yet
        loadRules(context);
        
        text = text.toLowerCase();
        
        if (type.equals("INCOME")) {
            // Find best matching income category
            CategoryMatch bestMatch = findBestMatch(incomeRules, text);
            
            // If confidence is too low, return "Other Income"
            if (bestMatch == null || bestMatch.confidence < MIN_CONFIDENCE_THRESHOLD) {
                return "4"; // Other Income
            }
            
            return bestMatch.categoryId;
        } else {
            // Find best matching expense category
            CategoryMatch bestMatch = findBestMatch(expenseRules, text);
            
            // If confidence is too low, return "Other Expense"
            if (bestMatch == null || bestMatch.confidence < MIN_CONFIDENCE_THRESHOLD) {
                return "12"; // Other Expense
            }
            
            return bestMatch.categoryId;
        }
    }
    
    // Find best matching category with confidence scoring
    private static CategoryMatch findBestMatch(CategoryRule[] rules, String text) {
        CategoryMatch bestMatch = null;
        int highestConfidence = 0;
        
        // Sort rules by priority (highest first)
        CategoryRule[] sortedRules = rules.clone();
        java.util.Arrays.sort(sortedRules, new java.util.Comparator<CategoryRule>() {
            @Override
            public int compare(CategoryRule a, CategoryRule b) {
                return Integer.compare(b.priority, a.priority);
            }
        });
        
        // Check each rule and calculate confidence
        for (CategoryRule rule : sortedRules) {
            if (rule.matches(text)) {
                int confidence = rule.getConfidence(text);
                
                // Keep track of best match
                if (confidence > highestConfidence) {
                    highestConfidence = confidence;
                    bestMatch = new CategoryMatch(rule.categoryId, confidence);
                }
                
                // If we found a high-confidence match from high-priority rule, stop
                if (confidence >= 80 && rule.priority >= 90) {
                    break;
                }
            }
        }
        
        return bestMatch;
    }

    private static String extractName(String text, double amount) {
        // Remove the amount that was detected (with some tolerance for formatting)
        // Only remove numbers that match the amount or have units
        String name = text;
        
        // Remove amount with units (these are definitely prices, not quantities)
        name = name.replaceAll("\\b\\d+[.,]?\\d*\\s*(ribu|rb|k|juta|jt|m|ratus)\\b", "").trim();
        
        // Remove large numbers without units (>= 1000, likely prices)
        name = name.replaceAll("\\b\\d{4,}[.,]?\\d*\\b", "").trim();
        
        // Keep small numbers (1-999) as they're likely quantities (e.g., "2 nasi goreng")
        
        // Remove common action words with word boundaries
        name = name.replaceAll("\\b(beli|bayar|untuk|ke|di|dari|terima|dapat)\\b", "").trim();
        
        // Remove extra spaces
        name = name.replaceAll("\\s+", " ").trim();
        
        if (!name.isEmpty()) {
            // Capitalize first letter
            name = name.substring(0, 1).toUpperCase() + name.substring(1);
        } else {
            name = "Transaction";
        }

        return name;
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
