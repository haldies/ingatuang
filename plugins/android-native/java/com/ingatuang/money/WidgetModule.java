package com.ingatuang.money;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import org.json.JSONObject;

public class WidgetModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "WidgetModule";
    private static final String PREFS_NAME = "WidgetPrefs";
    private static final String KEY_API_URL = "api_url";
    private static final String KEY_API_KEY = "api_key";

    public WidgetModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void updateWidget(ReadableMap data) {
        try {
            Context context = getReactApplicationContext();
            
            // Save widget data to SharedPreferences (only if provided)
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            
            boolean hasData = false;
            
            if (data.hasKey("balance")) {
                editor.putString("balance", String.valueOf(data.getDouble("balance")));
                hasData = true;
            }
            if (data.hasKey("income")) {
                editor.putString("income", String.valueOf(data.getDouble("income")));
                hasData = true;
            }
            if (data.hasKey("expense")) {
                editor.putString("expense", String.valueOf(data.getDouble("expense")));
                hasData = true;
            }
            if (data.hasKey("month")) {
                editor.putString("month", data.getString("month"));
                hasData = true;
            }
            
            if (hasData) {
                editor.apply();
            }

            // Trigger widget update
            Intent intent = new Intent(context, QuickAddWidgetProvider.class);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            int[] ids = appWidgetManager.getAppWidgetIds(
                new ComponentName(context, QuickAddWidgetProvider.class)
            );
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
            
            context.sendBroadcast(intent);
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @ReactMethod
    public void setAPIConfig(String apiUrl, String apiKey) {
        try {
            Context context = getReactApplicationContext();
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            
            editor.putString(KEY_API_URL, apiUrl);
            editor.putString(KEY_API_KEY, apiKey);
            editor.apply();
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
