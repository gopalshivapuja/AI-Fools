# Architecture Decision Record: Project Structure

## Context
We are building the "Bharat Context-Adaptive Engine".
The business goal is to sell an **SDK** to partners (Sri Mandir, Khatabook), not just build our own app.
However, we need a "Wrapper App" (Bharat GPT) to prove the value first (GTM Phase 1).

## Decision
**We will adopt an "SDK-First" Monorepo Structure.**

### Structure
```text
/
  - sdk/              # The Core Product (Pure TS/JS Library)
      - src/
        - signals/    # Signal collection logic
        - inference/  # Local inference rules
      - package.json  # Published as @bharat-engine/sdk

  - backend/          # The Server-Side Brain (FastAPI)
      - app/
        - api/        # Endpoints
        - core/       # Logic

  - example-app/      # The "Wrapper" (React Native Expo)
      - App.tsx       # Imports @bharat-engine/sdk
```

### Rationale
1.  **Separation of Concerns:** Forces us to keep the "Engine" logic clean and separate from the UI.
2.  **GTM Alignment:** When Partner X asks "Can I integrate?", we hand them the `sdk/` folder, not the whole app.
3.  **Dogfooding:** The `example-app` acts as the first "Partner", proving the SDK works.

## Status
Accepted.

