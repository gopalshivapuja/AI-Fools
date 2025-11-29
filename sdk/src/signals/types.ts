/**
 * Bharat Engine Signal Types
 * 
 * Comprehensive signal collection for hyper-personalization
 * of the Next Billion Users experience.
 */

// ═══════════════════════════════════════════════════════════════
// DEVICE SIGNALS
// ═══════════════════════════════════════════════════════════════
export interface DeviceSignals {
  brand: string | null;
  modelName: string | null;
  osVersion: string | null;
  deviceType: string; // 'PHONE', 'TABLET', 'DESKTOP', 'UNKNOWN'
  totalMemory: number | null; // In bytes
  screenWidth: number;
  screenHeight: number;
  isLowEnd: boolean; // RAM < 4GB
  
  // New Tier 1 signals
  fontScale: number; // System font scale (1.0 = normal, >1.0 = accessibility)
  colorScheme: 'light' | 'dark' | 'no-preference';
  reducedMotion: boolean; // Accessibility preference
}

// ═══════════════════════════════════════════════════════════════
// NETWORK SIGNALS
// ═══════════════════════════════════════════════════════════════
export interface NetworkSignals {
  type: string; // 'WIFI', 'CELLULAR', 'NONE', 'UNKNOWN'
  isInternetReachable: boolean;
  isWifi: boolean;
  
  // New Tier 1 signals
  carrierName: string | null; // Jio, Airtel, Vi, BSNL, etc.
  carrierCountry: string | null;
}

// ═══════════════════════════════════════════════════════════════
// BATTERY SIGNALS
// ═══════════════════════════════════════════════════════════════
export interface BatterySignals {
  level: number; // 0-1 (percentage as decimal)
  isCharging: boolean;
  isLowPower: boolean; // < 20%
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT SIGNALS (Time, Locale, etc.)
// ═══════════════════════════════════════════════════════════════
export interface ContextSignals {
  timestamp: number;
  timezone: string;
  locale: string;
  language: string; // hi, en, ta, te, mr, bn, etc.
  isMorning: boolean; // 5 AM - 11 AM
  isAfternoon: boolean; // 11 AM - 5 PM
  isEvening: boolean; // 5 PM - 9 PM
  isNight: boolean; // 9 PM - 5 AM
  isWeekend: boolean;
  timeOfDay: string; // 'morning' | 'afternoon' | 'evening' | 'night'
}

// ═══════════════════════════════════════════════════════════════
// ENVIRONMENT SIGNALS (New Tier 1)
// ═══════════════════════════════════════════════════════════════
export interface EnvironmentSignals {
  brightness: number; // 0-1 (screen brightness)
  volumeLevel: number; // 0-1 (system volume)
  isHeadphonesConnected: boolean;
  isSilentMode: boolean;
}

// ═══════════════════════════════════════════════════════════════
// APP SIGNALS (New Tier 1)
// ═══════════════════════════════════════════════════════════════
export interface AppSignals {
  installTime: number | null; // When app was installed (timestamp)
  lastOpenTime: number | null; // When app was last opened
  appVersion: string | null;
  buildNumber: string | null;
  sessionCount: number; // How many times app has been opened
  totalTimeSpent: number; // Total seconds spent in app
  storageAvailable: number | null; // Available storage in bytes
  isFirstLaunch: boolean;
}

// ═══════════════════════════════════════════════════════════════
// LOCATION SIGNALS (Tier 2 - Permission Required)
// ═══════════════════════════════════════════════════════════════
export interface LocationSignals {
  hasPermission: boolean;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  tier: 'tier1' | 'tier2' | 'tier3' | 'rural' | 'unknown'; // City tier
  isUrban: boolean;
}

// ═══════════════════════════════════════════════════════════════
// ACTIVITY SIGNALS (Tier 2 - Permission Required)
// ═══════════════════════════════════════════════════════════════
export interface ActivitySignals {
  hasPermission: boolean;
  stepsToday: number | null;
  isMoving: boolean; // Based on accelerometer
  activityType: 'stationary' | 'walking' | 'running' | 'driving' | 'unknown';
}

// ═══════════════════════════════════════════════════════════════
// SOCIAL SIGNALS (Tier 2 - Permission Required)
// ═══════════════════════════════════════════════════════════════
export interface SocialSignals {
  hasContactsPermission: boolean;
  contactsCount: number | null; // Social connectivity level
  hasCalendarPermission: boolean;
  upcomingEventsCount: number | null;
  isBusy: boolean; // Has events in next 2 hours
}

// ═══════════════════════════════════════════════════════════════
// QUESTIONNAIRE ANSWERS (Explicit User Input)
// ═══════════════════════════════════════════════════════════════
export interface QuestionnaireAnswers {
  // Day 0 Questions
  primaryUse: 'business' | 'personal' | 'education' | 'spiritual' | null;
  preferredLanguage: string | null;
  ageGroup: '18-25' | '26-35' | '36-50' | '50+' | null;
  
  // Day 3 Questions
  interests: string[]; // ['news', 'shopping', 'finance', 'entertainment', 'health', 'devotional']
  occupation: 'student' | 'employee' | 'business_owner' | 'homemaker' | 'retired' | null;
  
  // Day 7 Questions
  shoppingFrequency: 'daily' | 'weekly' | 'monthly' | 'rarely' | null;
  contentPreference: 'text' | 'images' | 'video' | 'audio' | null;
  
  // Metadata
  answeredAt: number | null; // Timestamp of last answer
  completedDays: number[]; // [0, 3, 7] - which day's questions are answered
}

// ═══════════════════════════════════════════════════════════════
// COMPLETE SIGNAL PAYLOAD
// ═══════════════════════════════════════════════════════════════
export interface BharatSignals {
  // Core signals (already implemented)
  device: DeviceSignals;
  network: NetworkSignals;
  battery: BatterySignals;
  context: ContextSignals;
  
  // New Tier 1 signals
  environment: EnvironmentSignals;
  app: AppSignals;
  
  // Tier 2 signals (permission-based)
  location: LocationSignals;
  activity: ActivitySignals;
  social: SocialSignals;
  
  // Explicit user input
  questionnaire: QuestionnaireAnswers;
}

// ═══════════════════════════════════════════════════════════════
// ENGINE RESPONSE
// ═══════════════════════════════════════════════════════════════
export interface Persona {
  name: string;
  emoji: string;
  description: string;
  scenario: string; // e.g., "morning_devotee", "evening_merchant"
}

export interface SpecificContent {
  name: string;           // "Pathaan", "Kesariya", "Butter Chicken"
  type: 'movie' | 'song' | 'recipe' | 'podcast' | 'article' | 'app';
  source: string;         // "YouTube", "Spotify", "Prime Video"
  deepLink?: string;      // "vnd.youtube://watch?v=VIDEO_ID"
  fallbackUrl?: string;   // Web URL if app not installed
  thumbnail?: string;     // Optional image URL
}

export interface Suggestion {
  title: string;
  description: string;
  action: string;
  icon: string;
  priority: number; // 1 = highest
  specificContent?: SpecificContent; // NEW: Actionable deep link content
}

export interface Journey {
  day: number;
  stage: 'newcomer' | 'explorer' | 'regular' | 'partner';
  insights: string[];
  value_delivered: string;
  nextMilestone: string; // e.g., "3 more days to Explorer!"
}

export interface EngineResponse {
  user_segment: string;
  recommended_mode: 'lite' | 'standard' | 'rich';
  persona: Persona;
  suggestions: Suggestion[];
  journey: Journey;
  greeting: string;
  message: string;
  reasoning: string[];
  
  // New: Scenario identification
  matched_scenario: string; // e.g., "morning_devotee_varanasi"
  confidence: number; // 0-1 how confident we are in the match
}

// ═══════════════════════════════════════════════════════════════
// FEEDBACK SIGNALS (User preference tracking)
// ═══════════════════════════════════════════════════════════════
export interface FeedbackItem {
  suggestionAction: string;  // The action of the suggestion (e.g., "play_aarti")
  scenario: string;          // Which scenario it came from
  feedback: 'like' | 'dislike';
  timestamp: number;
}

export interface FeedbackSignals {
  items: FeedbackItem[];
  // Aggregated preferences
  likedCategories: string[];    // Categories user likes (e.g., ["spiritual", "family"])
  dislikedCategories: string[]; // Categories user dislikes
  likeRate: number;             // 0-1, percentage of likes vs dislikes
}

// ═══════════════════════════════════════════════════════════════
// USER PROFILE (Stored locally)
// ═══════════════════════════════════════════════════════════════
export interface UserProfile {
  signals: BharatSignals;
  segment: string;
  persona: Persona | null;
  lastUpdated: number;
  
  // Session tracking
  sessionHistory: {
    timestamp: number;
    duration: number;
    scenario: string;
  }[];
}

// ═══════════════════════════════════════════════════════════════
// USER INTELLIGENCE MODELS - The Memory Palace 🧠
// These types match the backend Pydantic models
// ═══════════════════════════════════════════════════════════════

/**
 * Event types we can track.
 * Each represents a meaningful user action.
 */
export type EventType = 
  | 'view'           // Viewed content
  | 'click'          // Clicked on something
  | 'like'           // Liked/upvoted
  | 'dislike'        // Disliked/downvoted
  | 'share'          // Shared content
  | 'purchase'       // Made a purchase
  | 'session_start'  // Started using the app
  | 'session_end'    // Stopped using the app
  | 'suggestion_action'; // Acted on a suggestion

/**
 * A single user event.
 * Think of this as a "memory" we store about user behavior.
 */
export interface UserEvent {
  eventId?: string;        // Auto-generated if not provided
  eventType: EventType;    // What kind of event
  eventName: string;       // Descriptive name (e.g., "played_hanuman_chalisa")
  category?: string;       // Category (e.g., "spiritual", "entertainment")
  contentType?: string;    // Content type (e.g., "video", "audio")
  source?: string;         // Source (e.g., "YouTube", "Spotify")
  scenario?: string;       // Which persona scenario this relates to
  timestamp?: number;      // When it happened (auto-filled if not provided)
  durationMs?: number;     // How long they engaged (milliseconds)
  value?: number;          // For purchases or ratings
  metadata?: Record<string, any>; // Any extra data
}

/**
 * Patterns we detect from user behavior.
 * Example: "User loves spiritual content in the morning"
 */
export interface BehavioralPattern {
  patternType: 'time_preference' | 'content_preference' | 'engagement_pattern';
  description: string;
  confidence: number;      // 0-1 how confident we are
  detectedAt: number;      // When we detected this
  evidenceCount: number;   // How many events support this
}

/**
 * User preferences - what we've learned about them.
 */
export interface UserPreferences {
  // Content preferences
  likedCategories: string[];
  dislikedCategories: string[];
  preferredContentTypes: string[];
  preferredSources: string[];
  
  // Time preferences
  activeHours: number[];   // 0-23
  preferredTimeOfDay?: string;
  
  // Engagement stats
  avgSessionDurationMs: number;
  totalSessions: number;
  
  // Scenario affinity (which personas match them)
  scenarioAffinity: Record<string, number>;
}

/**
 * Complete user intelligence profile.
 * This is the "brain" we build for each user.
 */
export interface UserIntelligence {
  fingerprintId: string;
  createdAt: number;
  updatedAt: number;
  
  // Journey
  journeyDay: number;
  firstSeenAt: number;
  
  // Events
  recentEvents: UserEvent[];
  totalEvents: number;
  
  // Learning
  patterns: BehavioralPattern[];
  preferences: UserPreferences;
  
  // Feedback
  totalLikes: number;
  totalDislikes: number;
  
  // Scenarios
  lastScenario?: string;
  scenarioHistory: string[];
}

/**
 * Summary of user intelligence for display.
 */
export interface IntelligenceSummary {
  journeyDay: number;
  stage: 'newcomer' | 'explorer' | 'regular' | 'partner';
  insights: string[];
  topCategories: string[];
  topContentTypes: string[];
  engagementScore: number;  // 0-1
  personalizationLevel: 'low' | 'medium' | 'high';
}

/**
 * Request to track events
 */
export interface TrackEventRequest {
  fingerprintId: string;
  events: UserEvent[];
}

/**
 * Response from event tracking
 */
export interface TrackEventResponse {
  success: boolean;
  eventsTracked: number;
  message: string;
}
