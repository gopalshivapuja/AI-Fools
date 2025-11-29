import { collectSignals } from './signals';
import { sendSignalsToBackend, EngineResponse, Persona, Suggestion, Journey } from './inference/api';
import { BharatSignals } from './signals/types';

// Re-export all types for consumers
export type { BharatSignals } from './signals/types';
export type { EngineResponse, Persona, Suggestion, Journey } from './inference/api';

/**
 * The main entry point for the Bharat Context-Adaptive Engine.
 * 
 * This function orchestrates the complete flow:
 * 1. Collects device signals (network, battery, device, context)
 * 2. Sends signals to the backend inference engine
 * 3. Returns personalized recommendations + LLM-generated content
 * 
 * @param journeyDay - Optional: Which day of the user's journey (0-30+)
 *                     Use this to simulate Day 30 experiences!
 * @returns Promise containing signals and inference results
 * 
 * @example
 * // Day 0 - New user
 * const { signals, inference } = await initBharatEngine(0);
 * 
 * @example
 * // Day 30 - Returning partner
 * const { signals, inference } = await initBharatEngine(30);
 */
export const initBharatEngine = async (
  journeyDay: number = 0
): Promise<{ signals: BharatSignals; inference: EngineResponse }> => {
  console.log(`Initializing Bharat Context-Adaptive Engine (Day ${journeyDay})...`);
  
  // 1. Collect Signals (Local) - This is instant and works offline
  const signals = await collectSignals();
  
  // 2. Send to Backend (Remote Inference with LLM) - This is where the magic happens
  const inference = await sendSignalsToBackend(signals, journeyDay);
  
  console.log(`Engine initialized. Mode: ${inference.recommended_mode}, Persona: ${inference.persona.name}`);
  
  return {
    signals,
    inference
  };
};

/**
 * Collect signals only (no backend call)
 * Useful for offline-first scenarios or when you want to inspect signals
 */
export { collectSignals } from './signals';

/**
 * Send signals to backend
 * Useful when you want to control when the API call happens
 */
export { sendSignalsToBackend } from './inference/api';
