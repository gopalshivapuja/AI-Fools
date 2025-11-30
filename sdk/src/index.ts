import { collectSignals, saveQuestionnaire } from './signals';
import { sendSignalsToBackend } from './inference/api';
import type { BharatSignals, EngineResponse, QuestionnaireAnswers } from './signals/types';

// Import fingerprint module
import {
  createFingerprint,
  getFingerprintId,
  resetFingerprint,
  getTransparencyReport,
  trackSessionStart,
  trackSessionEnd
} from './fingerprint';
import type { BharatFingerprint, DerivedInsights } from './fingerprint';

// Re-export all types
export type { 
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
  QuestionnaireAnswers,
  EngineResponse, 
  Persona, 
  Suggestion,
  SpecificContent,
  Journey,
  FeedbackSignals,
  FeedbackItem,
  // User Intelligence types
  EventType,
  UserEvent,
  BehavioralPattern,
  UserPreferences,
  UserIntelligence,
  IntelligenceSummary,
  TrackEventRequest,
  TrackEventResponse
} from './signals/types';

/**
 * The main entry point for the Bharat Context-Adaptive Engine.
 * 
 * Collects all available signals and sends them to the backend
 * for hyper-personalized recommendations.
 * 
 * @param journeyDay - Which day of the user's journey (0-30+)
 * @returns Promise containing signals and inference results
 */
export const initBharatEngine = async (
  journeyDay: number = 0
): Promise<{ signals: BharatSignals; inference: EngineResponse }> => {
  console.log(`🚀 Initializing Bharat Context-Adaptive Engine (Day ${journeyDay})...`);
  
  // 1. Collect ALL signals (Tier 1 + Tier 2 where permitted)
  const signals = await collectSignals();
  
  // 2. Send to Backend for LLM-powered inference
  const inference = await sendSignalsToBackend(signals, journeyDay);
  
  console.log(`✅ Engine initialized. Mode: ${inference.recommended_mode}, Persona: ${inference.persona.name}`);
  console.log(`📊 Scenario: ${inference.matched_scenario} (${Math.round(inference.confidence * 100)}% confidence)`);
  
  return {
    signals,
    inference
  };
};

/**
 * Save questionnaire answers to local storage
 * and sync with backend on next engine call
 */
export { saveQuestionnaire };

/**
 * Collect signals only (no backend call)
 * Useful for offline-first scenarios
 */
export { collectSignals } from './signals';

/**
 * Send signals to backend
 * Useful when you want to control when the API call happens
 */
export { sendSignalsToBackend } from './inference/api';

/**
 * Event tracking - Tell the backend what users are doing
 */
export { trackEvent, trackEvents, sendFeedback, getUserIntelligence } from './inference/api';

// ═══════════════════════════════════════════════════════════════
// FINGERPRINT API
// ═══════════════════════════════════════════════════════════════

/**
 * Create or retrieve device fingerprint
 * The fingerprint is a privacy-respecting unique identifier
 * that doesn't require login.
 */
export { createFingerprint, getFingerprintId, resetFingerprint, getTransparencyReport };

/**
 * Session tracking for behavioral fingerprinting
 * Call trackSessionStart when app opens, trackSessionEnd when app closes
 */
export { trackSessionStart, trackSessionEnd };

/**
 * Fingerprint types
 */
export type { BharatFingerprint, DerivedInsights };

// ═══════════════════════════════════════════════════════════════
// PERMISSIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Request permissions for Tier 2 signals
 */
export const requestPermissions = async () => {
  const permissions: { [key: string]: boolean } = {};
  
  // Location
  try {
    const Location = require('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    permissions.location = status === 'granted';
  } catch {
    permissions.location = false;
  }
  
  // Contacts
  try {
    const Contacts = require('expo-contacts');
    const { status } = await Contacts.requestPermissionsAsync();
    permissions.contacts = status === 'granted';
  } catch {
    permissions.contacts = false;
  }
  
  // Calendar
  try {
    const Calendar = require('expo-calendar');
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    permissions.calendar = status === 'granted';
  } catch {
    permissions.calendar = false;
  }
  
  console.log('📋 Permissions:', permissions);
  return permissions;
};
