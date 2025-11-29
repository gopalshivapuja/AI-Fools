# Architecture: Bharat Context-Adaptive Engine

## 1. Executive Summary
The Bharat Context-Adaptive Engine is a **Zero-Click Personalization Infrastructure** designed to reduce churn in Tier 2/3 markets.
It is architected as a **Client-Side SDK** (for low-latency context detection) backed by a **Python Inference Backend**.
The system prioritizes **Latency (<200ms)** and **Data Efficiency** (Passive Collection) to serve the "Next Billion Users".

## 2. Project Initialization
The project uses a **Monorepo** structure to manage the SDK, Example App, and Backend.

**First Implementation Story:**
```bash
# Initialize the SDK-First Monorepo
mkdir -p sdk/src/{signals,inference,storage}
mkdir -p backend/app/api/v1
npx create-expo-app example-app -t expo-template-blank-typescript
touch docker-compose.yaml
```

## 3. Key Decisions Summary

| Category | Decision | Version | Rationale |
| :--- | :--- | :--- | :--- |
| **Structure** | **SDK-First Monorepo** | N/A | Ensures the SDK is a standalone product from Day 1. |
| **Frontend** | **React Native (Expo)** | SDK 50+ | Cross-platform, easy for partners to integrate. |
| **Backend** | **FastAPI (Python)** | 0.109+ | High performance, native Async support, ML-ready. |
| **Persistence** | **MMKV** | 2.11+ | 30x faster than AsyncStorage; critical for Day 0 speed. |
| **API Sync** | **OpenAPI Generator** | v7+ | Guarantees type safety between Python Backend and TS SDK. |

## 4. Project Structure

```text
/
├── docker-compose.yaml       # Orchestration
├── sdk/                      # THE PRODUCT
│   ├── package.json
│   ├── src/
│   │   ├── index.ts          # Public API
│   │   ├── signals/          # Collectors (NetInfo, Device)
│   │   ├── storage/          # MMKV Wrapper
│   │   └── api/              # Generated Client
├── example-app/              # THE PROOF
│   ├── App.tsx
│   └── app.json
└── backend/                  # THE BRAIN
    ├── requirements.txt
    ├── main.py
    └── app/
        ├── models/           # Pydantic Schemas
        └── api/              # Endpoints
```

## 5. Implementation Patterns (Consistency Rules)

**Pattern 1: The "Passive" Signal Loop**
*   **Rule:** The SDK MUST NOT poll for location/network in the background unless explicitly configured.
*   **Implementation:** Only read signals on `AppState.change` (Active) or `Component.mount`.

**Pattern 2: The "Fail-Open" Inference**
*   **Rule:** If the Backend API fails or times out (>500ms), the SDK MUST return a "Default Safe Profile".
*   **Implementation:** `try { await api.inference() } catch { return DEFAULT_PROFILE }`. The app must never crash due to our SDK.

**Pattern 3: The "Type Truth"**
*   **Rule:** Never write TypeScript interfaces for API responses manually.
*   **Implementation:** Always run `npm run generate-client` after changing the Backend Pydantic models.

## 6. Data Architecture

**User Profile (Client-Side)**
```json
{
  "implicit": {
    "device_class": "low_end",
    "network_type": "2g",
    "city": "varanasi"
  },
  "inferred": {
    "segment": "student",
    "intent": "exam_prep"
  }
}
```

## 7. Security & Privacy
*   **Anonymization:** Device ID is hashed before sending.
*   **Data Residency:** Inference happens locally where possible; Server only sees anonymized signals.

## 8. Deployment
*   **Backend:** Dockerized container (Cloud Run / AWS ECS).
*   **SDK:** Published to NPM (Private/Public).
*   **App:** EAS Build (Expo Application Services).

