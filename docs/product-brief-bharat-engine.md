# Product Brief: Bharat Context-Adaptive Engine

## 1. Project Overview
**Project Name:** Bharat Context-Adaptive Engine
**Executive Summary:** A universal, privacy-first personalization infrastructure designed for the "Next Billion Users" (Bharat). It solves the "Cold Start" problem by leveraging implicit signals (Time, Device, Network, Location) to deliver a hyper-relevant experience from Day 0, evolving into a predictive "Digital Partner" over a 21-day journey.

## 2. Problem Statement
**"The Blind Spot of Modern Algorithms"**

Current recommendation engines (built by Silicon Valley/Bangalore tech) fail for the Tier 2/3 demographic because they rely on **Explicit Data** (Search history, Likes, Login profiles) that these users rarely provide.

*   **The "Cold Start" Failure:** When a user from a Tier 3 city installs an app, they see a generic, text-heavy, English-first interface. They feel "This is not for me" and churn immediately.
*   **The Context Gap:** Standard apps ignore the rich *implicit* signals (Time, Device Class, Network Speed, Location) that define the user's reality.
*   **The Result:** High churn, low engagement, and a massive digital divide.

## 3. The Vision
**"A Zero-Click Intelligence Layer for Bharat"**

We are building a **Generic Recommendation Infrastructure** that powers any app (Commerce, EdTech, Fintech, Media) to become "Hyper-Personalized" from the very first second, without requiring user input.

It acts as a **"Digital Munim" (Trusted Assistant)** that evolves from a "Guesser" to a "Partner" over 21 days.

## 4. The Implementation Phases (The Journey)

### Phase 1: The "Context Net" (Day 0 - Day 3)
*   **Goal:** Instant Relevance (Stop the Churn).
*   **Mechanism:** **Heuristic Inference.**
    *   *Input:* Time, IP Location, Device Model, Network Type.
    *   *Output:* A "Safe Mode" UI.
    *   *Example:* If `Time = 9 AM` + `Loc = Tier 3` + `Net = 4G`: Show **Morning News (Hindi Video)**. Hide heavy images.

### Phase 2: The "Interaction Loop" (Day 4 - Day 14)
*   **Goal:** Soft Profiling (Understand Intent).
*   **Mechanism:** **Micro-Interaction Tracking.**
    *   *Input:* Dwell time, Scroll speed, Volume change, Content Type affinity (Video vs Text).
    *   *Output:* **Format Adaptation.**
    *   *Example:* If user ignores text but watches video -> Switch entire feed to **Video-First**.

### Phase 3: The "Predictive Partner" (Day 15 - Day 21+)
*   **Goal:** Proactive Value (Habit Formation).
*   **Mechanism:** **Pattern Recognition & Predictive Nudges.**
    *   *Input:* Recurring behavior (e.g., Checking gold rates every Tuesday).
    *   *Output:* **Proactive Dashboard.**
    *   *Example:* **Tuesday 9 AM:** Push Notification "Gold rates are up! Check now." (Before they even open the app).

## 5. Success Metrics
*   **Day 0 Retention:** % of users who click *at least one* item in the first session.
*   **Time to First Value (TTFV):** Seconds between Install -> First relevant interaction.
*   **Signal Accuracy:** % of "Day 0 Guesses" (Language/Intent) that are confirmed by user behavior later.

## 6. Supporting Materials
*   **User Persona Focus:** "Bharat Vyapari" (MSME/SMB) & "Individual Power User".
*   **Core Technology:** Client-side Signal Collector (SDK) + Server-side Context Vector Store.
*   **Privacy Stance:** "Local-First" data processing where possible; anonymized signal transmission.

