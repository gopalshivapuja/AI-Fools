export interface BharatSignals {
  device: {
    brand: string | null;
    modelName: string | null;
    osVersion: string | null;
    deviceType: string; // 'PHONE', 'TABLET', 'DESKTOP', 'UNKNOWN'
    totalMemory: number | null; // In bytes, helps identify low-end devices
    screenWidth: number;
    screenHeight: number;
    isLowEnd: boolean; // Derived: RAM < 4GB
  };
  network: {
    type: string; // 'WIFI', 'CELLULAR', etc.
    isInternetReachable: boolean;
    isWifi: boolean;
  };
  battery: {
    level: number; // 0-1 (percentage as decimal)
    isCharging: boolean;
    isLowPower: boolean; // < 20%
  };
  context: {
    timestamp: number;
    timezone: string;
    locale: string;
    language: string; // Extracted language code (hi, en, ta, etc.)
    isMorning: boolean; // 5 AM - 11 AM
    isAfternoon: boolean; // 11 AM - 5 PM
    isEvening: boolean; // 5 PM - 9 PM
    isNight: boolean; // 9 PM - 5 AM
    isWeekend: boolean;
    timeOfDay: string; // 'morning' | 'afternoon' | 'evening' | 'night'
  };
}

/**
 * Enhanced response from the Bharat Engine backend
 * Now includes LLM-generated content for Day 30 experiences
 */
export interface EngineResponse {
  // Core inference
  user_segment: string;
  recommended_mode: 'lite' | 'standard' | 'rich';
  
  // User persona (Day 30 feature)
  persona: {
    name: string; // e.g., "Morning Devotee", "Evening Merchant"
    emoji: string;
    description: string;
  };
  
  // LLM-generated personalized content
  suggestions: {
    title: string;
    description: string;
    action: string;
    icon: string;
  }[];
  
  // User journey (Day X progress)
  journey: {
    day: number; // 0-30
    stage: 'newcomer' | 'explorer' | 'regular' | 'partner';
    insights: string[];
    value_delivered: string; // e.g., "Saved 2 hours this week"
  };
  
  // Greeting message (LLM-generated)
  greeting: string;
  message: string;
}

export interface UserProfile {
  signals: BharatSignals;
  segment: string;
}
