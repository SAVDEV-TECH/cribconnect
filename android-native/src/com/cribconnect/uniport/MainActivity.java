package com.cribconnect.uniport;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

public class MainActivity extends Activity {
    private static final String BASE_ORIGIN = "https://cribconnect-gold.vercel.app";
    private static final String APP_URL = BASE_ORIGIN + "/?source=android_apk";
    private static final int FILE_CHOOSER_RESULT_CODE = 1001;

    private WebView webView;
    private ProgressBar progressBar;
    private LinearLayout offlineLayout;
    private ValueCallback<Uri[]> filePathCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Configure Deep Teal Status Bar (#0F766E)
        Window window = getWindow();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.parseColor("#0F766E"));
            window.setNavigationBarColor(Color.parseColor("#FFFFFF"));
        }

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.WHITE);

        webView = new WebView(this);
        setupWebView();

        // Top loading indicator bar
        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        FrameLayout.LayoutParams progressParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, 8, Gravity.TOP);
        progressBar.setLayoutParams(progressParams);
        progressBar.setMax(100);

        // Native Offline Retry Screen
        offlineLayout = createOfflineView();
        offlineLayout.setVisibility(View.GONE);

        root.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));
        root.addView(progressBar);
        root.addView(offlineLayout);

        setContentView(root);

        handleIncomingIntent(getIntent(), true);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingIntent(intent, false);
    }

    private void handleIncomingIntent(Intent intent, boolean loadDefaultIfEmpty) {
        if (intent != null && Intent.ACTION_VIEW.equals(intent.getAction()) && intent.getData() != null) {
            Uri data = intent.getData();
            String scheme = data.getScheme();
            String host = data.getHost();

            // Receive 1-Tap Google Sign-In callback from Chrome: cribconnect://auth-callback?token=...&redirect=...
            if ("cribconnect".equalsIgnoreCase(scheme) && "auth-callback".equalsIgnoreCase(host)) {
                String token = data.getQueryParameter("token");
                String redirect = data.getQueryParameter("redirect");
                if (redirect == null || redirect.isEmpty()) {
                    redirect = "/agent/dashboard";
                }
                if (token != null && !token.isEmpty()) {
                    String handoffUrl = BASE_ORIGIN + "/api/auth/native-handoff?token="
                            + Uri.encode(token) + "&redirect=" + Uri.encode(redirect);
                    webView.loadUrl(handoffUrl);
                    return;
                }
            } else if ("https".equalsIgnoreCase(scheme)) {
                webView.loadUrl(data.toString());
                return;
            }
        }

        if (loadDefaultIfEmpty) {
            webView.loadUrl(APP_URL);
        }
    }

    private void openInSystemBrowser(Uri uri) {
        try {
            // Prefer Chrome so the user's Android Google account is already signed in for 1-Tap login
            Intent chromeIntent = new Intent(Intent.ACTION_VIEW, uri);
            chromeIntent.setPackage("com.android.chrome");
            startActivity(chromeIntent);
        } catch (ActivityNotFoundException e) {
            try {
                Intent fallbackIntent = new Intent(Intent.ACTION_VIEW, uri);
                startActivity(fallbackIntent);
            } catch (ActivityNotFoundException ignored) {
            }
        }
    }

    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setSupportMultipleWindows(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Append CribConnectAndroid token so the web app uses Chrome Handoff for 1-Tap Google Sign-In
        String defaultUa = settings.getUserAgentString();
        if (defaultUa != null) {
            settings.setUserAgentString(defaultUa.replace("; wv", "") + " CribConnectAndroid/1.1");
        }

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cookieManager.setAcceptThirdPartyCookies(webView, true);
        }

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                offlineLayout.setVisibility(View.GONE);
                progressBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progressBar.setVisibility(View.GONE);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    CookieManager.getInstance().flush();
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleUri(request.getUrl());
            }

            @SuppressWarnings("deprecation")
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUri(Uri.parse(url));
            }

            private boolean handleUri(Uri uri) {
                if (uri == null) return false;
                String scheme = uri.getScheme();
                String host = uri.getHost() != null ? uri.getHost().toLowerCase() : "";
                String path = uri.getPath() != null ? uri.getPath().toLowerCase() : "";

                // 1. Hand off Native Google Sign-In & Google OAuth directly to Chrome (1-Tap, zero white screen!)
                if (path.startsWith("/auth/native-google") || host.contains("accounts.google.com")) {
                    openInSystemBrowser(uri);
                    return true;
                }

                // 2. Open WhatsApp, phone calls, emails, and Google Maps directions natively
                if ("whatsapp".equalsIgnoreCase(scheme)
                        || "tel".equalsIgnoreCase(scheme)
                        || "mailto".equalsIgnoreCase(scheme)
                        || "intent".equalsIgnoreCase(scheme)
                        || host.contains("wa.me")
                        || host.contains("api.whatsapp.com")
                        || (host.contains("google.com") && path.startsWith("/maps"))) {
                    try {
                        Intent externalIntent = new Intent(Intent.ACTION_VIEW, uri);
                        startActivity(externalIntent);
                        return true;
                    } catch (ActivityNotFoundException e) {
                        return false;
                    }
                }
                return false;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request != null && request.isForMainFrame()) {
                    progressBar.setVisibility(View.GONE);
                    offlineLayout.setVisibility(View.VISIBLE);
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
                if (newProgress >= 100) {
                    progressBar.setVisibility(View.GONE);
                }
            }

            // Prevent popup windows (OAuth/Paystack/external links) from causing a blank white screen
            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                WebView tempWebView = new WebView(MainActivity.this);
                tempWebView.setWebViewClient(new WebViewClient() {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
                        Uri popupUri = req.getUrl();
                        if (popupUri != null) {
                            String host = popupUri.getHost() != null ? popupUri.getHost().toLowerCase() : "";
                            if (host.contains("google.com") || host.contains("wa.me") || host.contains("whatsapp")) {
                                openInSystemBrowser(popupUri);
                            } else {
                                webView.loadUrl(popupUri.toString());
                            }
                        }
                        v.destroy();
                        return true;
                    }
                });
                WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                transport.setWebView(tempWebView);
                resultMsg.sendToTarget();
                return true;
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }

            // Enable native Photo & Video picker for Agents uploading apartments
            @Override
            public boolean onShowFileChooser(
                    WebView webView,
                    ValueCallback<Uri[]> filePathCallback,
                    FileChooserParams fileChooserParams) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }
                MainActivity.this.filePathCallback = filePathCallback;

                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"image/*", "video/*"});
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);

                try {
                    startActivityForResult(
                            Intent.createChooser(intent, "Select Property Photos or Video"),
                            FILE_CHOOSER_RESULT_CODE);
                } catch (ActivityNotFoundException e) {
                    MainActivity.this.filePathCallback = null;
                    return false;
                }
                return true;
            }
        });
    }

    private LinearLayout createOfflineView() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);
        layout.setBackgroundColor(Color.WHITE);
        layout.setPadding(64, 64, 64, 64);

        TextView title = new TextView(this);
        title.setText("CribConnect UNIPORT");
        title.setTextSize(20);
        title.setTextColor(Color.parseColor("#0F766E"));
        title.setGravity(Gravity.CENTER);

        TextView subtitle = new TextView(this);
        subtitle.setText("\nPlease check your mobile data or Wi-Fi connection and tap Retry.\n");
        subtitle.setTextSize(14);
        subtitle.setTextColor(Color.parseColor("#4B5563"));
        subtitle.setGravity(Gravity.CENTER);

        Button retryBtn = new Button(this);
        retryBtn.setText("Retry Connection");
        retryBtn.setBackgroundColor(Color.parseColor("#0F766E"));
        retryBtn.setTextColor(Color.WHITE);
        retryBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                offlineLayout.setVisibility(View.GONE);
                webView.reload();
            }
        });

        layout.addView(title);
        layout.addView(subtitle);
        layout.addView(retryBtn);
        return layout;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            if (filePathCallback == null) return;
            Uri[] results = null;
            if (resultCode == Activity.RESULT_OK && data != null) {
                if (data.getClipData() != null) {
                    int count = data.getClipData().getItemCount();
                    results = new Uri[count];
                    for (int i = 0; i < count; i++) {
                        results[i] = data.getClipData().getItemAt(i).getUri();
                    }
                } else if (data.getData() != null) {
                    results = new Uri[]{data.getData()};
                }
            }
            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView != null && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
