package com.ingatuang.money;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import java.io.File;

public class QuickAddWidgetProvider extends AppWidgetProvider {
    
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quick_add);

        // 1. Handle Custom Photo from internal storage
        File photoFile = new File(context.getFilesDir(), "widget_photo.jpg");
        if (photoFile.exists()) {
            try {
                Bitmap bitmap = BitmapFactory.decodeFile(photoFile.getAbsolutePath());
                if (bitmap != null) {
                    views.setImageViewBitmap(R.id.widget_photo, bitmap);
                    // Remove tint and padding if custom photo is used
                    views.setViewPadding(R.id.widget_photo, 0, 0, 0, 0);
                    views.setInt(R.id.widget_photo, "setColorFilter", 0); // Clear tint
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // 2. Intent for Main Widget Click (Normal Add)
        Intent intentMain = new Intent(context, QuickAddActivity.class);
        intentMain.putExtra("auto_voice", false);
        intentMain.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent piMain = PendingIntent.getActivity(context, 0, intentMain, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_quick_add_root, piMain);

        // 3. Intent for AI Voice Button Click (Auto-Voice)
        Intent intentVoice = new Intent(context, QuickAddActivity.class);
        intentVoice.putExtra("auto_voice", true);
        intentVoice.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent piVoice = PendingIntent.getActivity(context, 1, intentVoice, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_voice_button, piVoice);

        // Update the widget
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
