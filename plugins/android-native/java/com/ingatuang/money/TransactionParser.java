package com.ingatuang.money;

import android.content.Context;
import android.util.Log;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.UUID;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * TransactionParser v2 — Improved NLP-based parser for Indonesian natural language transactions.
 *
 * Improvements over v1:
 * 1. Multi-strategy amount extraction: currency-tagged → unit-based → dot-separated → bare number
 * 2. Robust Indonesian number normalization (handles 20.000, 20,000, 20rb, 20ribu, 20k, 20jt)
 * 3. N-gram phrase matching for compound keywords ("nasi goreng", "grab car", etc.)
 * 4. BM25-inspired confidence scoring for category matching
 * 5. Negation-aware type detection ("tidak terima", "bukan gaji" → expense)
 * 6. Notes extraction preserves quantity context ("2 nasi goreng", "3 botol")
 * 7. Pre-compiled static patterns for performance
 */
public class TransactionParser {

    private static final String TAG = "TransactionParser";

    // ── Pre-compiled Regex Patterns ──────────────────────────────────────────────

    /**
     * Strategy 1: Explicit currency prefix "rp" followed by amount.
     * Handles: rp20000, rp 20.000, rp20rb, rp 5jt, rp1.500.000
     * Group "num": the raw numeric string (may have separators)
     * Group "unit": optional verbal unit (ribu, juta, etc.)
     */
    private static final Pattern PAT_CURRENCY_PREFIX = Pattern.compile(
        "rp\\.?\\s*(?<num>[\\d]+(?:[.,][\\d]+)*)\\s*(?<unit>ribu|rb|k|juta|jt|jt\\.?|m|miliar|ratus)?",
        Pattern.CASE_INSENSITIVE
    );

    /**
     * Strategy 2: Number followed immediately by a verbal unit.
     * Handles: 20ribu, 5juta, 500rb, 2k, 300ratus, 1miliar
     */
    private static final Pattern PAT_NUM_UNIT = Pattern.compile(
        "(?<![\\d.,])(?<num>[\\d]+(?:[.,][\\d]+)*)\\s*(?<unit>ribu|rb|juta|jt|k|miliar|ratus)\\b",
        Pattern.CASE_INSENSITIVE
    );

    /**
     * Strategy 3: Dot-separated Indonesian format (e.g., 1.500.000 or 20.000).
     * These have multiple segments of 3 digits separated by dots.
     */
    private static final Pattern PAT_DOT_SEPARATED = Pattern.compile(
        "(?<![\\d])(?<num>\\d{1,3}(?:\\.\\d{3})+)(?![\\d.,])(?:\\s*(?<unit>ribu|rb|k|juta|jt|miliar|ratus))?",
        Pattern.CASE_INSENSITIVE
    );

    /**
     * Strategy 4: Comma-separated international format (e.g., 1,500,000).
     */
    private static final Pattern PAT_COMMA_SEPARATED = Pattern.compile(
        "(?<![\\d])(?<num>\\d{1,3}(?:,\\d{3})+)(?![\\d.,])(?:\\s*(?<unit>ribu|rb|k|juta|jt|miliar|ratus))?",
        Pattern.CASE_INSENSITIVE
    );

    /**
     * Strategy 5: Bare integer ≥ 1000 (last resort).
     */
    private static final Pattern PAT_BARE_NUMBER = Pattern.compile(
        "(?<![\\d.,])(?<num>\\d{4,})(?![\\d.,])"
    );

    // Patterns for notes cleaning
    private static final Pattern PAT_RP_AMOUNT = Pattern.compile(
        "rp\\.?\\s*[\\d.,]+\\s*(?:ribu|rb|k|juta|jt|miliar|ratus)?",
        Pattern.CASE_INSENSITIVE
    );
    private static final Pattern PAT_NUM_UNIT_CLEAN = Pattern.compile(
        "\\b[\\d.,]+\\s*(?:ribu|rb|k|juta|jt|miliar|ratus)\\b",
        Pattern.CASE_INSENSITIVE
    );
    private static final Pattern PAT_LARGE_NUM_CLEAN = Pattern.compile(
        "\\b\\d{1,3}(?:[.,]\\d{3})+\\b|\\b\\d{4,}\\b"
    );
    private static final Pattern PAT_ACTION_WORDS = Pattern.compile(
        "\\b(aku|saya|gue|gw|tadi|baru|sudah|udah|buat|untuk|ke|di|dari|sama|bayar|pay|paid" +
        "|beli|beli tadi|habis|abis|keluar|kena|buat bayar|buat beli|buat makan)\\b",
        Pattern.CASE_INSENSITIVE
    );
    private static final Pattern PAT_MULTI_SPACE = Pattern.compile("\\s{2,}");

    // Negation window — if within 3 tokens of type keyword, flip intent
    private static final List<String> NEGATION_TOKENS = Arrays.asList(
        "tidak", "bukan", "gak", "ga", "nggak", "ngga", "belum", "tanpa"
    );

    // Context multipliers for type detection (higher = more certain income signal)
    private static final List<String[]> INCOME_PHRASES = new ArrayList<String[]>() {{
        add(new String[]{"terima gaji", "100"});
        add(new String[]{"dapat gaji", "100"});
        add(new String[]{"gaji masuk", "100"});
        add(new String[]{"uang masuk", "90"});
        add(new String[]{"transfer masuk", "90"});
        add(new String[]{"receive payment", "90"});
        add(new String[]{"gaji", "70"});
        add(new String[]{"salary", "70"});
        add(new String[]{"upah", "70"});
        add(new String[]{"bonus", "60"});
        add(new String[]{"thr", "60"});
        add(new String[]{"pendapatan", "60"});
        add(new String[]{"income", "60"});
        add(new String[]{"investasi masuk", "80"});
        add(new String[]{"dividen", "70"});
        add(new String[]{"dapat", "40"});
        add(new String[]{"terima", "40"});
        add(new String[]{"masuk", "30"});
    }};

    // ── Singleton rule cache ─────────────────────────────────────────────────────

    private static CategoryRule[] incomeRules = null;
    private static CategoryRule[] expenseRules = null;
    private static final int MIN_CONFIDENCE = 25;

    // ── Public API ───────────────────────────────────────────────────────────────

    public static boolean parseAndSave(Context context, String text) {
        try {
            Transaction transaction = parse(context, text);
            if (transaction == null) return false;
            return TransactionStorage.saveTransaction(context, transaction);
        } catch (Exception e) {
            Log.e(TAG, "parseAndSave error", e);
            return false;
        }
    }

    public static Transaction parse(Context context, String text) {
        if (text == null || text.trim().isEmpty()) return null;
        try {
            String normalizedText = text.toLowerCase(Locale.US).trim();

            // 1. Detect transaction type first (uses phrase scoring + negation awareness)
            String type = detectType(normalizedText);

            // 2. Extract best candidate amount using multi-strategy waterfall
            double amount = extractAmount(normalizedText);
            if (amount <= 0) {
                Log.w(TAG, "Could not extract a valid amount from: " + text);
                return null;
            }

            // 3. Match best category
            loadRules(context);
            String categoryId = detectCategory(normalizedText, type);

            // 4. Extract clean description / notes
            String notes = extractNotes(normalizedText, amount);

            // 5. Build transaction
            Transaction tx = new Transaction();
            tx.id = UUID.randomUUID().toString();
            tx.type = type;
            tx.amount = amount;
            tx.categoryId = categoryId;
            tx.notes = notes;
            String now = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
            tx.date = now;
            tx.createdAt = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(new Date());

            Log.d(TAG, String.format("Parsed: type=%s amount=%.0f cat=%s notes=%s", type, amount, categoryId, notes));
            return tx;
        } catch (Exception e) {
            Log.e(TAG, "parse error", e);
            return null;
        }
    }

    // ── Amount Extraction ────────────────────────────────────────────────────────

    /**
     * Multi-strategy waterfall:
     * S1: "rp 20.000" / "rp20rb"  → most reliable, try first
     * S2: "20ribu" / "5juta"       → unit-tagged numbers
     * S3: "1.500.000"              → ID dot-separated format
     * S4: "1,500,000"              → international comma-separated
     * S5: bare ≥1000 integer       → last resort
     *
     * Returns the highest-confidence amount found.
     */
    private static double extractAmount(String text) {
        // Try strategies in order of reliability, return first valid hit
        double amount;

        amount = tryPattern(text, PAT_CURRENCY_PREFIX);
        if (amount > 0) return amount;

        amount = tryPattern(text, PAT_NUM_UNIT);
        if (amount > 0) return amount;

        amount = tryPattern(text, PAT_DOT_SEPARATED);
        if (amount > 0) return amount;

        amount = tryPattern(text, PAT_COMMA_SEPARATED);
        if (amount > 0) return amount;

        amount = tryPattern(text, PAT_BARE_NUMBER);
        return amount; // 0 if nothing found
    }

    /**
     * Run a single regex pattern and return the largest amount found.
     * Handles named groups "num" (required) and "unit" (optional).
     */
    private static double tryPattern(String text, Pattern pattern) {
        Matcher m = pattern.matcher(text);
        double best = 0;
        boolean hasUnit = false;

        while (m.find()) {
            try {
                String rawNum = m.group("num");
                if (rawNum == null || rawNum.isEmpty()) continue;

                double number = normalizeNumber(rawNum);
                if (Double.isNaN(number) || number <= 0) continue;

                // Apply verbal unit multiplier
                String unitGroup = null;
                try { unitGroup = m.group("unit"); } catch (IllegalArgumentException ignored) {}
                if (unitGroup != null) {
                    number = applyUnit(number, unitGroup);
                    hasUnit = true;
                }

                if (number > best) best = number;
            } catch (Exception e) {
                // skip this match
            }
        }
        return best;
    }

    /**
     * Normalize a raw numeric string to a double.
     * Handles:
     *   - "20000"     → 20000
     *   - "20.000"    → 20000  (ID thousand separator)
     *   - "20,000"    → 20000  (alternative thousand separator)
     *   - "1.500.000" → 1500000
     *   - "20.5"      → 20.5   (decimal, unlikely in IDR context but handled)
     */
    private static double normalizeNumber(String raw) {
        if (raw == null || raw.isEmpty()) return Double.NaN;

        boolean hasDot = raw.contains(".");
        boolean hasComma = raw.contains(",");

        if (hasDot && hasComma) {
            // Mixed: figure out which is thousand and which is decimal
            // Example: "1.234.567,89" → dot=thousand, comma=decimal
            //          "1,234,567.89" → comma=thousand, dot=decimal
            int firstDot = raw.indexOf('.');
            int firstComma = raw.indexOf(',');
            if (firstDot < firstComma) {
                // Dot is thousand separator
                raw = raw.replace(".", "").replace(",", ".");
            } else {
                // Comma is thousand separator
                raw = raw.replace(",", "");
            }
        } else if (hasDot) {
            // Only dots: check if thousand separator or decimal
            String[] parts = raw.split("\\.");
            boolean allThreeDigit = true;
            for (int i = 1; i < parts.length; i++) {
                if (parts[i].length() != 3) { allThreeDigit = false; break; }
            }
            if (allThreeDigit && parts.length > 1) {
                // "1.500.000" or "20.000" → thousand separator
                raw = raw.replace(".", "");
            }
            // else leave as-is (decimal like "20.5")
        } else if (hasComma) {
            // Only commas: check if thousand separator or decimal
            String[] parts = raw.split(",");
            boolean allThreeDigit = true;
            for (int i = 1; i < parts.length; i++) {
                if (parts[i].length() != 3) { allThreeDigit = false; break; }
            }
            if (allThreeDigit && parts.length > 1) {
                raw = raw.replace(",", "");
            } else {
                // Treat last comma as decimal separator
                int lastComma = raw.lastIndexOf(',');
                raw = raw.substring(0, lastComma).replace(",", "") + "." + raw.substring(lastComma + 1);
            }
        }

        try {
            return Double.parseDouble(raw);
        } catch (NumberFormatException e) {
            return Double.NaN;
        }
    }

    /** Apply a verbal unit multiplier to a base number. */
    private static double applyUnit(double number, String unit) {
        if (unit == null) return number;
        String u = unit.toLowerCase(Locale.US).trim();
        switch (u) {
            case "ribu": case "rb": case "k":
                return number * 1_000;
            case "juta": case "jt":
                return number * 1_000_000;
            case "miliar":
                return number * 1_000_000_000;
            case "ratus":
                return number * 100;
            default:
                return number;
        }
    }

    // ── Type Detection ───────────────────────────────────────────────────────────

    /**
     * Phrase-scored + negation-aware type detection.
     * Scans for income phrases and applies a confidence score.
     * If any preceding negation token is within 3 words, the score is negated.
     */
    private static String detectType(String text) {
        String[] tokens = text.split("\\s+");
        int totalIncomeScore = 0;

        for (String[] entry : INCOME_PHRASES) {
            String phrase = entry[0];
            int weight = Integer.parseInt(entry[1]);

            if (!text.contains(phrase)) continue;

            // Find phrase token position and check for negation within 3-token window
            int phraseStart = findPhraseStart(tokens, phrase.split("\\s+"));
            if (phraseStart >= 0) {
                boolean negated = isNegated(tokens, phraseStart, 3);
                totalIncomeScore += negated ? -weight : weight;
            }
        }

        return totalIncomeScore >= 40 ? "INCOME" : "EXPENSE";
    }

    /** Returns token index where phrase starts, or -1. */
    private static int findPhraseStart(String[] tokens, String[] phraseTokens) {
        outer:
        for (int i = 0; i <= tokens.length - phraseTokens.length; i++) {
            for (int j = 0; j < phraseTokens.length; j++) {
                if (!tokens[i + j].equals(phraseTokens[j])) continue outer;
            }
            return i;
        }
        return -1;
    }

    /** Returns true if any negation token appears within `window` tokens before phraseStart. */
    private static boolean isNegated(String[] tokens, int phraseStart, int window) {
        int scanFrom = Math.max(0, phraseStart - window);
        for (int i = scanFrom; i < phraseStart; i++) {
            if (NEGATION_TOKENS.contains(tokens[i])) return true;
        }
        return false;
    }

    // ── Category Detection ───────────────────────────────────────────────────────

    /**
     * BM25-inspired confidence scoring for category matching.
     * Match score = Σ (keyword_weight × idf_proxy) where idf_proxy = 1 / keyword_length_percentile.
     * This promotes longer, more specific keywords over short generic ones.
     */
    private static String detectCategory(String text, String type) {
        CategoryRule[] rules = "INCOME".equals(type) ? incomeRules : expenseRules;
        String defaultCategory = "INCOME".equals(type) ? "4" : "12";

        if (rules == null) return defaultCategory;

        String bestId = defaultCategory;
        double bestScore = 0;

        for (CategoryRule rule : rules) {
            double score = rule.score(text);
            if (score > bestScore) {
                bestScore = score;
                bestId = rule.categoryId;
            }
        }

        return bestScore >= MIN_CONFIDENCE ? bestId : defaultCategory;
    }

    // ── Notes Extraction ─────────────────────────────────────────────────────────

    /**
     * Strips amounts, currency tokens, and generic action words from text
     * while preserving meaningful context like quantity + item ("2 nasi goreng").
     */
    private static String extractNotes(String text, double amount) {
        String cleaned = text;

        // Remove "rp..." patterns first
        cleaned = PAT_RP_AMOUNT.matcher(cleaned).replaceAll(" ");

        // Remove number+unit combos
        cleaned = PAT_NUM_UNIT_CLEAN.matcher(cleaned).replaceAll(" ");

        // Remove large/dot-separated numbers
        cleaned = PAT_LARGE_NUM_CLEAN.matcher(cleaned).replaceAll(" ");

        // Remove action / filler words
        cleaned = PAT_ACTION_WORDS.matcher(cleaned).replaceAll(" ");

        // Collapse spaces
        cleaned = PAT_MULTI_SPACE.matcher(cleaned).replaceAll(" ").trim();

        if (cleaned.isEmpty()) return "Transaksi";

        // Capitalize first letter
        return Character.toUpperCase(cleaned.charAt(0)) + cleaned.substring(1);
    }

    // ── Rules Loading ────────────────────────────────────────────────────────────

    private static void loadRules(Context context) {
        if (incomeRules != null && expenseRules != null) return;

        try {
            java.io.InputStream is = context.getResources().openRawResource(R.raw.category_rules);
            byte[] buffer = new byte[is.available()];
            is.read(buffer);
            is.close();
            String json = new String(buffer, "UTF-8");

            JSONObject root = new JSONObject(json);
            incomeRules = parseRulesArray(root.getJSONArray("income_rules"));
            expenseRules = parseRulesArray(root.getJSONArray("expense_rules"));
            Log.d(TAG, "Loaded " + incomeRules.length + " income rules, " + expenseRules.length + " expense rules");
        } catch (Exception e) {
            Log.e(TAG, "Failed to load category_rules.json, using defaults", e);
            initDefaultRules();
        }
    }

    private static CategoryRule[] parseRulesArray(JSONArray arr) throws Exception {
        CategoryRule[] rules = new CategoryRule[arr.length()];
        for (int i = 0; i < arr.length(); i++) {
            JSONObject obj = arr.getJSONObject(i);
            String categoryId = obj.getString("categoryId");
            int priority = obj.getInt("priority");
            JSONArray kwArr = obj.getJSONArray("keywords");
            List<String> keywords = new ArrayList<>();
            for (int j = 0; j < kwArr.length(); j++) {
                keywords.add(kwArr.getString(j).toLowerCase(Locale.US));
            }
            rules[i] = new CategoryRule(categoryId, priority, keywords.toArray(new String[0]));
        }
        return rules;
    }

    private static void initDefaultRules() {
        incomeRules = new CategoryRule[]{
            new CategoryRule("1", 100, new String[]{"gaji", "salary", "upah"}),
            new CategoryRule("2", 100, new String[]{"bonus", "thr", "insentif"}),
            new CategoryRule("3", 100, new String[]{"investasi", "dividen", "saham"}),
            new CategoryRule("4", 50, new String[]{"freelance", "project", "jasa"})
        };
        expenseRules = new CategoryRule[]{
            new CategoryRule("9", 100, new String[]{"tagihan", "listrik", "pulsa", "wifi", "cicilan", "bpjs"}),
            new CategoryRule("10", 100, new String[]{"obat", "dokter", "apotek", "kesehatan", "balsem", "vitamin", "rumah sakit", "klinik"}),
            new CategoryRule("11", 100, new String[]{"sekolah", "kuliah", "kursus", "buku", "pendidikan", "les"}),
            new CategoryRule("5", 90, new String[]{"makan", "nasi", "ayam", "bakso", "kopi", "cafe", "resto", "warteg", "mie"}),
            new CategoryRule("6", 80, new String[]{"bensin", "grab", "gojek", "parkir", "tol", "ojek", "kereta", "mrt"}),
            new CategoryRule("8", 70, new String[]{"nonton", "bioskop", "netflix", "spotify", "game", "hiburan", "konser"}),
            new CategoryRule("7", 50, new String[]{"beli", "belanja", "shopee", "tokopedia", "indomaret", "alfamart", "baju", "sepatu"})
        };
    }

    // ── Inner Classes ────────────────────────────────────────────────────────────

    /**
     * CategoryRule with BM25-inspired scoring.
     * Longer keywords receive higher weight since they are more specific.
     * Score = Σ max(1, keyword.length / 4) per match × (priority / 10)
     */
    private static class CategoryRule {
        final String categoryId;
        final String[] keywords;
        final int priority;

        CategoryRule(String categoryId, int priority, String[] keywords) {
            this.categoryId = categoryId;
            this.priority = priority;
            this.keywords = keywords;
        }

        double score(String text) {
            double total = 0;
            for (String kw : keywords) {
                if (text.contains(kw)) {
                    // Specificity bonus: longer keywords are worth more
                    double kwWeight = Math.max(1.0, kw.length() / 4.0);
                    total += kwWeight * (priority / 10.0);
                }
            }
            return total;
        }
    }

    public static class Transaction {
        public String id;
        public String type;
        public double amount;
        public String categoryId;
        public String notes;
        public String date;
        public String createdAt;
        public String walletId = "default";

        public JSONObject toJSON() throws Exception {
            JSONObject json = new JSONObject();
            json.put("id", id);
            json.put("type", type);
            json.put("amount", amount);
            json.put("categoryId", categoryId);
            json.put("notes", notes);
            json.put("date", date + "T00:00:00.000Z");
            json.put("createdAt", createdAt);
            json.put("walletId", walletId);
            return json;
        }
    }
}
