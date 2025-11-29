# PRD: Bharat Context-Adaptive Engine

## 1. Project Overview
**Project Name:** Bharat Context-Adaptive Engine
**Executive Summary:** A universal, privacy-first personalization infrastructure designed for the "Next Billion Users" (Bharat). It solves the "Cold Start" problem by leveraging implicit signals (Time, Device, Network, Location) to deliver a hyper-relevant experience from Day 0, evolving into a predictive "Digital Partner" over a 21-day journey.

## 2. Problem Statement
**"The Blind Spot of Modern Algorithms"**

Current recommendation engines (built by Silicon Valley/Bangalore tech) fail for the Tier 2/3 demographic because they rely on **Explicit Data** (Search history, Likes, Login profiles) that these users rarely provide.

*   **The "Cold Start" Failure:** When a user from a Tier 3 city installs an app, they see a generic, text-heavy, English-first interface. They feel "This is not for me" and churn immediately.
*   **The Context Gap:** Standard apps ignore the rich *implicit* signals (Time, Device Class, Network Speed, Location) that define the user's reality.
*   **The Result:** High churn, low engagement, and a massive digital divide.

## 3. Vision & Value
**"A Zero-Click Intelligence Layer for Bharat"**

We are building a **Generic Recommendation Infrastructure** that powers any app (Commerce, EdTech, Fintech, Media) to become "Hyper-Personalized" from the very first second, without requiring user input.

It acts as a **"Digital Munim" (Trusted Assistant)** that evolves from a "Guesser" to a "Partner" over 21 days.

## 4. Success Definitions

**Success Criteria:**
*   **Day 0 Retention:** 40% of users click *at least one* item in the first session.
*   **Time to First Value (TTFV):** < 5 seconds between Install -> First relevant interaction.
*   **Signal Accuracy:** > 70% of "Day 0 Guesses" (Language/Intent) are confirmed by user behavior later.
*   **Adoption:** Integrated into 1 pilot app (Commerce or Fintech) with A/B test validation.

## 5. Scope (MVP & Beyond)

**MVP Scope (The "Context Net"):**
*   **Platform:** React Native SDK + Python/Node Backend.
*   **Signals:** Time, IP Location (City/Tier), Device Model, Network Connection Type.
*   **Inference Engine:** Rule-based heuristics (e.g., "Tier 3 + Morning = News").
*   **UI Adaptation:** 2 Modes (Standard vs. Lite/Low-Data).
*   **Language Support:** English + Hindi (System detected).

**Growth Features (Post-MVP):**
*   **Behavioral Tracking:** Scroll depth, dwell time, volume interaction.
*   **Vector Database:** User taste profiles stored as embeddings.
*   **Predictive Nudges:** Push notifications based on habit loops.
*   **Voice Support:** Voice-first search and command interface.

**Future Vision:**
*   **Federated Learning:** Personalization models train on-device (100% privacy).
*   **Cross-App Intelligence:** Shared "Bharat ID" profile across ecosystem apps.

## 6. Functional Requirements (Capabilities)

**Signal Collection (Client-Side SDK):**
*   FR1: System can detect user's coarse location (City/State) via IP address.
*   FR2: System can identify device class (High-end vs. Budget/Low-RAM).
*   FR3: System can monitor real-time network status (WiFi vs. 4G/3G/2G).
*   FR4: System can read local time and derived context (Morning/Evening, Weekend/Weekday).
*   FR5: System can detect system language settings (Locale).

**Inference & Personalization (Server-Side):**
*   FR6: System can map raw signals to a "User Segment" (e.g., "Tier 2 Student").
*   FR7: System can filter content based on "Low Data Mode" constraints (No video on 2G).
*   FR8: System can rank content based on "Local Relevance" (Boost items from user's city).
*   FR9: System can adapt UI layout density based on device screen size/resolution.

**User Interaction & Feedback:**
*   FR10: System can track "Item Click" events anonymously.
*   FR11: System can track "Dwell Time" on content cards.
*   FR12: Users can manually override inferred preferences (e.g., Switch Language).

**Privacy & Trust:**
*   FR13: All signal data is anonymized before transmission.
*   FR14: User can reset their "Interest Profile" at any time.

## 7. User Stories (The "Hero" Flows)

**Story 1: The "Day 0" Activation (Metric 1: Activation)**
*   **As a** New user (e.g., Saree Shop Owner),
*   **I want** the app to instantly show me a "Status Maker" for my business type (without login),
*   **So that** I get immediate value (create a poster) in < 10 seconds.
*   *Acceptance Criteria:*
    *   App detects "Commercial Zone" (Location) -> Shows "Business Tools".
    *   First screen is **NOT** "Sign Up", but "Create Your First Offer".
    *   Clicking "Create" counts towards **Metric 1 (Activation)**.

**Story 2: The "Habit" Nudge (Metric 2: Retention)**
*   **As a** User who created a poster yesterday,
*   **I want** a notification at 9 AM asking "New Stock today? Create another status.",
*   **So that** I remember to use the app daily.
*   *Acceptance Criteria:*
    *   System tracks "Last Action Time".
    *   Nudge sent at optimal time (Opening Hours).
    *   Returning user counts towards **Metric 2 (Retention)**.

**Story 3: The "Value" Renewal (Metric 5: Monetization)**
*   **As a** Power User on the free tier,
*   **I want** the app to show me "How much time I saved" this month using the AI tools,
*   **So that** I am motivated to renew my subscription when the alert pops up.
*   *Acceptance Criteria:*
    *   Dashboard shows "Value Report" (e.g., "You saved 5 hours").
    *   "Renew Subscription" button is placed next to this value report.
    *   Clicking "Renew" counts towards **Metric 5 (Renewal Signal)**.

**Story 4: The "Signal Capture" (Enabler)**
*   **As a** System,
*   **I want** to capture implicit signals (Network, Device, Time) silently,
*   **So that** I can power Stories 1, 2, and 3 without asking the user questions.
*   *Acceptance Criteria:*
    *   Capture happens in background on launch.
    *   Profile created before UI renders.

## 9. Non-Functional Requirements

**Performance:**
*   **Latency:** "Day 0" recommendations must load in < 200ms.
*   **SDK Size:** Client SDK must be < 50KB to ensure adoption in lightweight apps.

**Scalability:**
*   System must handle 10,000 concurrent requests (pilot scale) with < 1% error rate.

**Privacy & Security:**
*   No PII (Personally Identifiable Information) stored without explicit consent.
*   Compliance with India's DPDP (Digital Personal Data Protection) Act principles.

## 10. Project Type Specifics (Mobile App / API Backend)

**API Specifications:**
*   **Endpoint:** `POST /v1/init` (Sends signals, returns UI config + Content list).
*   **Format:** JSON.
*   **Auth:** API Key (for App Developers), Anonymous Session ID (for End Users).

**Platform Requirements:**
*   **Frontend:** React Native (Expo) compatible.
*   **Backend:** Python (FastAPI) or Node.js.
*   ## 13. Implementation Examples (Powered by Bharat Engine)

**Example 1: "ChatGPT" (OpenAI - Productivity)**
*   **Context:** A Tier 2 student installs ChatGPT but stares at the blank screen.
*   **Engine Role (Day 0):**
    *   *Detects:* "Student Device" + "Exam Season (May)" + "Hindi Locale".
    *   *Action:* Replaces blank prompt with 3 buttons: "Explain Newton's Law in Hindi", "Write Leave Application", "Math Homework Helper".
*   **Success Metric:**
    *   **Activation:** % of users who tap a suggestion vs typing "Hi".
    *   **Renewal:** Increase in Plus subscriptions due to "High Value" academic use.

**Example 2: "Sri Mandir" (Devotional/Spiritual)**
*   **Context:** A rural user installs the app for morning prayers.
*   **Engine Role (Day 0):**
    *   *Detects:* "Morning (6 AM)" + "Location: Varanasi" + "4G Network".
    *   *Action:* Auto-plays "Kashi Vishwanath Aarti" (Audio only) instead of showing a text menu.
*   **Success Metric:**
    *   **Daily Active Users (DAU):** Retention of morning prayer habit.
    *   **Donation Rate:** % of users making offerings (Chadhava) due to relevant deity content.

**Example 3: "Khatabook" (Fintech/SMB)**
*   **Context:** A Kirana store owner manages credit.
*   **Engine Role (Day 0):**
    *   *Detects:* "Commercial Zone" + "Evening (8 PM)".
    *   *Action:* Shows "Udhaar Collection List" at the top (Time to close books).
*   **Success Metric:**
    *   **Transaction Volume:** Value of credit recovered via app reminders.
    *   **Engagement:** Frequency of ledger updates per day.

## 16. Competitive Landscape (Why Us?)

**1. Sarvam AI (The "Language" Player)**
*   *Their Focus:* Building Hindi/Regional LLMs.
*   *The Gap:* They solve "Understanding Hindi", but not "Knowing it's 6 AM in Varanasi".
*   *Our Edge:* We provide the **Context** that makes their Language Model useful.

**2. Glance (The "Lock Screen" Player)**
*   *Their Focus:* Zero-click content on Lock Screens.
*   *The Gap:* They are a Walled Garden (only on specific phones). They don't help *other* apps.
*   *Our Edge:* We are an **Infrastructure SDK** that powers *any* app (Fintech, Edtech, Commerce).

**3. Segment/Amplitude (The "Analytics" Players)**
*   *Their Focus:* Reporting user behavior *after* the fact.
*   *The Gap:* They are reactive dashboards. They don't change the UI in real-time on Day 0.
*   *Our Edge:* We are **Proactive Execution**. We change the interface *before* the user clicks.

**4. HyperVerge (The "Identity" Player)**
*   *Their Focus:* KYC and Identity Verification.
*   *The Gap:* They answer "Who are you?". They don't answer "What do you want right now?".
*   *Our Edge:* We solve for **Intent**, not just Identity.

## 17. Risk Analysis (Red Team Report)

**Risk 1: "The Creepy Factor" (Privacy Backlash)**
*   *Failure Mode:* Users feel spied on ("How did it know I'm in Varanasi?").
*   *Mitigation:* "Transparent UI" -> Show a small icon "📍 Personalized by Location" so they know *why* they see it.

**Risk 2: "The Wrong Guess" (Trust Erosion)**
*   *Failure Mode:* We guess "Student" but the user is a "Shop Owner" (using son's phone).
*   *Mitigation:* "One-Tap Correction" -> Every recommendation has a "Not for me" button that instantly retrains the profile.

**Risk 3: "The Data Silo" (Integration Friction)**
*   *Failure Mode:* Partners (Sri Mandir) refuse to share data with our Engine.
*   *Mitigation:* "Local Execution" -> The Engine runs *inside* their app (SDK), so data never leaves their user's device.

**Risk 4: "The Battery Drain" (Performance)**
*   *Failure Mode:* Background signal collection kills battery on cheap phones.
*   *Mitigation:* "Passive Only" -> We only read system states (NetInfo) when the app is *already* open. No background polling.

**Risk 5: "The Big Tech Crush" (Competition)**
*   *Failure Mode:* Android OS adds this natively.
*   *Mitigation:* "Hyper-Verticalization" -> Android knows location; We know "Aarti schedules". Depth beats breadth.

**Metric 1: The "Cold Start" Win (Activation)**
*   **Goal:** **40% Day 0 Activation Rate.**
*   **Definition:** % of new users who interact with at least 1 personalized item within their *first session*.
*   **Why:** Proves we guessed their intent correctly without asking questions.

**Metric 2: The "Sticky" Factor (Retention)**
*   **Goal:** **20% Day 7 Retention.**
*   **Definition:** % of users who return to the app on Day 7.
*   **Why:** Higher than industry average (10-15%) proves the "Proactive Nudge" is working.

**Metric 3: The "Language" Trust (Accuracy)**
*   **Goal:** **< 10% Language Manual Overrides.**
*   **Definition:** % of users who *manually change* the language after we auto-detected it.
*   **Why:** Low override rate = High trust in our inference.

**Metric 4: The "Value" Speed (Efficiency)**
*   **Goal:** **Time-to-Value < 10 Seconds.**
*   **Definition:** Average time from App Launch -> First "Meaningful Click" (Content/Tool).
*   **Why:** Tier 2/3 users have low patience for complex navigation. We must be instant.

**Metric 5: The "Renewal" Signal (Monetization Health)**
*   **Goal:** **15% Renewal Rate via App.**
*   **Definition:** % of users who renew their AI subscription (ChatGPT/Gemini/Perplexity) through our "Proactive Nudge".
*   **Why:** If they renew *through us*, we are their primary interface for AI value.
*   **Measurement:** Track `subscription_renew_click` event.

## 12. Go-To-Market (GTM) Strategy

**Target Audience:**
1.  **The "Platform Builders" (B2B):** Existing apps (Khatabook, Sri Mandir, PhysicsWallah) struggling with Tier 2/3 retention.
    *   *Pitch:* "Plug our SDK in to increase Day 0 Activation by 40%."
2.  **The "AI Aggregators" (B2C):** New users trying AI for the first time via our "Wrapper" app.

**Rollout Phases & Milestones:**

**Phase 1: The "Wrapper" Proof (Month 1-2)**
*   *Strategy:* Launch a lightweight **"Bharat GPT"** app (wrapping OpenAI API).
*   *Action:* Use our Engine to personalize the prompt suggestions (e.g., "Write Shop Receipt" vs "Math Helper").
*   *Goal:* Prove **Day 0 Activation** metrics in a controlled environment.

**Phase 2: The "Devotional" Partnership (Month 3-4)**
*   *Target:* **Sri Mandir / Astrotalk**.
*   *Strategy:* **SDK Integration Pilot**.
*   *Pitch:* "Let us handle your Day 0 feed. We will auto-play the right Aarti based on Location/Time."
*   *Goal:* Validate **Retention Uplift** in a partner app.

**Phase 3: The "Enterprise" Scale (Month 5+)**
*   *Target:* **OpenAI / Perplexity / Fintechs**.
*   *Strategy:* **"The Context Layer"**.
*   *Pitch:* "You have the Model. We have the Context. Together we solve the Cold Start."
*   *Goal:* Licensing deal or Enterprise API usage.

**Metric for GTM Success:**
*   **SDK Integration Time:** < 2 Days for a partner to integrate.
*   **Partner Uplift:** Validated > 15% increase in Partner's Core Metric (Activation/Retention).

