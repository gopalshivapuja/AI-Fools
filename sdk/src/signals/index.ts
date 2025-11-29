import * as Device from 'expo-device';
import * as Network from 'expo-network';
import * as Localization from 'expo-localization';
import { BharatSignals } from './types';

/**
 * The "Signal Collector"
 * 
 * This function acts like a digital stethoscope.
 * It listens to the device's heartbeat (Network, RAM, Time) 
 * without asking the user a single question.
 */
export const collectSignals = async (): Promise<BharatSignals> => {
  // 1. Time Signals (The "When")
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

  // "Morning" in Bharat is typically 5 AM - 11 AM (Aarti time / School run)
  const isMorning = currentHour >= 5 && currentHour < 11;
  
  // "Weekend" includes Sunday and often Saturday evening
  const isWeekend = currentDay === 0 || currentDay === 6;

  // 2. Network Signals (The "How")
  // We check if they are on WiFi (Rich Media allowed) or Data (Lite Mode)
  let networkState;
  try {
      networkState = await Network.getNetworkStateAsync();
  } catch (e) {
      console.warn("Could not read network state", e);
      networkState = { type: Network.NetworkStateType.UNKNOWN, isInternetReachable: false };
  }

  // 3. Device Signals (The "What")
  // Identifying if this is a "Budget" phone (low RAM) is crucial for "Lite Mode"
  const deviceMemory = Device.totalMemory; // Null on some platforms, but works on Android
  
  // Mapping DeviceType enum to string for cleaner JSON
  let deviceTypeStr = 'UNKNOWN';
  if (Device.deviceType === Device.DeviceType.PHONE) deviceTypeStr = 'PHONE';
  if (Device.deviceType === Device.DeviceType.TABLET) deviceTypeStr = 'TABLET';
  if (Device.deviceType === Device.DeviceType.DESKTOP) deviceTypeStr = 'DESKTOP';

  const locale = Localization.getLocales()[0]?.languageTag || 'en-US';

  // Handle Network Type Enum
  let networkTypeStr = 'UNKNOWN';
  if (networkState.type === Network.NetworkStateType.WIFI) networkTypeStr = 'WIFI';
  else if (networkState.type === Network.NetworkStateType.CELLULAR) networkTypeStr = 'CELLULAR';
  else if (networkState.type === Network.NetworkStateType.NONE) networkTypeStr = 'NONE';
  else if (networkState.type !== undefined) networkTypeStr = String(networkState.type);

  return {
    device: {
      brand: Device.brand,
      modelName: Device.modelName,
      osVersion: Device.osVersion,
      deviceType: deviceTypeStr,
      totalMemory: deviceMemory,
    },
    network: {
      type: networkTypeStr,
      isInternetReachable: networkState.isInternetReachable ?? false,
      isWifi: networkState.type === Network.NetworkStateType.WIFI,
    },
    context: {
      timestamp: now.getTime(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: locale,
      isMorning: isMorning,
      isWeekend: isWeekend,
    },
  };
};
