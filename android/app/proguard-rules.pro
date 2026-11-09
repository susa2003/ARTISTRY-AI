# ARTISTRY AI — Production ProGuard & R8 Keep Rules
# Maintains JNI method signatures, native bindings, and dynamic reflections

# ------------------------------------------------------------------------------
# 1. React Native Core & Hermes Engine
# ------------------------------------------------------------------------------
-keep class com.facebook.react.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.soloader.** { *; }
-keepattributes *Annotation*, InnerClasses, Signature, EnclosingMethod
-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactProp <methods>;
    @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>;
}

# ------------------------------------------------------------------------------
# 2. React Native Skia (2D Graphics Engine)
# ------------------------------------------------------------------------------
-keep class com.shopify.reactnative.skia.** { *; }
-dontwarn com.shopify.reactnative.skia.**

# ------------------------------------------------------------------------------
# 3. React Native Gesture Handler & Screens
# ------------------------------------------------------------------------------
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.swmansion.reanimated.** { *; }

# ------------------------------------------------------------------------------
# 4. Expo Modules Architecture & SQLite
# ------------------------------------------------------------------------------
-keep class expo.modules.** { *; }
-keep interface expo.modules.** { *; }
-keep class expo.modules.sqlite.** { *; }
-keep class expo.modules.filesystem.** { *; }
-keep class expo.modules.imagepicker.** { *; }
-keep class expo.modules.imagemanipulator.** { *; }

# ------------------------------------------------------------------------------
# 5. Google Play Billing Client
# ------------------------------------------------------------------------------
-keep class com.android.billingclient.** { *; }
-keep interface com.android.billingclient.** { *; }
-dontwarn com.android.billingclient.**

# ------------------------------------------------------------------------------
# 6. OkHttp & Networking
# ------------------------------------------------------------------------------
-dontwarn okhttp3.**
-dontwarn okio.**
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase
