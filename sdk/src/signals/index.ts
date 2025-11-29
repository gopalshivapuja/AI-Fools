import * as Device from 'expo-device';
import * as Network from 'expo-network';
import * as Localization from 'expo-localization';
import * as Battery from 'expo-battery';
import * as Brightness from 'expo-brightness';
import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { Dimensions, PixelRatio, Appearance, AccessibilityInfo, Platform } from 'react-native';
import { 
  BharatSignals, 
  DeviceSignals, 
  NetworkSignals, 
  BatterySignals, 
  ContextSignals,
  EnvironmentSignals,
  AppSignals,
  LocationSignals,
  ActivitySignals,
  SocialSignals,
  QuestionnaireAnswers
} from './types';

// ═══════════════════════════════════════════════════════════════
// STORAGE KEYS
// ═══════════════════════════════════════════════════════════════
const STORAGE_KEYS = {
  SESSION_COUNT: 'bharat_session_count',
  TOTAL_TIME: 'bharat_total_time',
  FIRST_LAUNCH: 'bharat_first_launch',
  LAST_OPEN: 'bharat_last_open',
  QUESTIONNAIRE: 'bharat_questionnaire',
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function getStoredNumber(key: string, defaultValue: number = 0): Promise<number> {
  try {
    const value = await SecureStore.getItemAsync(key);
    return value ? parseInt(value, 10) : defaultValue;
  } catch {
    return defaultValue;
  }
}

async function setStoredNumber(key: string, value: number): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value.toString());
  } catch (e) {
    console.warn('Failed to store value:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
// DEVICE SIGNALS COLLECTOR
// ═══════════════════════════════════════════════════════════════
async function collectDeviceSignals(): Promise<DeviceSignals> {
  const deviceMemory = Device.totalMemory;
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const fontScale = PixelRatio.getFontScale();
  const colorScheme = Appearance.getColorScheme() || 'no-preference';
  
  // Check reduced motion preference
  let reducedMotion = false;
  try {
    reducedMotion = await AccessibilityInfo.isReduceMotionEnabled();
  } catch {
    reducedMotion = false;
  }

  // Map DeviceType enum to string
  let deviceTypeStr = 'UNKNOWN';
  if (Device.deviceType === Device.DeviceType.PHONE) deviceTypeStr = 'PHONE';
  if (Device.deviceType === Device.DeviceType.TABLET) deviceTypeStr = 'TABLET';
  if (Device.deviceType === Device.DeviceType.DESKTOP) deviceTypeStr = 'DESKTOP';

  const isLowEnd = deviceMemory !== null && deviceMemory < 4 * 1024 * 1024 * 1024;

  return {
    brand: Device.brand,
    modelName: Device.modelName,
    osVersion: Device.osVersion,
    deviceType: deviceTypeStr,
    totalMemory: deviceMemory,
    screenWidth,
    screenHeight,
    isLowEnd,
    fontScale,
    colorScheme: colorScheme as 'light' | 'dark' | 'no-preference',
    reducedMotion,
  };
}

// ═══════════════════════════════════════════════════════════════
// NETWORK SIGNALS COLLECTOR
// ═══════════════════════════════════════════════════════════════
async function collectNetworkSignals(): Promise<NetworkSignals> {
  let networkState;
  try {
    networkState = await Network.getNetworkStateAsync();
  } catch (e) {
    console.warn("Could not read network state", e);
    networkState = { type: Network.NetworkStateType.UNKNOWN, isInternetReachable: false };
  }

  // Map Network Type Enum to readable string
  let networkTypeStr = 'UNKNOWN';
  if (networkState.type === Network.NetworkStateType.WIFI) networkTypeStr = 'WIFI';
  else if (networkState.type === Network.NetworkStateType.CELLULAR) networkTypeStr = 'CELLULAR';
  else if (networkState.type === Network.NetworkStateType.NONE) networkTypeStr = 'NONE';

  // Get carrier info (Android only via expo-cellular, but we'll try)
  let carrierName: string | null = null;
  let carrierCountry: string | null = null;
  
  try {
    // expo-cellular is available
    const Cellular = require('expo-cellular');
    carrierName = await Cellular.getCarrierNameAsync();
    carrierCountry = await Cellular.getIsoCountryCodeAsync();
  } catch {
    // Cellular info not available (iOS simulator, etc.)
  }

  return {
    type: networkTypeStr,
    isInternetReachable: networkState.isInternetReachable ?? false,
    isWifi: networkState.type === Network.NetworkStateType.WIFI,
    carrierName,
    carrierCountry,
  };
}

// ═══════════════════════════════════════════════════════════════
// BATTERY SIGNALS COLLECTOR
// ═══════════════════════════════════════════════════════════════
async function collectBatterySignals(): Promise<BatterySignals> {
  let batteryLevel = 1;
  let isCharging = false;
  
  try {
    batteryLevel = await Battery.getBatteryLevelAsync();
    const batteryState = await Battery.getBatteryStateAsync();
    isCharging = batteryState === Battery.BatteryState.CHARGING || 
                 batteryState === Battery.BatteryState.FULL;
  } catch (e) {
    console.warn("Could not read battery state", e);
  }

  return {
    level: batteryLevel,
    isCharging,
    isLowPower: batteryLevel < 0.2,
  };
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT SIGNALS COLLECTOR
// ═══════════════════════════════════════════════════════════════
function collectContextSignals(): ContextSignals {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();

  const isMorning = currentHour >= 5 && currentHour < 11;
  const isAfternoon = currentHour >= 11 && currentHour < 17;
  const isEvening = currentHour >= 17 && currentHour < 21;
  const isNight = currentHour >= 21 || currentHour < 5;
  
  let timeOfDay = 'day';
  if (isMorning) timeOfDay = 'morning';
  else if (isAfternoon) timeOfDay = 'afternoon';
  else if (isEvening) timeOfDay = 'evening';
  else if (isNight) timeOfDay = 'night';

  const isWeekend = currentDay === 0 || currentDay === 6;

  const locales = Localization.getLocales();
  const primaryLocale = locales[0];
  const fullLocale = primaryLocale?.languageTag || 'en-US';
  const language = primaryLocale?.languageCode || 'en';

  return {
    timestamp: now.getTime(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: fullLocale,
    language,
    isMorning,
    isAfternoon,
    isEvening,
    isNight,
    isWeekend,
    timeOfDay,
  };
}

// ═══════════════════════════════════════════════════════════════
// ENVIRONMENT SIGNALS COLLECTOR (New Tier 1)
// ═══════════════════════════════════════════════════════════════
async function collectEnvironmentSignals(): Promise<EnvironmentSignals> {
  let brightness = 0.5;
  let volumeLevel = 0.5;
  let isHeadphonesConnected = false;
  let isSilentMode = false;

  try {
    brightness = await Brightness.getBrightnessAsync();
  } catch {
    // Brightness not available
  }

  // Note: Volume and headphone detection require expo-av with specific setup
  // For now, we'll set defaults - can be enhanced with native modules

  return {
    brightness,
    volumeLevel,
    isHeadphonesConnected,
    isSilentMode,
  };
}

// ═══════════════════════════════════════════════════════════════
// APP SIGNALS COLLECTOR (New Tier 1)
// ═══════════════════════════════════════════════════════════════
async function collectAppSignals(): Promise<AppSignals> {
  const now = Date.now();
  
  // Get session count and increment
  const sessionCount = await getStoredNumber(STORAGE_KEYS.SESSION_COUNT, 0) + 1;
  await setStoredNumber(STORAGE_KEYS.SESSION_COUNT, sessionCount);
  
  // Get total time spent (will be updated when app closes)
  const totalTimeSpent = await getStoredNumber(STORAGE_KEYS.TOTAL_TIME, 0);
  
  // Check if first launch
  const firstLaunchStr = await SecureStore.getItemAsync(STORAGE_KEYS.FIRST_LAUNCH);
  const isFirstLaunch = !firstLaunchStr;
  if (isFirstLaunch) {
    await SecureStore.setItemAsync(STORAGE_KEYS.FIRST_LAUNCH, now.toString());
  }
  
  // Get last open time
  const lastOpenStr = await SecureStore.getItemAsync(STORAGE_KEYS.LAST_OPEN);
  const lastOpenTime = lastOpenStr ? parseInt(lastOpenStr, 10) : null;
  await SecureStore.setItemAsync(STORAGE_KEYS.LAST_OPEN, now.toString());
  
  // Get install time
  let installTime: number | null = null;
  try {
    const installDate = await Application.getInstallationTimeAsync();
    installTime = installDate.getTime();
  } catch {
    // Not available
  }

  // Get storage info
  let storageAvailable: number | null = null;
  try {
    const freeSpace = await FileSystem.getFreeDiskStorageAsync();
    storageAvailable = freeSpace;
  } catch {
    // Not available
  }

  return {
    installTime,
    lastOpenTime,
    appVersion: Application.nativeApplicationVersion,
    buildNumber: Application.nativeBuildVersion,
    sessionCount,
    totalTimeSpent,
    storageAvailable,
    isFirstLaunch,
  };
}

// ═══════════════════════════════════════════════════════════════
// LOCATION SIGNALS COLLECTOR (Tier 2 - requires permission)
// ═══════════════════════════════════════════════════════════════
async function collectLocationSignals(): Promise<LocationSignals> {
  // Default: no permission, no data
  const defaultLocation: LocationSignals = {
    hasPermission: false,
    latitude: null,
    longitude: null,
    city: null,
    state: null,
    country: null,
    tier: 'unknown',
    isUrban: false,
  };

  try {
    const Location = require('expo-location');
    const { status } = await Location.getForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      return defaultLocation;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low, // Use low accuracy to save battery
    });

    // Reverse geocode to get city/state
    const [geocode] = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    // Determine city tier (simplified - in production use a proper database)
    let tier: LocationSignals['tier'] = 'unknown';
    const city = geocode?.city?.toLowerCase() || '';
    
    const tier1Cities = ['mumbai', 'delhi', 'bangalore', 'bengaluru', 'chennai', 'kolkata', 'hyderabad', 'pune'];
    const tier2Cities = ['ahmedabad', 'jaipur', 'lucknow', 'kanpur', 'nagpur', 'indore', 'bhopal', 'patna', 'vadodara', 'surat'];
    
    if (tier1Cities.some(c => city.includes(c))) tier = 'tier1';
    else if (tier2Cities.some(c => city.includes(c))) tier = 'tier2';
    else if (geocode?.city) tier = 'tier3';
    else tier = 'rural';

    return {
      hasPermission: true,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      city: geocode?.city || null,
      state: geocode?.region || null,
      country: geocode?.country || null,
      tier,
      isUrban: tier === 'tier1' || tier === 'tier2',
    };
  } catch {
    return defaultLocation;
  }
}

// ═══════════════════════════════════════════════════════════════
// ACTIVITY SIGNALS COLLECTOR (Tier 2)
// ═══════════════════════════════════════════════════════════════
async function collectActivitySignals(): Promise<ActivitySignals> {
  const defaultActivity: ActivitySignals = {
    hasPermission: false,
    stepsToday: null,
    isMoving: false,
    activityType: 'unknown',
  };

  try {
    const { Pedometer, Accelerometer } = require('expo-sensors');
    
    // Check pedometer availability
    const isPedometerAvailable = await Pedometer.isAvailableAsync();
    if (!isPedometerAvailable) {
      return defaultActivity;
    }

    // Get steps from today
    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    
    const steps = await Pedometer.getStepCountAsync(start, end);

    // Quick accelerometer check for movement
    let isMoving = false;
    try {
      const isAccelAvailable = await Accelerometer.isAvailableAsync();
      if (isAccelAvailable) {
        // Just a quick sample - in production you'd want continuous monitoring
        isMoving = false; // Simplified for now
      }
    } catch {
      // Accelerometer not available
    }

    // Determine activity type based on steps
    let activityType: ActivitySignals['activityType'] = 'stationary';
    if (steps.steps > 5000) activityType = 'walking';
    if (steps.steps > 10000) activityType = 'running';

    return {
      hasPermission: true,
      stepsToday: steps.steps,
      isMoving,
      activityType,
    };
  } catch {
    return defaultActivity;
  }
}

// ═══════════════════════════════════════════════════════════════
// SOCIAL SIGNALS COLLECTOR (Tier 2)
// ═══════════════════════════════════════════════════════════════
async function collectSocialSignals(): Promise<SocialSignals> {
  const defaultSocial: SocialSignals = {
    hasContactsPermission: false,
    contactsCount: null,
    hasCalendarPermission: false,
    upcomingEventsCount: null,
    isBusy: false,
  };

  let result = { ...defaultSocial };

  // Check contacts
  try {
    const Contacts = require('expo-contacts');
    const { status } = await Contacts.getPermissionsAsync();
    
    if (status === 'granted') {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name],
      });
      result.hasContactsPermission = true;
      result.contactsCount = data.length;
    }
  } catch {
    // Contacts not available
  }

  // Check calendar
  try {
    const Calendar = require('expo-calendar');
    const { status } = await Calendar.getCalendarPermissionsAsync();
    
    if (status === 'granted') {
      const calendars = await Calendar.getCalendarsAsync();
      const now = new Date();
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      
      let totalEvents = 0;
      for (const cal of calendars) {
        try {
          const events = await Calendar.getEventsAsync([cal.id], now, twoHoursLater);
          totalEvents += events.length;
        } catch {
          // Skip calendars we can't read
        }
      }
      
      result.hasCalendarPermission = true;
      result.upcomingEventsCount = totalEvents;
      result.isBusy = totalEvents > 0;
    }
  } catch {
    // Calendar not available
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// QUESTIONNAIRE LOADER
// ═══════════════════════════════════════════════════════════════
async function loadQuestionnaire(): Promise<QuestionnaireAnswers> {
  const defaultAnswers: QuestionnaireAnswers = {
    primaryUse: null,
    preferredLanguage: null,
    ageGroup: null,
    interests: [],
    occupation: null,
    shoppingFrequency: null,
    contentPreference: null,
    answeredAt: null,
    completedDays: [],
  };

  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEYS.QUESTIONNAIRE);
    if (stored) {
      return { ...defaultAnswers, ...JSON.parse(stored) };
    }
  } catch {
    // Return defaults
  }

  return defaultAnswers;
}

// ═══════════════════════════════════════════════════════════════
// SAVE QUESTIONNAIRE
// ═══════════════════════════════════════════════════════════════
export async function saveQuestionnaire(answers: Partial<QuestionnaireAnswers>): Promise<void> {
  try {
    const existing = await loadQuestionnaire();
    const updated = {
      ...existing,
      ...answers,
      answeredAt: Date.now(),
    };
    await SecureStore.setItemAsync(STORAGE_KEYS.QUESTIONNAIRE, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save questionnaire:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN SIGNAL COLLECTOR
// ═══════════════════════════════════════════════════════════════
export const collectSignals = async (): Promise<BharatSignals> => {
  console.log("🎯 Collecting all signals...");

  // Collect all signals in parallel for speed
  const [
    device,
    network,
    battery,
    environment,
    app,
    location,
    activity,
    social,
    questionnaire,
  ] = await Promise.all([
    collectDeviceSignals(),
    collectNetworkSignals(),
    collectBatterySignals(),
    collectEnvironmentSignals(),
    collectAppSignals(),
    collectLocationSignals(),
    collectActivitySignals(),
    collectSocialSignals(),
    loadQuestionnaire(),
  ]);

  // Context is synchronous
  const context = collectContextSignals();

  console.log("✅ All signals collected");

  return {
    device,
    network,
    battery,
    context,
    environment,
    app,
    location,
    activity,
    social,
    questionnaire,
  };
};

// Export individual collectors for testing
export {
  collectDeviceSignals,
  collectNetworkSignals,
  collectBatterySignals,
  collectContextSignals,
  collectEnvironmentSignals,
  collectAppSignals,
  collectLocationSignals,
  collectActivitySignals,
  collectSocialSignals,
  loadQuestionnaire,
};
