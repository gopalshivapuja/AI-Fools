import * as Device from 'expo-device';
import * as Network from 'expo-network';
import * as Localization from 'expo-localization';
import * as Battery from 'expo-battery';
import { Dimensions } from 'react-native';
import { BharatSignals } from './types';

/**
 * The "Signal Collector" 🎯
 * 
 * This function acts like a digital stethoscope.
 * It listens to the device's heartbeat (Network, RAM, Battery, Time) 
 * without asking the user a single question.
 * 
 * FOR THE NEXT BILLION USERS:
 * - Battery matters: Low battery = Lite mode (save power!)
 * - Screen size matters: Small screen = Larger touch targets
 * - Time matters: Morning = Devotional, Evening = Business
 * - Language matters: System locale = UI language preference
 */
export const collectSignals = async (): Promise<BharatSignals> => {
  // ═══════════════════════════════════════════════════════════════
  // 1. TIME SIGNALS (The "When") ⏰
  // ═══════════════════════════════════════════════════════════════
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

  // Time periods aligned with Indian daily rhythms:
  // - Morning (5-11): Puja time, school run, morning chai
  // - Afternoon (11-17): Work/School hours
  // - Evening (17-21): Shop closing, family time, TV time
  // - Night (21-5): Rest, late night scrolling
  const isMorning = currentHour >= 5 && currentHour < 11;
  const isAfternoon = currentHour >= 11 && currentHour < 17;
  const isEvening = currentHour >= 17 && currentHour < 21;
  const isNight = currentHour >= 21 || currentHour < 5;
  
  // Determine time of day as string
  let timeOfDay = 'day';
  if (isMorning) timeOfDay = 'morning';
  else if (isAfternoon) timeOfDay = 'afternoon';
  else if (isEvening) timeOfDay = 'evening';
  else if (isNight) timeOfDay = 'night';

  // Weekend includes Sunday and often Saturday evening
  const isWeekend = currentDay === 0 || currentDay === 6;

  // ═══════════════════════════════════════════════════════════════
  // 2. NETWORK SIGNALS (The "How Connected") 📡
  // ═══════════════════════════════════════════════════════════════
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
  else if (networkState.type !== undefined) networkTypeStr = String(networkState.type);

  // ═══════════════════════════════════════════════════════════════
  // 3. DEVICE SIGNALS (The "What Phone") 📱
  // ═══════════════════════════════════════════════════════════════
  const deviceMemory = Device.totalMemory;
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Low-end device detection:
  // - RAM < 4GB is common in budget phones (Redmi, Realme entry-level)
  // - These users need Lite Mode (less animations, smaller images)
  const isLowEnd = deviceMemory !== null && deviceMemory < 4 * 1024 * 1024 * 1024;

  // Map DeviceType enum to string
  let deviceTypeStr = 'UNKNOWN';
  if (Device.deviceType === Device.DeviceType.PHONE) deviceTypeStr = 'PHONE';
  if (Device.deviceType === Device.DeviceType.TABLET) deviceTypeStr = 'TABLET';
  if (Device.deviceType === Device.DeviceType.DESKTOP) deviceTypeStr = 'DESKTOP';

  // ═══════════════════════════════════════════════════════════════
  // 4. BATTERY SIGNALS (The "Power State") 🔋
  // ═══════════════════════════════════════════════════════════════
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
  
  // Low power mode triggers at 20% - time to save battery!
  const isLowPower = batteryLevel < 0.2;

  // ═══════════════════════════════════════════════════════════════
  // 5. LANGUAGE & LOCALE SIGNALS (The "Who") 🌐
  // ═══════════════════════════════════════════════════════════════
  const locales = Localization.getLocales();
  const primaryLocale = locales[0];
  const fullLocale = primaryLocale?.languageTag || 'en-US';
  
  // Extract just the language code (hi, en, ta, te, mr, bn, etc.)
  const language = primaryLocale?.languageCode || 'en';

  // ═══════════════════════════════════════════════════════════════
  // BUILD THE SIGNALS OBJECT
  // ═══════════════════════════════════════════════════════════════
  return {
    device: {
      brand: Device.brand,
      modelName: Device.modelName,
      osVersion: Device.osVersion,
      deviceType: deviceTypeStr,
      totalMemory: deviceMemory,
      screenWidth,
      screenHeight,
      isLowEnd,
    },
    network: {
      type: networkTypeStr,
      isInternetReachable: networkState.isInternetReachable ?? false,
      isWifi: networkState.type === Network.NetworkStateType.WIFI,
    },
    battery: {
      level: batteryLevel,
      isCharging,
      isLowPower,
    },
    context: {
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
    },
  };
};
