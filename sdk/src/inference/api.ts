import axios from 'axios';
import { BharatSignals, EngineResponse, UserEvent, TrackEventResponse } from '../signals/types';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { getFingerprintId } from '../fingerprint';

/**
 * Helper to determine the API URL
 */
const getBaseUrl = () => {
    // For Android Emulator, use the magic IP that routes to host machine:
    if (Device.isDevice === false && Platform.OS === 'android') {
        return 'http://10.0.2.2:8000';
    }
    
    // For iOS Simulator:
    if (Device.isDevice === false && Platform.OS === 'ios') {
        return 'http://localhost:8000';
    }

    // For Real Devices (Expo Go) - use the public tunnel URL!
    return 'https://bharat-engine-hackathon.loca.lt'; 
};

/**
 * Transform SDK signals to backend payload format (snake_case)
 */
const transformSignalsToPayload = async (signals: BharatSignals, journeyDay: number = 0) => {
    // Get fingerprint for user intelligence
    const fingerprintId = await getFingerprintId();
    
    return {
        fingerprint_id: fingerprintId,
        use_dynamic_recommendations: true,
        device: {
            brand: signals.device.brand,
            model_name: signals.device.modelName,
            os_version: signals.device.osVersion,
            device_type: signals.device.deviceType,
            total_memory: signals.device.totalMemory,
            screen_width: signals.device.screenWidth,
            screen_height: signals.device.screenHeight,
            is_low_end: signals.device.isLowEnd,
            font_scale: signals.device.fontScale,
            color_scheme: signals.device.colorScheme,
            reduced_motion: signals.device.reducedMotion,
        },
        network: {
            type: signals.network.type,
            is_internet_reachable: signals.network.isInternetReachable,
            is_wifi: signals.network.isWifi,
            carrier_name: signals.network.carrierName,
            carrier_country: signals.network.carrierCountry,
        },
        battery: {
            level: signals.battery.level,
            is_charging: signals.battery.isCharging,
            is_low_power: signals.battery.isLowPower,
        },
        context: {
            timestamp: signals.context.timestamp,
            timezone: signals.context.timezone,
            locale: signals.context.locale,
            language: signals.context.language,
            time_of_day: signals.context.timeOfDay,
            is_morning: signals.context.isMorning,
            is_afternoon: signals.context.isAfternoon,
            is_evening: signals.context.isEvening,
            is_night: signals.context.isNight,
            is_weekend: signals.context.isWeekend,
        },
        environment: {
            brightness: signals.environment.brightness,
            volume_level: signals.environment.volumeLevel,
            is_headphones_connected: signals.environment.isHeadphonesConnected,
            is_silent_mode: signals.environment.isSilentMode,
        },
        app: {
            install_time: signals.app.installTime,
            last_open_time: signals.app.lastOpenTime,
            app_version: signals.app.appVersion,
            build_number: signals.app.buildNumber,
            session_count: signals.app.sessionCount,
            total_time_spent: signals.app.totalTimeSpent,
            storage_available: signals.app.storageAvailable,
            is_first_launch: signals.app.isFirstLaunch,
        },
        location: {
            has_permission: signals.location.hasPermission,
            latitude: signals.location.latitude,
            longitude: signals.location.longitude,
            city: signals.location.city,
            state: signals.location.state,
            country: signals.location.country,
            tier: signals.location.tier,
            is_urban: signals.location.isUrban,
        },
        activity: {
            has_permission: signals.activity.hasPermission,
            steps_today: signals.activity.stepsToday,
            is_moving: signals.activity.isMoving,
            activity_type: signals.activity.activityType,
        },
        social: {
            has_contacts_permission: signals.social.hasContactsPermission,
            contacts_count: signals.social.contactsCount,
            has_calendar_permission: signals.social.hasCalendarPermission,
            upcoming_events_count: signals.social.upcomingEventsCount,
            is_busy: signals.social.isBusy,
        },
        questionnaire: {
            primary_use: signals.questionnaire.primaryUse,
            preferred_language: signals.questionnaire.preferredLanguage,
            age_group: signals.questionnaire.ageGroup,
            interests: signals.questionnaire.interests,
            occupation: signals.questionnaire.occupation,
            shopping_frequency: signals.questionnaire.shoppingFrequency,
            content_preference: signals.questionnaire.contentPreference,
            answered_at: signals.questionnaire.answeredAt,
            completed_days: signals.questionnaire.completedDays,
        },
        journey_day: journeyDay,
    };
};

/**
 * Sends the collected signals to the Backend Inference Engine.
 */
export const sendSignalsToBackend = async (
    signals: BharatSignals, 
    journeyDay: number = 0
): Promise<EngineResponse> => {
    const API_URL = `${getBaseUrl()}/v1/init`;
    
    try {
        console.log(`Sending signals to ${API_URL}...`);
        
        // Now awaiting since transformSignalsToPayload is async
        const payload = await transformSignalsToPayload(signals, journeyDay);
        
        console.log("Payload:", JSON.stringify(payload, null, 2));

        const response = await axios.post<EngineResponse>(API_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 15000, // 15 second timeout for more signals
        });
        
        console.log("Backend Response:", response.data);
        return response.data;
        
    } catch (error) {
        console.error("API Call Failed:", error);
        return getFailOpenResponse(signals);
    }
};

/**
 * Generate a fail-open response when backend is unreachable.
 */
const getFailOpenResponse = (signals: BharatSignals): EngineResponse => {
    const time = signals.context.timeOfDay;
    const isLowEnd = signals.device.isLowEnd;
    const isLowBattery = signals.battery.isLowPower;
    
    let mode: 'lite' | 'standard' | 'rich' = 'standard';
    if (isLowEnd || isLowBattery) mode = 'lite';
    if (signals.network.isWifi && signals.battery.level > 0.5) mode = 'rich';
    
    const greetings: Record<string, string> = {
        morning: "🌅 Shubh Prabhat! (Offline mode)",
        afternoon: "🌞 Namaste! (Offline mode)",
        evening: "🌆 Shubh Sandhya! (Offline mode)",
        night: "🌙 Good evening! (Offline mode)"
    };
    
    return {
        user_segment: "offline_default",
        recommended_mode: mode,
        persona: {
            name: "Offline Explorer",
            emoji: "📴",
            description: "Continuing your journey even without internet",
            scenario: "offline_fallback"
        },
        suggestions: [
            {
                title: "📱 Explore Offline Features",
                description: "Some features work without internet",
                action: "show_offline",
                icon: "📴",
                priority: 1
            },
            {
                title: "🔄 Retry Connection",
                description: "Tap to try connecting again",
                action: "retry_connection",
                icon: "🔄",
                priority: 2
            },
            {
                title: "📖 Read Cached Content",
                description: "Access your saved items",
                action: "show_cached",
                icon: "💾",
                priority: 3
            }
        ],
        journey: {
            day: 0,
            stage: 'newcomer',
            insights: ["Working offline - limited personalization"],
            value_delivered: "Offline resilience active",
            nextMilestone: "Connect to unlock full experience"
        },
        greeting: greetings[time] || "🙏 Namaste! (Offline mode)",
        message: "Backend unreachable. Using fail-open defaults.",
        reasoning: [
            "📴 Currently offline - using local defaults",
            `⏰ Time detected: ${time}`,
            `📱 Device: ${isLowEnd ? 'Budget phone - Lite mode' : 'Standard device'}`,
            "🔄 Will sync when connection restored"
        ],
        matched_scenario: "offline_fallback",
        confidence: 0.5
    };
};

// ═══════════════════════════════════════════════════════════════
// EVENT TRACKING API - Tell the backend what users are doing 🗣️
// ═══════════════════════════════════════════════════════════════

/**
 * Track a single event
 * 
 * @param event - The event to track
 * @returns Promise with the response
 * 
 * @example
 * // Track a video view
 * await trackEvent({
 *   eventType: 'view',
 *   eventName: 'watched_hanuman_chalisa',
 *   category: 'spiritual',
 *   contentType: 'video',
 *   source: 'YouTube'
 * });
 */
export const trackEvent = async (event: UserEvent): Promise<TrackEventResponse> => {
    return trackEvents([event]);
};

/**
 * Track multiple events in a batch
 * More efficient when you have several events to send at once
 * 
 * @param events - Array of events to track
 * @returns Promise with the response
 */
export const trackEvents = async (events: UserEvent[]): Promise<TrackEventResponse> => {
    const API_URL = `${getBaseUrl()}/v1/event`;
    
    try {
        // Get the user's fingerprint ID
        const fingerprintId = await getFingerprintId();
        
        if (!fingerprintId) {
            console.warn('⚠️ No fingerprint ID found - events will not be tracked');
            return {
                success: false,
                eventsTracked: 0,
                message: 'No fingerprint ID available'
            };
        }
        
        // Ensure each event has a timestamp
        const enrichedEvents = events.map(event => ({
            ...event,
            timestamp: event.timestamp || Date.now(),
            eventId: event.eventId || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }));
        
        console.log(`📊 Tracking ${enrichedEvents.length} events...`);
        
        const response = await axios.post<TrackEventResponse>(API_URL, {
            fingerprintId,
            events: enrichedEvents.map(e => ({
                event_id: e.eventId,
                event_type: e.eventType,
                event_name: e.eventName,
                category: e.category,
                content_type: e.contentType,
                source: e.source,
                scenario: e.scenario,
                timestamp: e.timestamp,
                duration_ms: e.durationMs,
                value: e.value,
                metadata: e.metadata || {}
            }))
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });
        
        console.log(`✅ Events tracked: ${response.data.eventsTracked}`);
        return response.data;
        
    } catch (error) {
        console.error('❌ Event tracking failed:', error);
        return {
            success: false,
            eventsTracked: 0,
            message: 'Failed to track events - will retry later'
        };
    }
};

/**
 * Send feedback to the backend with learning
 * 
 * @param suggestionAction - The action of the suggestion
 * @param scenario - Which scenario it came from
 * @param feedback - 'like' or 'dislike'
 * @param metadata - Optional category, contentType, source
 */
export const sendFeedback = async (
    suggestionAction: string,
    scenario: string,
    feedback: 'like' | 'dislike',
    metadata?: {
        category?: string;
        contentType?: string;
        source?: string;
    }
): Promise<{ success: boolean; learningApplied: boolean }> => {
    const API_URL = `${getBaseUrl()}/v1/feedback`;
    
    try {
        const fingerprintId = await getFingerprintId();
        
        const response = await axios.post(API_URL, {
            fingerprintId,
            suggestionAction,
            scenario,
            feedback,
            category: metadata?.category,
            contentType: metadata?.contentType,
            source: metadata?.source,
            timestamp: Date.now()
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });
        
        console.log(`📊 Feedback sent: ${feedback} on ${suggestionAction}`);
        return {
            success: response.data.success,
            learningApplied: response.data.learningApplied || false
        };
        
    } catch (error) {
        console.error('❌ Feedback failed:', error);
        return { success: false, learningApplied: false };
    }
};

/**
 * Get the user's intelligence summary
 * Shows what we've learned about them
 */
export const getUserIntelligence = async (): Promise<{
    summary: {
        journeyDay: number;
        stage: string;
        insights: string[];
        engagementScore: number;
        personalizationLevel: string;
    } | null;
}> => {
    try {
        const fingerprintId = await getFingerprintId();
        
        if (!fingerprintId) {
            return { summary: null };
        }
        
        const API_URL = `${getBaseUrl()}/v1/user/${fingerprintId}/intelligence`;
        const response = await axios.get(API_URL, { timeout: 10000 });
        
        return { summary: response.data.summary };
        
    } catch (error) {
        console.error('❌ Failed to get intelligence:', error);
        return { summary: null };
    }
};

// Re-export types
export type { EngineResponse, TrackEventResponse } from '../signals/types';
