import axios from 'axios';
import { BharatSignals } from '../signals/types';

/**
 * Helper to determine the API URL
 * 
 * In a production app, this would be an environment variable (Config.API_URL).
 * 
 * For Local Development:
 * - Android Emulator: 10.0.2.2 points to your host machine's localhost.
 * - iOS Simulator: localhost works fine.
 * - Real Device: You must replace this with your machine's LAN IP (e.g., 192.168.1.5).
 */
const getBaseUrl = () => {
    return 'http://localhost:8000'; 
};

/**
 * Sends the collected signals to the Backend Inference Engine.
 * 
 * @param signals - The raw signals collected from the device (Time, Network, Device Class).
 * @returns The Inference Result (User Segment, Recommended Mode).
 */
export const sendSignalsToBackend = async (signals: BharatSignals) => {
    const API_URL = `${getBaseUrl()}/v1/init`;
    
    try {
        console.log(`Sending signals to ${API_URL}...`);
        
        // Mapping SDK signals to Backend expected format
        // We perform a light transformation here to make the payload cleaner for the API.
        const payload = {
            network_type: signals.network.type,
            
            // Heuristic: If RAM is < 4GB, we flag it as "low_end".
            // This helps the backend decide if it should serve heavy videos or static images.
            device_class: signals.device.totalMemory && signals.device.totalMemory < 4000000000 ? "low_end" : "high_end", 
            
            location_city: "Unknown", // IP Geolocation happens on the server side for privacy & speed.
            time_of_day: signals.context.isMorning ? "morning" : "day"
        };

        const response = await axios.post(API_URL, payload);
        console.log("Backend Response:", response.data);
        return response.data;
    } catch (error) {
        console.error("API Call Failed:", error);
        
        /**
         * FAIL-OPEN STRATEGY
         * 
         * Crucial for "Next Billion Users" who often have spotty internet.
         * If the backend is unreachable, we DO NOT crash the app.
         * Instead, we return a "Safe Default" (Standard Mode).
         * This ensures the user can always use the app, even if personalization fails.
         */
        return {
            user_segment: "offline_default",
            recommended_mode: "standard",
            message: "Backend unreachable, using local default (Fail-Open Active)"
        };
    }
};
