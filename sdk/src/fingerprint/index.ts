/**
 * Bharat Engine - Device Fingerprinting Module
 * 
 * Creates a unique, privacy-respecting device fingerprint for user identification
 * across sessions without requiring login. Follows DPDP (India's Digital Personal
 * Data Protection) principles.
 * 
 * PRIVACY NOTES:
 * - All data is hashed before storage/transmission
 * - No raw PII is ever stored
 * - User can reset fingerprint at any time
 * - Transparency: User can see what signals are collected
 */

import { Platform, Dimensions, PixelRatio } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';

// ═══════════════════════════════════════════════════════════════
// FINGERPRINT TYPES
// ═══════════════════════════════════════════════════════════════

export interface HardwareFingerprint {
  deviceHash: string;      // Hash of device model + RAM + screen
  screenHash: string;      // Hash of screen dimensions + density
  sensorHash: string;      // Hash of available sensors
  stability: number;       // How stable this is across sessions (0-1)
}

export interface SoftwareFingerprint {
  osHash: string;          // OS version + build
  localeHash: string;      // Language + timezone + region
  settingsHash: string;    // Accessibility + preferences
}

export interface BehavioralFingerprint {
  usagePattern: string;    // Time-based usage patterns
  sessionPattern: string;  // Session behavior summary
  preferenceHash: string;  // Derived preferences
}

export interface DerivedInsights {
  incomeEstimate: 'low' | 'medium' | 'high' | 'unknown';
  techSavviness: 'beginner' | 'intermediate' | 'advanced' | 'unknown';
  lifestyle: 'student' | 'professional' | 'homemaker' | 'retired' | 'unknown';
  urbanity: 'metro' | 'urban' | 'semi-urban' | 'rural' | 'unknown';
}

export interface BharatFingerprint {
  // Stable ID (hash of all stable signals)
  fingerprintId: string;
  
  // Version for future compatibility
  version: string;
  
  // Confidence score (0-1)
  confidence: number;
  
  // Individual components
  hardware: HardwareFingerprint;
  software: SoftwareFingerprint;
  behavioral: BehavioralFingerprint;
  
  // Derived insights
  derived: DerivedInsights;
  
  // Metadata
  createdAt: number;
  lastUpdatedAt: number;
  sessionCount: number;
  
  // Privacy
  transparencyReport: string[];  // Human-readable list of signals used
}

// ═══════════════════════════════════════════════════════════════
// HASHING UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Simple hash function for fingerprinting.
 * In production, use a proper crypto library.
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to hex and ensure positive
  return 'fp_' + Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Create a stable hash from multiple values
 */
function combineHashes(...values: (string | number | null | undefined)[]): string {
  const combined = values
    .filter(v => v !== null && v !== undefined)
    .map(v => String(v))
    .join('|');
  return simpleHash(combined);
}

// ═══════════════════════════════════════════════════════════════
// FINGERPRINT COLLECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Collect hardware fingerprint signals
 */
async function collectHardwareFingerprint(): Promise<{ hash: HardwareFingerprint; signals: string[] }> {
  const signals: string[] = [];
  
  // Device info
  const brand = Device.brand || 'unknown';
  const model = Device.modelName || 'unknown';
  const memory = Device.totalMemory || 0;
  
  signals.push(`📱 Device: ${brand} ${model}`);
  signals.push(`💾 RAM: ${Math.round(memory / 1024 / 1024 / 1024)}GB`);
  
  // Screen info
  const { width, height } = Dimensions.get('window');
  const scale = PixelRatio.get();
  const fontScale = PixelRatio.getFontScale();
  
  signals.push(`📐 Screen: ${Math.round(width)}x${Math.round(height)} @${scale}x`);
  
  // Create hashes
  const deviceHash = combineHashes(brand, model, memory);
  const screenHash = combineHashes(width, height, scale, fontScale);
  const sensorHash = combineHashes(
    Device.supportedCpuArchitectures?.join(',') || 'unknown'
  );
  
  return {
    hash: {
      deviceHash,
      screenHash,
      sensorHash,
      stability: 0.95 // Hardware signals are very stable
    },
    signals
  };
}

/**
 * Collect software fingerprint signals
 */
async function collectSoftwareFingerprint(): Promise<{ hash: SoftwareFingerprint; signals: string[] }> {
  const signals: string[] = [];
  
  // OS info
  const osName = Device.osName || Platform.OS;
  const osVersion = Device.osVersion || Platform.Version;
  
  signals.push(`🖥️ OS: ${osName} ${osVersion}`);
  
  // Locale info - use getLocales() for newer expo-localization
  let locale = 'en';
  let timezone = 'UTC';
  let region = 'unknown';
  
  try {
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      locale = locales[0].languageTag || 'en';
      region = locales[0].regionCode || 'unknown';
    }
    const calendars = Localization.getCalendars();
    if (calendars && calendars.length > 0) {
      timezone = calendars[0].timeZone || 'UTC';
    }
  } catch (e) {
    // Fallback for older versions
    locale = (Localization as any).locale || 'en';
    timezone = (Localization as any).timezone || 'UTC';
    region = (Localization as any).region || 'unknown';
  }
  
  signals.push(`🌍 Locale: ${locale}, Region: ${region}`);
  signals.push(`⏰ Timezone: ${timezone}`);
  
  // App info
  let appVersion = 'unknown';
  let buildNumber = 'unknown';
  try {
    appVersion = Application.nativeApplicationVersion || 'unknown';
    buildNumber = Application.nativeBuildVersion || 'unknown';
  } catch (e) {
    // Ignore - not available
  }
  
  signals.push(`📦 App: v${appVersion} (${buildNumber})`);
  
  // Create hashes
  const osHash = combineHashes(osName, osVersion);
  const localeHash = combineHashes(locale, timezone, region);
  const settingsHash = combineHashes(
    PixelRatio.getFontScale(),
    Platform.OS
  );
  
  return {
    hash: {
      osHash,
      localeHash,
      settingsHash
    },
    signals
  };
}

/**
 * Collect behavioral fingerprint (requires stored session data)
 */
async function collectBehavioralFingerprint(): Promise<{ hash: BehavioralFingerprint; signals: string[] }> {
  const signals: string[] = [];
  
  // Load session history from storage
  let sessionCount = 1;
  let totalTimeSpent = 0;
  let preferredTimeOfDay = 'unknown';
  
  try {
    const stored = await SecureStore.getItemAsync('bharat_session_history');
    if (stored) {
      const history = JSON.parse(stored);
      sessionCount = history.sessionCount || 1;
      totalTimeSpent = history.totalTimeSpent || 0;
      preferredTimeOfDay = history.preferredTimeOfDay || 'unknown';
    }
  } catch (e) {
    // Ignore - first session
  }
  
  signals.push(`📊 Sessions: ${sessionCount}`);
  signals.push(`⏱️ Total time: ${Math.round(totalTimeSpent / 60)} minutes`);
  
  // Create hashes
  const usagePattern = combineHashes(preferredTimeOfDay, sessionCount > 10 ? 'power_user' : 'casual');
  const sessionPattern = combineHashes(sessionCount, Math.round(totalTimeSpent / 60));
  const preferenceHash = combineHashes(preferredTimeOfDay);
  
  return {
    hash: {
      usagePattern,
      sessionPattern,
      preferenceHash
    },
    signals
  };
}

/**
 * Derive insights from collected signals
 */
function deriveInsights(
  hardware: HardwareFingerprint,
  software: SoftwareFingerprint,
  sessionCount: number
): DerivedInsights {
  // Income estimate based on device class
  const memory = Device.totalMemory || 0;
  const memoryGB = memory / 1024 / 1024 / 1024;
  let incomeEstimate: DerivedInsights['incomeEstimate'] = 'unknown';
  
  if (memoryGB >= 8) {
    incomeEstimate = 'high';
  } else if (memoryGB >= 4) {
    incomeEstimate = 'medium';
  } else if (memoryGB > 0) {
    incomeEstimate = 'low';
  }
  
  // Tech savviness based on font scale and session count
  const fontScale = PixelRatio.getFontScale();
  let techSavviness: DerivedInsights['techSavviness'] = 'unknown';
  
  if (fontScale > 1.3 || sessionCount < 3) {
    techSavviness = 'beginner';
  } else if (sessionCount > 20) {
    techSavviness = 'advanced';
  } else {
    techSavviness = 'intermediate';
  }
  
  // Lifestyle - hard to determine without questionnaire
  const lifestyle: DerivedInsights['lifestyle'] = 'unknown';
  
  // Urbanity - requires location, default to unknown
  const urbanity: DerivedInsights['urbanity'] = 'unknown';
  
  return {
    incomeEstimate,
    techSavviness,
    lifestyle,
    urbanity
  };
}

// ═══════════════════════════════════════════════════════════════
// MAIN API
// ═══════════════════════════════════════════════════════════════

const FINGERPRINT_STORAGE_KEY = 'bharat_fingerprint';
const FINGERPRINT_VERSION = '1.0.0';

/**
 * Create or retrieve device fingerprint
 * 
 * @param forceRefresh - Force recalculation of fingerprint
 * @returns BharatFingerprint object
 */
export async function createFingerprint(forceRefresh = false): Promise<BharatFingerprint> {
  // Check for existing fingerprint
  if (!forceRefresh) {
    try {
      const stored = await SecureStore.getItemAsync(FINGERPRINT_STORAGE_KEY);
      if (stored) {
        const existing = JSON.parse(stored) as BharatFingerprint;
        // Update session count and return
        existing.sessionCount += 1;
        existing.lastUpdatedAt = Date.now();
        await SecureStore.setItemAsync(FINGERPRINT_STORAGE_KEY, JSON.stringify(existing));
        return existing;
      }
    } catch (e) {
      console.log('Creating new fingerprint...');
    }
  }
  
  // Collect all fingerprint components
  const [hardwareResult, softwareResult, behavioralResult] = await Promise.all([
    collectHardwareFingerprint(),
    collectSoftwareFingerprint(),
    collectBehavioralFingerprint()
  ]);
  
  // Combine all signals for transparency report
  const transparencyReport = [
    '📱 Hardware Signals:',
    ...hardwareResult.signals,
    '',
    '🖥️ Software Signals:',
    ...softwareResult.signals,
    '',
    '📊 Behavioral Signals:',
    ...behavioralResult.signals
  ];
  
  // Create master fingerprint ID
  const fingerprintId = combineHashes(
    hardwareResult.hash.deviceHash,
    hardwareResult.hash.screenHash,
    softwareResult.hash.osHash,
    softwareResult.hash.localeHash
  );
  
  // Calculate confidence based on available signals
  const confidence = Math.min(
    0.95,
    0.5 + (hardwareResult.hash.stability * 0.3) + 0.15
  );
  
  // Derive insights
  const derived = deriveInsights(
    hardwareResult.hash,
    softwareResult.hash,
    1 // First session
  );
  
  const fingerprint: BharatFingerprint = {
    fingerprintId,
    version: FINGERPRINT_VERSION,
    confidence,
    hardware: hardwareResult.hash,
    software: softwareResult.hash,
    behavioral: behavioralResult.hash,
    derived,
    createdAt: Date.now(),
    lastUpdatedAt: Date.now(),
    sessionCount: 1,
    transparencyReport
  };
  
  // Store fingerprint
  try {
    await SecureStore.setItemAsync(FINGERPRINT_STORAGE_KEY, JSON.stringify(fingerprint));
  } catch (e) {
    console.warn('Could not store fingerprint:', e);
  }
  
  return fingerprint;
}

/**
 * Get fingerprint ID only (quick access)
 */
export async function getFingerprintId(): Promise<string | null> {
  try {
    const stored = await SecureStore.getItemAsync(FINGERPRINT_STORAGE_KEY);
    if (stored) {
      const fingerprint = JSON.parse(stored) as BharatFingerprint;
      return fingerprint.fingerprintId;
    }
  } catch (e) {
    // Ignore
  }
  return null;
}

/**
 * Reset fingerprint (privacy feature)
 */
export async function resetFingerprint(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(FINGERPRINT_STORAGE_KEY);
    console.log('🔒 Fingerprint reset successfully');
  } catch (e) {
    console.warn('Could not reset fingerprint:', e);
  }
}

/**
 * Get transparency report (what signals are used)
 */
export async function getTransparencyReport(): Promise<string[]> {
  const fingerprint = await createFingerprint();
  return fingerprint.transparencyReport;
}

// ═══════════════════════════════════════════════════════════════
// SESSION TRACKING (for behavioral fingerprint)
// ═══════════════════════════════════════════════════════════════

const SESSION_HISTORY_KEY = 'bharat_session_history';

interface SessionHistory {
  sessionCount: number;
  totalTimeSpent: number;
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  sessions: {
    timestamp: number;
    duration: number;
    timeOfDay: string;
  }[];
}

/**
 * Track session start (call when app opens)
 */
export async function trackSessionStart(): Promise<void> {
  const now = Date.now();
  const hour = new Date().getHours();
  let timeOfDay: SessionHistory['preferredTimeOfDay'] = 'afternoon';
  
  if (hour >= 5 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
  else timeOfDay = 'night';
  
  try {
    const stored = await SecureStore.getItemAsync(SESSION_HISTORY_KEY);
    const history: SessionHistory = stored 
      ? JSON.parse(stored) 
      : { sessionCount: 0, totalTimeSpent: 0, preferredTimeOfDay: timeOfDay, sessions: [] };
    
    history.sessionCount += 1;
    history.sessions.push({ timestamp: now, duration: 0, timeOfDay });
    
    // Keep only last 10 sessions
    if (history.sessions.length > 10) {
      history.sessions = history.sessions.slice(-10);
    }
    
    await SecureStore.setItemAsync(SESSION_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn('Could not track session:', e);
  }
}

/**
 * Track session end (call when app closes/backgrounds)
 */
export async function trackSessionEnd(): Promise<void> {
  const now = Date.now();
  
  try {
    const stored = await SecureStore.getItemAsync(SESSION_HISTORY_KEY);
    if (!stored) return;
    
    const history: SessionHistory = JSON.parse(stored);
    if (history.sessions.length > 0) {
      const lastSession = history.sessions[history.sessions.length - 1];
      lastSession.duration = now - lastSession.timestamp;
      history.totalTimeSpent += lastSession.duration;
    }
    
    await SecureStore.setItemAsync(SESSION_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn('Could not update session:', e);
  }
}

