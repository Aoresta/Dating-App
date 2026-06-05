package com.aoresta.amour;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Build;
import android.util.Base64;
import android.view.View;
import android.widget.RemoteViews;

public abstract class BaseAmourWidgetProvider extends AppWidgetProvider {
    protected abstract String type();

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) updateOne(context, manager, appWidgetId, type());
    }

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        updateProvider(context, manager, DaysWidgetProvider.class, "days");
        updateProvider(context, manager, DoodleWidgetProvider.class, "doodle");
        updateProvider(context, manager, MoodWidgetProvider.class, "mood");
        updateProvider(context, manager, MemoriesWidgetProvider.class, "memories");
        updateProvider(context, manager, QuestionWidgetProvider.class, "question");
    }

    private static void updateProvider(Context context, AppWidgetManager manager, Class<?> cls, String type) {
        int[] ids = manager.getAppWidgetIds(new android.content.ComponentName(context, cls));
        for (int id : ids) updateOne(context, manager, id, type);
    }

    private static void updateOne(Context context, AppWidgetManager manager, int appWidgetId, String type) {
        SharedPreferences prefs = context.getSharedPreferences("amour_widgets", Context.MODE_PRIVATE);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.amour_data_widget);
        String title = "Amour", main = "Open your little space", sub = "", image = "", route = "home";

        if ("days".equals(type)) {
            title = "Days Together"; main = prefs.getString("days", "0"); sub = prefs.getString("daysSubtitle", "days together"); route = "profile";
        } else if ("doodle".equals(type)) {
            title = "Latest Doodle"; main = "Doodle from partner"; sub = "Tap to open"; image = prefs.getString("doodleImage", ""); route = "doodle";
        } else if ("mood".equals(type)) {
            title = "Mood"; main = prefs.getString("mood", "— Set mood"); sub = prefs.getString("partnerMood", "— Partner mood"); route = "mood";
        } else if ("memories".equals(type)) {
            title = "Memories"; main = prefs.getString("memoryTitle", "No memories yet"); sub = prefs.getString("memorySubtitle", "Create your first memory"); image = prefs.getString("memoryImage", ""); route = "memories";
        } else if ("question".equals(type)) {
            title = "Couple Question"; main = prefs.getString("question", "Answer today’s question"); sub = prefs.getString("questionSubtitle", "Tap to answer together"); route = "quiz";
        }

        views.setTextViewText(R.id.widget_title, title);
        views.setTextViewText(R.id.widget_main, main);
        views.setTextViewText(R.id.widget_subtitle, sub);
        Bitmap bitmap = decodeDataUrl(image);
        if (bitmap != null) {
            views.setViewVisibility(R.id.widget_image, View.VISIBLE);
            views.setImageViewBitmap(R.id.widget_image, bitmap);
        } else {
            views.setViewVisibility(R.id.widget_image, View.GONE);
        }
        views.setOnClickPendingIntent(R.id.amour_widget_root, openIntent(context, route));
        manager.updateAppWidget(appWidgetId, views);
    }

    private static PendingIntent openIntent(Context context, String route) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("com.aoresta.amour://open/" + route), context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(context, route.hashCode(), intent, flags);
    }

    private static Bitmap decodeDataUrl(String dataUrl) {
        try {
            if (dataUrl == null || !dataUrl.startsWith("data:image")) return null;
            String base64 = dataUrl.substring(dataUrl.indexOf(",") + 1);
            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            return BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        } catch (Exception ignored) {
            return null;
        }
    }
}
