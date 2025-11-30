# Bharat Context-Adaptive Engine (AI-Fools)

> **"A Zero-Click Intelligence Layer for Bharat"**

The **Bharat Context-Adaptive Engine** is a privacy-first personalization infrastructure designed for the "Next Billion Users". It solves the "Cold Start" problem by leveraging implicit signals (Time, Device, Network) to deliver a hyper-relevant experience from Day 0, without requiring user login or search history.

## 🏗 Architecture

The project is structured as a Monorepo:

*   **`/sdk`**: The TypeScript/React Native Client SDK. It lives inside the mobile app and collects signals like Network Type, Device RAM, and Time of Day.
*   **`/backend`**: The Python (FastAPI) Inference Engine. It acts as the "Brain" (Munim Ji), receiving signals and returning a User Segment (e.g., "Lite Mode User").
*   **`/example-app`**: A React Native (Expo) reference app that demonstrates how to integrate the SDK.

## 🚀 Getting Started

### Prerequisites

*   **Docker** (for running the backend)
*   **Node.js** & **npm** (for the SDK and App)
*   **Expo Go** app on your phone (optional, for testing on real device)

### 1. Start the Backend (The Brain)

The backend runs in a Docker container.

```bash
# From the root directory
docker-compose up --build
```

The API will be available at `http://localhost:8000`.
Health Check: [http://localhost:8000/](http://localhost:8000/)

### 2. Build the SDK (The Fabric)

The SDK needs to be built before the example app can use it.

```bash
cd sdk
npm install
npm run build
```

### 3. Run the Example App (The Mannequin)

Now you can run the mobile app to see the engine in action.

```bash
cd example-app
npm install

# To run on Android Emulator
npm run android

# To run on iOS Simulator (Mac only)
npm run ios
```

## 🧠 How it Works

1.  **Signal Collection**: When the app opens, the SDK silently checks:
    *   Is it Morning? (Time)
    *   Is the user on WiFi or 4G? (Network)
    *   Is this a budget phone (<4GB RAM)? (Device)
2.  **Inference**: It sends these signals to the Backend (`/v1/init`).
3.  **Adaptation**: The Backend returns a `user_segment` (e.g., `lite_mode_user`).
4.  **Fail-Open**: If the backend is unreachable (bad internet), the SDK returns a safe default so the app never crashes.

## 🤝 Contributing

We welcome contributions! Please read `docs/PRD.md` and `docs/architecture.md` to understand the vision.

## 📜 License

MIT License.

