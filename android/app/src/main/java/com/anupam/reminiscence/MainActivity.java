package com.anupam.reminiscence;

import android.os.Bundle;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.view.inputmethod.InputMethodManager;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 🔑 Patch IME after Bridge fully initializes the WebView
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.setFocusable(true);
            webView.setFocusableInTouchMode(true);

            // 🔑 On every focus event, force IME to restart its input connection
            // This causes the keyboard to re-read inputType and show suggestions
            webView.setOnFocusChangeListener((v, hasFocus) -> {
                if (hasFocus) {
                    InputMethodManager imm = (InputMethodManager)
                        getSystemService(Context.INPUT_METHOD_SERVICE);
                    if (imm != null) {
                        imm.restartInput(webView);
                    }
                }
            });
        }

        // Notification channel
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                "vibe_channel",
                "Hardware Triggers",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Required for application feedback loops");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 100, 50, 100});

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
}