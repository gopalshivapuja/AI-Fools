# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /sdk/tools/proguard/proguard-android.txt

# Keep Compose classes
-keep class androidx.compose.** { *; }

# Keep data classes for future API integration
-keep class com.bharatengine.munimji.data.** { *; }

