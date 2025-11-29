import axios from 'axios';
import { BharatSignals } from '../signals/types';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

/**
 * Helper to determine the API URL
 * 
 * CHALLENGE: When running on a physical device via Expo Go, 'localhost' refers to the phone itself, not your laptop.
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
 * Sends the collected signals to the Backend Inference Engine.
 * ... (Rest of the file remains the same)
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
            message: `Backend unreachable (${API_URL}). Using Fail-Open Default.`
        };
    }
};
