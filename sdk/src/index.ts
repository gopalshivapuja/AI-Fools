import { collectSignals } from './signals';
import { sendSignalsToBackend } from './inference/api';
import { BharatSignals } from './signals/types';

export type { BharatSignals };

export interface EngineResponse {
    user_segment: string;
    recommended_mode: string;
    message: string;
}

export const initBharatEngine = async (): Promise<{ signals: BharatSignals; inference: EngineResponse }> => {
  console.log("Initializing Bharat Context-Adaptive Engine...");
  
  // 1. Collect Signals (Local)
  const signals = await collectSignals();
  
  // 2. Send to Backend (Remote Inference)
  const inference = await sendSignalsToBackend(signals);
  
  return {
      signals,
      inference
  };
};
