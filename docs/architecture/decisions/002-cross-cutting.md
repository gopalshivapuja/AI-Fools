# Architecture Decision Record: Cross-Cutting Concerns

## Context
We are building a distributed system (SDK + App + Backend) that requires high performance (Day 0 speed) and type safety (Reliability).

## Decisions

### 1. API Contract & Type Safety
**Decision:** **OpenAPI-Driven Development**
*   **Pattern:** Backend (FastAPI) defines the "Truth" via Pydantic models.
*   **Mechanism:** We auto-generate `openapi.json` from FastAPI.
*   **Client:** We use `openapi-typescript-codegen` to generate the SDK's API client.
*   **Benefit:** Guaranteed type safety. If the Backend API changes, the SDK build fails immediately.

### 2. Local Persistence (SDK Memory)
**Decision:** **react-native-mmkv**
*   **Context:** The SDK must read the "User Profile" instantly on app launch to render the UI.
*   **Choice:** MMKV over AsyncStorage.
*   **Why:** MMKV is synchronous and ~30x faster. This directly supports **Metric 4 (Time-to-Value < 10s)**.

### 3. Analytics / Signal Buffer
**Decision:** **Local Buffer + Batch Upload**
*   **Context:** We capture implicit signals (Scroll, Dwell). Sending every event kills battery/data.
*   **Pattern:** SDK buffers events in MMKV. Uploads in batches every 60s or on `app_background`.
*   **Benefit:** Respects "Low Data" constraints.

## Status
Accepted.

