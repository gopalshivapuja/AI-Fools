export interface BharatSignals {
  device: {
    brand: string | null;
    modelName: string | null;
    osVersion: string | null;
    deviceType: string; // 'PHONE', 'TABLET', 'DESKTOP', 'UNKNOWN'
    totalMemory: number | null; // In bytes, helps identify low-end devices
  };
  network: {
    type: string; // 'WIFI', 'CELLULAR', etc.
    isInternetReachable: boolean;
    isWifi: boolean;
  };
  context: {
    timestamp: number;
    timezone: string;
    locale: string;
    isMorning: boolean; // Derived signal
    isWeekend: boolean; // Derived signal
  };
}

export interface UserProfile {
  signals: BharatSignals;
  segment: string;
}

