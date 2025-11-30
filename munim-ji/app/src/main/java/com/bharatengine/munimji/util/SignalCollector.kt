package com.bharatengine.munimji.util

import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.res.Configuration
import android.media.AudioManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.os.Build
import android.os.Environment
import android.os.StatFs
import android.provider.Settings
import android.telephony.TelephonyManager
import android.view.WindowManager
import com.bharatengine.munimji.network.*
import java.util.*

/**
 * SignalCollector - Maximum Android Signal Collection! 📡
 * 
 * 🎓 Learning Tip: This class demonstrates how to access various
 * Android system services to collect contextual information.
 * 
 * Each signal category requires different APIs:
 * - Device info: Build class (no permission needed)
 * - Network: ConnectivityManager (needs ACCESS_NETWORK_STATE)
 * - Battery: BatteryManager broadcast (no permission needed)
 * - Audio: AudioManager (no permission needed)
 * - Display: WindowManager (no permission needed)
 * 
 * We collect everything we can WITHOUT asking for dangerous permissions
 * to create a seamless user experience!
 */
object SignalCollector {
    
    // ═══════════════════════════════════════════════════════════════
    // MAIN COLLECTION METHOD
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Collect all available signals from the device.
     * 
     * @param context Android context (usually from Activity or Application)
     * @return SignalPayload ready to send to the backend
     */
    fun collectAllSignals(context: Context): SignalPayload {
        return SignalPayload(
            device = collectDeviceSignals(context),
            network = collectNetworkSignals(context),
            battery = collectBatterySignals(context),
            context = collectContextSignals(),
            environment = collectEnvironmentSignals(context),
            app = collectAppSignals(context),
            location = collectLocationSignals(),
            activity = collectActivitySignals(),
            social = collectSocialSignals(),
            questionnaire = QuestionnaireSignals(), // User fills this later
            useDynamicRecommendations = true
        )
    }
    
    // ═══════════════════════════════════════════════════════════════
    // DEVICE SIGNALS
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Collect device hardware and configuration signals.
     * 
     * 🎓 The Build class gives us device info without any permissions!
     * This is one of Android's "freebies".
     */
    private fun collectDeviceSignals(context: Context): DeviceSignals {
        // Get display metrics
        val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val displayMetrics = context.resources.displayMetrics
        
        // Get memory info
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val memoryInfo = ActivityManager.MemoryInfo()
        activityManager.getMemoryInfo(memoryInfo)
        
        // Determine if low-end device (< 2GB RAM or low DPI)
        val totalMemoryMB = memoryInfo.totalMem / (1024 * 1024)
        val isLowEnd = totalMemoryMB < 2048 || displayMetrics.densityDpi < 240
        
        // Get font scale (accessibility setting)
        val fontScale = context.resources.configuration.fontScale
        
        // Get color scheme (dark mode)
        val nightMode = context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK
        val colorScheme = when (nightMode) {
            Configuration.UI_MODE_NIGHT_YES -> "dark"
            Configuration.UI_MODE_NIGHT_NO -> "light"
            else -> "light"
        }
        
        // Check for reduced motion (accessibility)
        val reducedMotion = try {
            Settings.Global.getFloat(
                context.contentResolver,
                Settings.Global.ANIMATOR_DURATION_SCALE
            ) == 0f
        } catch (e: Exception) {
            false
        }
        
        return DeviceSignals(
            brand = Build.BRAND,
            modelName = Build.MODEL,
            osVersion = Build.VERSION.RELEASE,
            deviceType = if (isTablet(context)) "TABLET" else "PHONE",
            totalMemory = memoryInfo.totalMem,
            screenWidth = displayMetrics.widthPixels.toFloat(),
            screenHeight = displayMetrics.heightPixels.toFloat(),
            isLowEnd = isLowEnd,
            fontScale = fontScale,
            colorScheme = colorScheme,
            reducedMotion = reducedMotion
        )
    }
    
    /**
     * Check if the device is a tablet based on screen size.
     */
    private fun isTablet(context: Context): Boolean {
        val config = context.resources.configuration
        return config.smallestScreenWidthDp >= 600
    }
    
    // ═══════════════════════════════════════════════════════════════
    // NETWORK SIGNALS
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Collect network connectivity signals.
     * 
     * 🎓 Requires ACCESS_NETWORK_STATE permission (normal permission,
     * granted automatically at install time).
     */
    private fun collectNetworkSignals(context: Context): NetworkSignals {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        
        var networkType = "UNKNOWN"
        var isWifi = false
        var isInternetReachable = false
        
        val network = connectivityManager.activeNetwork
        val capabilities = network?.let { connectivityManager.getNetworkCapabilities(it) }
        
        if (capabilities != null) {
            isInternetReachable = capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            
            when {
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> {
                    networkType = "WIFI"
                    isWifi = true
                }
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> {
                    networkType = "CELLULAR"
                }
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> {
                    networkType = "ETHERNET"
                }
            }
        }
        
        // Try to get carrier name (doesn't require dangerous permissions)
        val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
        val carrierName = telephonyManager?.networkOperatorName?.takeIf { it.isNotEmpty() }
        val carrierCountry = telephonyManager?.networkCountryIso?.uppercase()?.takeIf { it.isNotEmpty() }
        
        return NetworkSignals(
            type = networkType,
            isInternetReachable = isInternetReachable,
            isWifi = isWifi,
            carrierName = carrierName,
            carrierCountry = carrierCountry ?: "IN"
        )
    }
    
    // ═══════════════════════════════════════════════════════════════
    // BATTERY SIGNALS
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Collect battery status signals.
     * 
     * 🎓 Battery info comes from a sticky broadcast - no permission needed!
     * This is a common pattern for system state that changes frequently.
     */
    private fun collectBatterySignals(context: Context): BatterySignals {
        val batteryIntent = context.registerReceiver(
            null,
            IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        )
        
        val level = batteryIntent?.let {
            val rawLevel = it.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
            val scale = it.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
            if (rawLevel >= 0 && scale > 0) rawLevel.toFloat() / scale else 1f
        } ?: 1f
        
        val status = batteryIntent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                        status == BatteryManager.BATTERY_STATUS_FULL
        
        // Consider "low power" if below 20%
        val isLowPower = level < 0.2f
        
        return BatterySignals(
            level = level,
            isCharging = isCharging,
            isLowPower = isLowPower
        )
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CONTEXT SIGNALS (Time-based)
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Collect time-based context signals.
     * 
     * 🎓 Time doesn't require any permissions!
     * We use Calendar for local time-based decisions.
     */
    private fun collectContextSignals(): ContextSignals {
        val calendar = Calendar.getInstance()
        val hour = calendar.get(Calendar.HOUR_OF_DAY)
        val dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK)
        
        val timeOfDay = when (hour) {
            in 5..11 -> "morning"
            in 12..16 -> "afternoon"
            in 17..20 -> "evening"
            else -> "night"
        }
        
        val isWeekend = dayOfWeek == Calendar.SATURDAY || dayOfWeek == Calendar.SUNDAY
        
        return ContextSignals(
            timestamp = System.currentTimeMillis(),
            timezone = TimeZone.getDefault().id,
            locale = Locale.getDefault().toString(),
            language = Locale.getDefault().language,
            timeOfDay = timeOfDay,
            isMorning = hour in 5..11,
            isAfternoon = hour in 12..16,
            isEvening = hour in 17..20,
            isNight = hour < 5 || hour > 20,
            isWeekend = isWeekend
        )
    }
    
    // ═══════════════════════════════════════════════════════════════
    // ENVIRONMENT SIGNALS
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Collect environment signals (audio, display settings).
     * 
     * 🎓 AudioManager gives us volume info without permissions!
     */
    private fun collectEnvironmentSignals(context: Context): EnvironmentSignals {
        val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        
        // Get volume level (0 to 1)
        val maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
        val currentVolume = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
        val volumeLevel = if (maxVolume > 0) currentVolume.toFloat() / maxVolume else 0.5f
        
        // Check if headphones are connected
        val isHeadphonesConnected = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS).any { device ->
                device.type == android.media.AudioDeviceInfo.TYPE_WIRED_HEADPHONES ||
                device.type == android.media.AudioDeviceInfo.TYPE_WIRED_HEADSET ||
                device.type == android.media.AudioDeviceInfo.TYPE_BLUETOOTH_A2DP ||
                device.type == android.media.AudioDeviceInfo.TYPE_BLUETOOTH_SCO
            }
        } else {
            @Suppress("DEPRECATION")
            audioManager.isWiredHeadsetOn || audioManager.isBluetoothA2dpOn
        }
        
        // Check ringer mode for silent mode
        val isSilentMode = audioManager.ringerMode != AudioManager.RINGER_MODE_NORMAL
        
        // Get screen brightness (0 to 1)
        val brightness = try {
            val rawBrightness = Settings.System.getInt(
                context.contentResolver,
                Settings.System.SCREEN_BRIGHTNESS,
                128
            )
            rawBrightness.toFloat() / 255f
        } catch (e: Exception) {
            0.5f
        }
        
        return EnvironmentSignals(
            brightness = brightness,
            volumeLevel = volumeLevel,
            isHeadphonesConnected = isHeadphonesConnected,
            isSilentMode = isSilentMode
        )
    }
    
    // ═══════════════════════════════════════════════════════════════
    // APP SIGNALS
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Collect app-related signals.
     * 
     * 🎓 SharedPreferences is used to persist data across app sessions.
     * We use it here to track session count and other app metrics.
     */
    private fun collectAppSignals(context: Context): AppSignals {
        val prefs = context.getSharedPreferences("munim_ji_signals", Context.MODE_PRIVATE)
        
        // Track session count
        val sessionCount = prefs.getInt("session_count", 0) + 1
        prefs.edit().putInt("session_count", sessionCount).apply()
        
        // Track first launch and install time
        val isFirstLaunch = sessionCount == 1
        val installTime = if (isFirstLaunch) {
            val now = System.currentTimeMillis()
            prefs.edit().putLong("install_time", now).apply()
            now
        } else {
            prefs.getLong("install_time", System.currentTimeMillis())
        }
        
        // Get available storage
        val storageAvailable = try {
            val stat = StatFs(Environment.getDataDirectory().path)
            stat.availableBlocksLong * stat.blockSizeLong
        } catch (e: Exception) {
            null
        }
        
        // Get app version
        val appVersion = try {
            context.packageManager.getPackageInfo(context.packageName, 0).versionName
        } catch (e: Exception) {
            "1.0.0"
        }
        
        val buildNumber = try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                context.packageManager.getPackageInfo(context.packageName, 0).longVersionCode.toString()
            } else {
                @Suppress("DEPRECATION")
                context.packageManager.getPackageInfo(context.packageName, 0).versionCode.toString()
            }
        } catch (e: Exception) {
            "1"
        }
        
        return AppSignals(
            installTime = installTime,
            lastOpenTime = System.currentTimeMillis(),
            appVersion = appVersion,
            buildNumber = buildNumber,
            sessionCount = sessionCount,
            totalTimeSpent = prefs.getInt("total_time_spent", 0),
            storageAvailable = storageAvailable,
            isFirstLaunch = isFirstLaunch
        )
    }
    
    // ═══════════════════════════════════════════════════════════════
    // LOCATION SIGNALS (Placeholder - requires permission)
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Location signals - placeholder since we're not requesting location permission.
     * 
     * 🎓 Location requires ACCESS_FINE_LOCATION or ACCESS_COARSE_LOCATION,
     * which are "dangerous" permissions requiring user consent.
     * For the hackathon, we skip this to avoid permission dialogs.
     */
    private fun collectLocationSignals(): LocationSignals {
        return LocationSignals(
            hasPermission = false,
            country = "India" // Default for Bharat Engine!
        )
    }
    
    // ═══════════════════════════════════════════════════════════════
    // ACTIVITY SIGNALS (Placeholder - requires permission)
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Activity signals - placeholder since we're not requesting activity permission.
     * 
     * 🎓 Step counting requires ACTIVITY_RECOGNITION permission (dangerous).
     */
    private fun collectActivitySignals(): ActivitySignals {
        return ActivitySignals(
            hasPermission = false
        )
    }
    
    // ═══════════════════════════════════════════════════════════════
    // SOCIAL SIGNALS (Placeholder - requires permission)
    // ═══════════════════════════════════════════════════════════════
    
    /**
     * Social signals - placeholder since we're not requesting contacts/calendar permission.
     * 
     * 🎓 These require READ_CONTACTS and READ_CALENDAR (dangerous permissions).
     */
    private fun collectSocialSignals(): SocialSignals {
        return SocialSignals(
            hasContactsPermission = false,
            hasCalendarPermission = false
        )
    }
}

