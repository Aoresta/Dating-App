package com.aoresta.amour;

import android.app.WallpaperManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {
    @PluginMethod
    public void update(PluginCall call) {
        SharedPreferences.Editor editor = getContext().getSharedPreferences("amour_widgets", Context.MODE_PRIVATE).edit();
        String[] keys = {"days","daysSubtitle","mood","partnerMood","memoryTitle","memorySubtitle","memoryImage","doodleImage","question","questionSubtitle"};
        for (String key : keys) editor.putString(key, call.getString(key, ""));
        editor.apply();
        BaseAmourWidgetProvider.updateAll(getContext());
        call.resolve();
    }

    @PluginMethod
    public void setLockscreenWallpaper(PluginCall call) {
        try {
            Bitmap bitmap = decodeDataUrl(call.getString("image", ""));
            if (bitmap == null) { call.reject("Missing wallpaper image"); return; }
            WallpaperManager manager = WallpaperManager.getInstance(getContext());
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                manager.setBitmap(bitmap, null, true, WallpaperManager.FLAG_LOCK);
            } else {
                manager.setBitmap(bitmap);
            }
            call.resolve(new JSObject().put("ok", true));
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    private Bitmap decodeDataUrl(String dataUrl) {
        if (dataUrl == null || !dataUrl.startsWith("data:image")) return null;
        String base64 = dataUrl.substring(dataUrl.indexOf(",") + 1);
        byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
        return BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
    }
}
