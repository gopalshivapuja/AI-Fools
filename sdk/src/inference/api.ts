import axios from 'axios';
import { BharatSignals } from '../signals/types';

// Helper to determine the API URL
// In Android Emulator, 10.0.2.2 points to localhost
// In iOS Simulator, localhost works
// For real devices, you'd need your local IP
const getBaseUrl = () => {
    // Simple check for now, can be made more robust
    // This is a "dumb" default for dev environments
    return 'http://localhost:8000'; 
};

export const sendSignalsToBackend = async (signals: BharatSignals) => {
    const API_URL = `${getBaseUrl()}/v1/init`;
    
    try {
        console.log(`Sending signals to ${API_URL}...`);
        
        // Mapping SDK signals to Backend expected format
        // Backend expects: network_type, device_class, location_city, time_of_day
        const payload = {
            network_type: signals.network.type,
            device_class: signals.device.totalMemory && signals.device.totalMemory < 4000000000 ? "low_end" : "high_end", // < 4GB RAM = Low End (Arbitrary threshold for MVP)
            location_city: "Unknown", // We aren't doing IP Geolocation in SDK yet, backend can infer from IP
            time_of_day: signals.context.isMorning ? "morning" : "day" // Simple mapping
        };

        const response = await axios.post(API_URL, payload);
        console.log("Backend Response:", response.data);
        return response.data;
    } catch (error) {
        console.error("API Call Failed:", error);
        // Fail-Open Pattern: Return a safe default if backend is dead
        return {
            user_segment: "offline_default",
            recommended_mode: "standard",
            message: "Backend unreachable, using local default"
        };
    }
};

