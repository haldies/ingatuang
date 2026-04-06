package com.ingatuang.money;

import android.os.Handler;
import android.os.Looper;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import com.ingatuang.money.database.TransactionEntity;
import com.ingatuang.money.database.CategoryEntity;
import com.ingatuang.money.database.AIConsentEntity;
import com.ingatuang.money.database.AIConsentDao;
import com.ingatuang.money.database.AppDatabase;
import com.ingatuang.money.repository.TransactionRepository;

import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class RoomStorageModule extends ReactContextBaseJavaModule {
    private final TransactionRepository repository;
    private final AIConsentDao aiConsentDao;
    private final ExecutorService executorService;
    private final Handler mainHandler;

    public RoomStorageModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.repository = new TransactionRepository(reactContext);
        AppDatabase db = AppDatabase.getInstance(reactContext);
        this.aiConsentDao = db.aiConsentDao();
        this.executorService = Executors.newSingleThreadExecutor();
        this.mainHandler = new Handler(Looper.getMainLooper());
    }

    @Override
    public String getName() {
        return "RoomStorage";
    }

    @ReactMethod
    public void getAllTransactions(Promise promise) {
        executorService.execute(() -> {
            try {
                List<TransactionEntity> transactions = repository.getAllTransactions();
                WritableArray array = Arguments.createArray();
                
                for (TransactionEntity transaction : transactions) {
                    WritableMap map = Arguments.createMap();
                    map.putString("id", transaction.getId());
                    map.putDouble("amount", transaction.getAmount());
                    map.putString("type", transaction.getType());
                    map.putString("date", transaction.getDate());
                    map.putString("categoryId", transaction.getCategoryId());
                    map.putString("notes", transaction.getNotes());
                    map.putString("createdAt", transaction.getCreatedAt());
                    array.pushMap(map);
                }
                
                promise.resolve(array);
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    @ReactMethod
    public void addTransaction(ReadableMap transactionMap, Promise promise) {
        executorService.execute(() -> {
            try {
                String id = String.valueOf(System.currentTimeMillis());
                double amount = transactionMap.getDouble("amount");
                String type = transactionMap.getString("type");
                String date = transactionMap.getString("date");
                String categoryId = transactionMap.getString("categoryId");
                String notes = transactionMap.hasKey("notes") ? transactionMap.getString("notes") : "";
                String createdAt = repository.getTodayDate();
                
                TransactionEntity transaction = new TransactionEntity(
                    id, amount, type, date, categoryId, notes, createdAt
                );
                
                long result = repository.addTransaction(transaction);
                
                if (result != -1) {
                    WritableMap resultMap = Arguments.createMap();
                    resultMap.putString("id", id);
                    resultMap.putDouble("amount", amount);
                    resultMap.putString("type", type);
                    resultMap.putString("date", date);
                    resultMap.putString("categoryId", categoryId);
                    resultMap.putString("notes", notes);
                    resultMap.putString("createdAt", createdAt);
                    promise.resolve(resultMap);
                } else {
                    promise.reject("ERROR", "Failed to add transaction");
                }
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    @ReactMethod
    public void updateTransaction(String id, ReadableMap updates, Promise promise) {
        executorService.execute(() -> {
            try {
                TransactionEntity transaction = repository.getTransactionById(id);
                
                if (transaction == null) {
                    promise.reject("ERROR", "Transaction not found");
                    return;
                }
                
                if (updates.hasKey("amount")) {
                    transaction.setAmount(updates.getDouble("amount"));
                }
                if (updates.hasKey("type")) {
                    transaction.setType(updates.getString("type"));
                }
                if (updates.hasKey("date")) {
                    transaction.setDate(updates.getString("date"));
                }
                if (updates.hasKey("categoryId")) {
                    transaction.setCategoryId(updates.getString("categoryId"));
                }
                if (updates.hasKey("notes")) {
                    transaction.setNotes(updates.getString("notes"));
                }
                
                int result = repository.updateTransaction(transaction);
                
                if (result > 0) {
                    WritableMap resultMap = Arguments.createMap();
                    resultMap.putString("id", transaction.getId());
                    resultMap.putDouble("amount", transaction.getAmount());
                    resultMap.putString("type", transaction.getType());
                    resultMap.putString("date", transaction.getDate());
                    resultMap.putString("categoryId", transaction.getCategoryId());
                    resultMap.putString("notes", transaction.getNotes());
                    resultMap.putString("createdAt", transaction.getCreatedAt());
                    promise.resolve(resultMap);
                } else {
                    promise.reject("ERROR", "Failed to update transaction");
                }
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    @ReactMethod
    public void deleteTransaction(String id, Promise promise) {
        executorService.execute(() -> {
            try {
                int result = repository.deleteTransaction(id);
                promise.resolve(result > 0);
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    @ReactMethod
    public void deleteAllTransactions(Promise promise) {
        executorService.execute(() -> {
            try {
                int result = repository.deleteAllTransactions();
                promise.resolve(result);
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    // Category methods
    @ReactMethod
    public void getAllCategories(Promise promise) {
        executorService.execute(() -> {
            try {
                List<CategoryEntity> categories = repository.getAllCategories();
                WritableArray array = Arguments.createArray();
                
                for (CategoryEntity category : categories) {
                    WritableMap map = Arguments.createMap();
                    map.putString("id", category.getId());
                    map.putString("name", category.getName());
                    map.putString("icon", category.getIcon());
                    map.putString("color", category.getColor());
                    map.putString("type", category.getType());
                    array.pushMap(map);
                }
                
                promise.resolve(array);
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    @ReactMethod
    public void getCategoryById(String id, Promise promise) {
        executorService.execute(() -> {
            try {
                CategoryEntity category = repository.getCategoryById(id);
                
                if (category != null) {
                    WritableMap map = Arguments.createMap();
                    map.putString("id", category.getId());
                    map.putString("name", category.getName());
                    map.putString("icon", category.getIcon());
                    map.putString("color", category.getColor());
                    map.putString("type", category.getType());
                    promise.resolve(map);
                } else {
                    promise.resolve(null);
                }
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    // AI Consent methods
    @ReactMethod
    public void getAIConsent(Promise promise) {
        executorService.execute(() -> {
            try {
                AIConsentEntity consent = aiConsentDao.getConsent();
                
                if (consent != null) {
                    WritableMap map = Arguments.createMap();
                    map.putBoolean("hasShownDialog", consent.isHasShownDialog());
                    map.putBoolean("hasAccepted", consent.isHasAccepted());
                    map.putString("timestamp", consent.getTimestamp());
                    promise.resolve(map);
                } else {
                    promise.resolve(null);
                }
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    @ReactMethod
    public void saveAIConsent(boolean hasAccepted, Promise promise) {
        executorService.execute(() -> {
            try {
                String timestamp = repository.getTodayDate();
                
                AIConsentEntity consent = new AIConsentEntity(
                    "default",
                    true,  // hasShownDialog
                    hasAccepted,
                    timestamp
                );
                
                long result = aiConsentDao.insertConsent(consent);
                
                if (result != -1) {
                    WritableMap map = Arguments.createMap();
                    map.putBoolean("hasShownDialog", true);
                    map.putBoolean("hasAccepted", hasAccepted);
                    map.putString("timestamp", timestamp);
                    promise.resolve(map);
                } else {
                    promise.reject("ERROR", "Failed to save AI consent");
                }
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    @ReactMethod
    public void resetAIConsent(Promise promise) {
        executorService.execute(() -> {
            try {
                int result = aiConsentDao.deleteConsent();
                promise.resolve(result > 0);
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }
    @ReactMethod
    public void getAllSubscriptions(Promise promise) {
        executorService.execute(() -> {
            try {
                AppDatabase db = AppDatabase.getInstance(getReactApplicationContext());
                List<com.ingatuang.money.database.SubscriptionEntity> subscriptions = db.subscriptionDao().getAllSubscriptions();
                WritableArray array = Arguments.createArray();
                
                for (com.ingatuang.money.database.SubscriptionEntity subscription : subscriptions) {
                    WritableMap map = Arguments.createMap();
                    map.putString("id", subscription.getId());
                    map.putString("name", subscription.getName());
                    map.putDouble("amount", subscription.getAmount());
                    map.putString("billingCycle", subscription.getBillingCycle());
                    map.putString("startDate", subscription.getStartDate());
                    map.putString("nextBillingDate", subscription.getNextBillingDate());
                    map.putBoolean("isActive", subscription.isActive());
                    if (subscription.getDescription() != null) {
                        map.putString("description", subscription.getDescription());
                    }
                    map.putString("createdAt", subscription.getCreatedAt());
                    array.pushMap(map);
                }
                
                promise.resolve(array);
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    @ReactMethod
    public void addSubscription(ReadableMap subscriptionMap, Promise promise) {
        executorService.execute(() -> {
            try {
                AppDatabase db = AppDatabase.getInstance(getReactApplicationContext());
                
                String id = String.valueOf(System.currentTimeMillis());
                String name = subscriptionMap.getString("name");
                double amount = subscriptionMap.getDouble("amount");
                String billingCycle = subscriptionMap.getString("billingCycle");
                String startDate = subscriptionMap.getString("startDate");
                String nextBillingDate = subscriptionMap.getString("nextBillingDate");
                boolean isActive = subscriptionMap.hasKey("isActive") ? subscriptionMap.getBoolean("isActive") : true;
                String description = subscriptionMap.hasKey("description") ? subscriptionMap.getString("description") : null;
                String createdAt = repository.getTodayDate();
                
                com.ingatuang.money.database.SubscriptionEntity subscription = new com.ingatuang.money.database.SubscriptionEntity(
                    id, name, amount, billingCycle, startDate, nextBillingDate, isActive, description, createdAt
                );
                
                db.subscriptionDao().insertSubscription(subscription);
                
                WritableMap resultMap = Arguments.createMap();
                resultMap.putString("id", id);
                resultMap.putString("name", name);
                resultMap.putDouble("amount", amount);
                resultMap.putString("billingCycle", billingCycle);
                resultMap.putString("startDate", startDate);
                resultMap.putString("nextBillingDate", nextBillingDate);
                resultMap.putBoolean("isActive", isActive);
                if (description != null) {
                    resultMap.putString("description", description);
                }
                resultMap.putString("createdAt", createdAt);
                promise.resolve(resultMap);
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    @ReactMethod
    public void updateSubscription(String id, ReadableMap updates, Promise promise) {
        executorService.execute(() -> {
            try {
                AppDatabase db = AppDatabase.getInstance(getReactApplicationContext());
                com.ingatuang.money.database.SubscriptionEntity subscription = db.subscriptionDao().getSubscriptionById(id);
                
                if (subscription == null) {
                    promise.reject("ERROR", "Subscription not found");
                    return;
                }
                
                if (updates.hasKey("name")) {
                    subscription.setName(updates.getString("name"));
                }
                if (updates.hasKey("amount")) {
                    subscription.setAmount(updates.getDouble("amount"));
                }
                if (updates.hasKey("billingCycle")) {
                    subscription.setBillingCycle(updates.getString("billingCycle"));
                }
                if (updates.hasKey("startDate")) {
                    subscription.setStartDate(updates.getString("startDate"));
                }
                if (updates.hasKey("nextBillingDate")) {
                    subscription.setNextBillingDate(updates.getString("nextBillingDate"));
                }
                if (updates.hasKey("isActive")) {
                    subscription.setActive(updates.getBoolean("isActive"));
                }
                if (updates.hasKey("description")) {
                    subscription.setDescription(updates.getString("description"));
                }
                
                db.subscriptionDao().updateSubscription(subscription);
                
                WritableMap resultMap = Arguments.createMap();
                resultMap.putString("id", subscription.getId());
                resultMap.putString("name", subscription.getName());
                resultMap.putDouble("amount", subscription.getAmount());
                resultMap.putString("billingCycle", subscription.getBillingCycle());
                resultMap.putString("startDate", subscription.getStartDate());
                resultMap.putString("nextBillingDate", subscription.getNextBillingDate());
                resultMap.putBoolean("isActive", subscription.isActive());
                if (subscription.getDescription() != null) {
                    resultMap.putString("description", subscription.getDescription());
                }
                resultMap.putString("createdAt", subscription.getCreatedAt());
                promise.resolve(resultMap);
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    @ReactMethod
    public void deleteSubscription(String id, Promise promise) {
        executorService.execute(() -> {
            try {
                AppDatabase db = AppDatabase.getInstance(getReactApplicationContext());
                db.subscriptionDao().deleteSubscriptionById(id);
                promise.resolve(true);
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    @ReactMethod
    public void deleteAllSubscriptions(Promise promise) {
        executorService.execute(() -> {
            try {
                AppDatabase db = AppDatabase.getInstance(getReactApplicationContext());
                db.subscriptionDao().deleteAllSubscriptions();
                promise.resolve(true);
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    // Category CRUD methods
    @ReactMethod
    public void addCategory(ReadableMap categoryMap, Promise promise) {
        executorService.execute(() -> {
            try {
                AppDatabase db = AppDatabase.getInstance(getReactApplicationContext());
                
                String id = categoryMap.getString("id");
                String name = categoryMap.getString("name");
                String icon = categoryMap.getString("icon");
                String color = categoryMap.getString("color");
                String type = categoryMap.getString("type");
                
                CategoryEntity category = new CategoryEntity(id, name, icon, color, type);
                db.categoryDao().insertCategory(category);
                
                WritableMap resultMap = Arguments.createMap();
                resultMap.putString("id", id);
                resultMap.putString("name", name);
                resultMap.putString("icon", icon);
                resultMap.putString("color", color);
                resultMap.putString("type", type);
                promise.resolve(resultMap);
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    @ReactMethod
    public void updateCategory(String id, ReadableMap updates, Promise promise) {
        executorService.execute(() -> {
            try {
                AppDatabase db = AppDatabase.getInstance(getReactApplicationContext());
                CategoryEntity category = db.categoryDao().getCategoryById(id);
                
                if (category == null) {
                    promise.reject("ERROR", "Category not found");
                    return;
                }
                
                if (updates.hasKey("name")) {
                    category.setName(updates.getString("name"));
                }
                if (updates.hasKey("icon")) {
                    category.setIcon(updates.getString("icon"));
                }
                if (updates.hasKey("color")) {
                    category.setColor(updates.getString("color"));
                }
                if (updates.hasKey("type")) {
                    category.setType(updates.getString("type"));
                }
                
                db.categoryDao().updateCategory(category);
                
                WritableMap resultMap = Arguments.createMap();
                resultMap.putString("id", category.getId());
                resultMap.putString("name", category.getName());
                resultMap.putString("icon", category.getIcon());
                resultMap.putString("color", category.getColor());
                resultMap.putString("type", category.getType());
                promise.resolve(resultMap);
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    @ReactMethod
    public void deleteCategory(String id, Promise promise) {
        executorService.execute(() -> {
            try {
                AppDatabase db = AppDatabase.getInstance(getReactApplicationContext());
                db.categoryDao().deleteCategoryById(id);
                promise.resolve(true);
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    // Split Bill methods
    @ReactMethod
    public void getAllSplitBills(Promise promise) {
        executorService.execute(() -> {
            try {
                AppDatabase db = AppDatabase.getInstance(getReactApplicationContext());
                List<com.ingatuang.money.database.SplitBillEntity> splitBills = db.splitBillDao().getAllSplitBills();
                WritableArray array = Arguments.createArray();
                
                for (com.ingatuang.money.database.SplitBillEntity splitBill : splitBills) {
                    WritableMap map = Arguments.createMap();
                    map.putString("id", splitBill.getId());
                    map.putString("title", splitBill.getTitle());
                    map.putDouble("taxPercentage", splitBill.getTaxPercentage());
                    map.putDouble("servicePercentage", splitBill.getServicePercentage());
                    map.putDouble("subtotal", splitBill.getSubtotal());
                    map.putDouble("total", splitBill.getTotal());
                    map.putString("createdAt", splitBill.getCreatedAt());
                    map.putString("itemsJson", splitBill.getItemsJson());
                    map.putString("personsJson", splitBill.getPersonsJson());
                    map.putString("assignmentsJson", splitBill.getAssignmentsJson());
                    array.pushMap(map);
                }
                
                promise.resolve(array);
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    @ReactMethod
    public void getSplitBillById(String id, Promise promise) {
        executorService.execute(() -> {
            try {
                AppDatabase db = AppDatabase.getInstance(getReactApplicationContext());
                com.ingatuang.money.database.SplitBillEntity splitBill = db.splitBillDao().getSplitBillById(id);
                
                if (splitBill != null) {
                    WritableMap map = Arguments.createMap();
                    map.putString("id", splitBill.getId());
                    map.putString("title", splitBill.getTitle());
                    map.putDouble("taxPercentage", splitBill.getTaxPercentage());
                    map.putDouble("servicePercentage", splitBill.getServicePercentage());
                    map.putDouble("subtotal", splitBill.getSubtotal());
                    map.putDouble("total", splitBill.getTotal());
                    map.putString("createdAt", splitBill.getCreatedAt());
                    map.putString("itemsJson", splitBill.getItemsJson());
                    map.putString("personsJson", splitBill.getPersonsJson());
                    map.putString("assignmentsJson", splitBill.getAssignmentsJson());
                    promise.resolve(map);
                } else {
                    promise.resolve(null);
                }
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    @ReactMethod
    public void addSplitBill(ReadableMap splitBillMap, Promise promise) {
        executorService.execute(() -> {
            try {
                AppDatabase db = AppDatabase.getInstance(getReactApplicationContext());
                
                String id = String.valueOf(System.currentTimeMillis());
                String title = splitBillMap.getString("title");
                double taxPercentage = splitBillMap.getDouble("taxPercentage");
                double servicePercentage = splitBillMap.getDouble("servicePercentage");
                double subtotal = splitBillMap.getDouble("subtotal");
                double total = splitBillMap.getDouble("total");
                String createdAt = repository.getTodayDate();
                String itemsJson = splitBillMap.getString("itemsJson");
                String personsJson = splitBillMap.getString("personsJson");
                String assignmentsJson = splitBillMap.getString("assignmentsJson");
                
                com.ingatuang.money.database.SplitBillEntity splitBill = new com.ingatuang.money.database.SplitBillEntity(
                    id, title, taxPercentage, servicePercentage, subtotal, total, createdAt,
                    itemsJson, personsJson, assignmentsJson
                );
                
                db.splitBillDao().insertSplitBill(splitBill);
                
                WritableMap resultMap = Arguments.createMap();
                resultMap.putString("id", id);
                resultMap.putString("title", title);
                resultMap.putDouble("taxPercentage", taxPercentage);
                resultMap.putDouble("servicePercentage", servicePercentage);
                resultMap.putDouble("subtotal", subtotal);
                resultMap.putDouble("total", total);
                resultMap.putString("createdAt", createdAt);
                resultMap.putString("itemsJson", itemsJson);
                resultMap.putString("personsJson", personsJson);
                resultMap.putString("assignmentsJson", assignmentsJson);
                promise.resolve(resultMap);
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    @ReactMethod
    public void deleteSplitBill(String id, Promise promise) {
        executorService.execute(() -> {
            try {
                AppDatabase db = AppDatabase.getInstance(getReactApplicationContext());
                db.splitBillDao().deleteSplitBillById(id);
                promise.resolve(true);
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }

    @ReactMethod
    public void deleteAllSplitBills(Promise promise) {
        executorService.execute(() -> {
            try {
                AppDatabase db = AppDatabase.getInstance(getReactApplicationContext());
                db.splitBillDao().deleteAllSplitBills();
                promise.resolve(true);
            } catch (Exception e) {
                promise.reject("ERROR", e.getMessage());
            }
        });
    }
}
