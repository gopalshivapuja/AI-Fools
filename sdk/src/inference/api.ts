import axios from 'axios';
import { BharatSignals } from '../signals/types';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

/**
 * Helper to determine the API URL
 * 
 * SOLUTION: We use localtunnel to expose the backend to the internet.
 * This works on ANY network - coffee shops, mobile data, anywhere!
 * 
 * FOR DEVELOPMENT:
 * 1. Start the backend: cd backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000
 * 2. Start the tunnel: lt --port 8000 --subdomain bharat-engine-hackathon
 * 3. The tunnel URL below will automatically route to your laptop!
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
    // This works from ANY network, not just your local WiFi 🌍
    return 'https://bharat-engine-hackathon.loca.lt'; 
};

/**
 * The Enhanced Engine Response with Day 30 features
 */
export interface Persona {
    name: string;
    emoji: string;
    description: string;
}

export interface Suggestion {
    title: string;
    description: string;
    action: string;
    icon: string;
}

export interface Journey {
    day: number;
    stage: 'newcomer' | 'explorer' | 'regular' | 'partner';
    insights: string[];
    value_delivered: string;
}

export interface EngineResponse {
    user_segment: string;
    recommended_mode: 'lite' | 'standard' | 'rich';
    persona: Persona;
    suggestions: Suggestion[];
    journey: Journey;
    greeting: string;
    message: string;
    reasoning: string[];  // Transparent explanation of WHY we made these choices
}

/**
 * Transform SDK signals to backend payload format
 * 
 * The backend expects snake_case, but our SDK uses camelCase.
 * This function bridges that gap.
 */
const transformSignalsToPayload = (signals: BharatSignals, journeyDay: number = 0) => {
    return {
        device: {
            brand: signals.device.brand,
            model_name: signals.device.modelName,
            device_type: signals.device.deviceType,
            total_memory: signals.device.totalMemory,
            screen_width: signals.device.screenWidth,
            screen_height: signals.device.screenHeight,
            is_low_end: signals.device.isLowEnd,
        },
        network: {
            type: signals.network.type,
            is_internet_reachable: signals.network.isInternetReachable,
            is_wifi: signals.network.isWifi,
        },
        battery: {
            level: signals.battery.level,
            is_charging: signals.battery.isCharging,
            is_low_power: signals.battery.isLowPower,
        },
        context: {
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
        journey_day: journeyDay,
    };
};

/**
 * Sends the collected signals to the Backend Inference Engine.
 * 
 * This is the heart of the Bharat Engine - it takes raw device context
 * and returns a fully personalized, LLM-powered response.
 * 
 * @param signals - The collected device signals
 * @param journeyDay - Which day of the user journey (0-30+)
 * @returns EngineResponse with persona, suggestions, and UI recommendations
 */
export const sendSignalsToBackend = async (
    signals: BharatSignals, 
    journeyDay: number = 0
): Promise<EngineResponse> => {
    const API_URL = `${getBaseUrl()}/v1/init`;
    
    try {
        console.log(`Sending signals to ${API_URL}...`);
        
        // Transform signals to backend format
        const payload = transformSignalsToPayload(signals, journeyDay);
        
        console.log("Payload:", JSON.stringify(payload, null, 2));

        const response = await axios.post<EngineResponse>(API_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 10000, // 10 second timeout
        });
        
        console.log("Backend Response:", response.data);
        return response.data;
        
    } catch (error) {
        console.error("API Call Failed:", error);
        
        /**
         * FAIL-OPEN STRATEGY 🛡️
         * 
         * Crucial for "Next Billion Users" who often have spotty internet.
         * If the backend is unreachable, we DO NOT crash the app.
         * Instead, we return a "Safe Default" that still provides value.
         * This ensures the user can always use the app, even if personalization fails.
         */
        return getFailOpenResponse(signals);
    }
};

/**
 * Generate a fail-open response when backend is unreachable.
 * 
 * This ensures the app NEVER crashes due to network issues.
 * Instead, we provide sensible defaults based on local signals.
 */
const getFailOpenResponse = (signals: BharatSignals): EngineResponse => {
    const time = signals.context.timeOfDay;
    const isLowEnd = signals.device.isLowEnd;
    const isLowBattery = signals.battery.isLowPower;
    
    // Determine mode locally
    let mode: 'lite' | 'standard' | 'rich' = 'standard';
    if (isLowEnd || isLowBattery) mode = 'lite';
    if (signals.network.isWifi && signals.battery.level > 0.5) mode = 'rich';
    
    // Time-based greeting
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
            description: "Continuing your journey even without internet"
        },
        suggestions: [
            {
                title: "📱 Explore Offline Features",
                description: "Some features work without internet",
                action: "show_offline",
                icon: "📴"
            },
            {
                title: "🔄 Retry Connection",
                description: "Tap to try connecting again",
                action: "retry_connection",
                icon: "🔄"
            },
            {
                title: "📖 Read Cached Content",
                description: "Access your saved items",
                action: "show_cached",
                icon: "💾"
            }
        ],
        journey: {
            day: 0,
            stage: 'newcomer',
            insights: ["Working offline - limited personalization"],
            value_delivered: "Offline resilience active"
        },
        greeting: greetings[time] || "🙏 Namaste! (Offline mode)",
        message: "Backend unreachable. Using fail-open defaults.",
        reasoning: [
            "📴 Currently offline - using local defaults",
            `⏰ Time detected: ${time}`,
            `📱 Device: ${isLowEnd ? 'Budget phone - Lite mode' : 'Standard device'}`,
            "🔄 Will sync when connection restored"
        ]
    };
};
