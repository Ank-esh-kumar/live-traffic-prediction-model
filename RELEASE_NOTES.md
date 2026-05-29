# Release Notes — Smart Traffic Real-time System

---

## v1.4.0 — Mobile UX Refinements & Map Immersion
*Released: 2026-05-29*

### 📱 Premium Mobile Experience
- **Full-Screen Profile Portal:** The mobile Profile Menu has been completely rewritten using a React Portal. It now renders as a native-feeling, full-screen blurred modal overlay attached directly to the document root, guaranteeing it always floats flawlessly above all navigation bars and map elements.
- **Intelligent Tab Overlays:** Data tabs (Analytics, Alerts, History) now employ smart containment logic on mobile, perfectly centering within the viewport without horizontal overflow or desktop offset bleed.
- **Auto-Hiding Navigation:** The top header navigation pill now dynamically slides out of view when entering data panels to maximize vertical reading space, while the bottom tab-bar remains pinned for quick escape.

### 🗺️ Uninterrupted Map Canvas
- **Edge-to-Edge Immersion:** Purged default map zoom controls and redundant floating action buttons (like "Open Maps") to deliver a cleaner, uninterrupted edge-to-edge canvas.
- **Iconified Interactive Legend:** The Map Legend toggle has been streamlined into a minimalist circular action button.
- **Unified AI Metrics:** The real-time AI Precision metric (previously consuming valuable space in the bottom navbar) has been beautifully integrated directly into the top of the expandable Map Legend.

---

## v1.3.0 — Identity Security & Ambient Weather UI
*Released: 2026-05-26*

### 🔐 Change Password (2-Step Identity Verification)
- **Step 1 — Confirm Identity:** User must enter their current password; it is validated against the backend via a dedicated read-only `/api/auth/verify-password` endpoint before any change is allowed.
- **Step 2 — Set New Password:** Only revealed after verification succeeds. Features:
  - Live **password strength bar** (Too Short → Weak → Fair → Good → Strong)
  - Real-time **requirements checklist** (min 6 chars, number, uppercase, match)
  - **Confirm field** with instant mismatch detection
  - Guard: new password must differ from the current one
  - Animated **success screen** on completion
- Accessible via **Profile Menu → Change Password** (🔑 icon).

### 🌦️ Full-Screen Weather Background Animation
- When in **Explore Area** mode, a live weather animation fills the entire app background based on real-time Open-Meteo data:
  - ☀️ **Clear** — warm golden radial glow, gentle pulse
  - ☁️ **Cloudy** — soft silver gradient drifting across the screen
  - 🌧️ **Rain** — animated diagonal rain streaks
  - ❄️ **Snow** — falling dot pattern
  - ⛈️ **Thunderstorm** — dark overlay with periodic lightning flash
- Animation fades out (1.2s transition) when switching back to Route mode.
- Implemented via CSS `::before` pseudo-element with `pointer-events: none` — zero impact on UI interactivity.

---

## v1.2.0 — Infrastructure Expansion & Premium Routing

## 🚀 Overview
This release focuses on **Infrastructure Expansion**, **High-Precision Routing**, and **Premium UX Enhancements**. We have significantly expanded the geographic coverage and added critical infrastructure nodes to support life-saving emergency services.

---

## ✨ Key Features

### 1. 🏥 Critical Infrastructure Expansion
- **New Regional Nodes:** Integrated 18+ new high-precision nodes across Dehradun, Delhi, and Meerut.
- **Service Hubs:** Added dedicated markers and routing support for:
  - **Hospitals:** Doon Hospital, Max Super Speciality, Synergy Hospital, AIIMS Rishikesh, AIIMS New Delhi, Safdarjung Hospital, Apollo Hospital.
  - **Security:** Kotwali Dehradun, Prem Nagar Police Station, Rajpur Police Station, Parliament Street Police Station, Hauz Khas Police Station.
  - **Emergency:** Fire Station Dehradun, Safdarjung Fire Station.
- **Regional Hubs:** Added Mussoorie, Chakrata, and Selaqui to the Smart Traffic mesh.

### 2. 🛡️ Advanced Emergency Service (AES)
- **Strict Validation:** Implemented a security layer that ensures "Emergency Priority" can only be activated if the origin or destination is a verified Hospital or Police Station.
- **Priority Routing:** Emergency vehicles now receive a clear-path calculation that halts cross-traffic in the simulation mesh.
- **Temporary Auth:** Added a secure 48-hour temporary access system for civilians in critical situations.

### 3. 🤖 AI-Driven Routing & Exploration
- **Diverse Alternatives:** Transitioned to Yen's K-Shortest Paths algorithm, providing 3 distinct, loop-free route options (AI Predicted, Shortest, and Alternate).
- **High-Fidelity Paths:** Map visualization now shows the **full road-node sequence**, providing 100% precision for every turn in the route.
- **Regional Filters:** Added a city-based exploration system that dynamically refreshes the live density graph based on the selected area.

### 4. 💎 Premium UI/UX Refinement
- **New Metrics:** Introduced human-centric metrics:
  - **Eco-Score:** Real-time fuel efficiency rating based on traffic idling.
  - **Sustainability %:** Comparison of carbon impact against standard routes.
  - **Safety Index:** A-graded safety rating based on intersection density and incident history.
- **Visual Polish:** Added path previews in the route cards showing intermediate "via" locations.
- **Weather Integration:** Live weather reporting within the exploration panel to correlate traffic patterns with precipitation/temp.

---

## 🔧 Technical Improvements
- **MongoDB Caching:** Implemented a caching layer for OSRM distance requests, reducing backend startup time from 15s to <1s.
- **Mobile Responsiveness:** Optimized all panels and route cards for small screens (down to 320px) with responsive padding and smart text truncation.
- **Performance:** Achieved 60fps map rendering by optimizing marker clustering and polyline drawing logic.

---

## 🐞 Bug Fixes
- Fixed "spilling" issues on mobile browsers where route cards exceeded container width.
- Resolved coordinate synchronization between the backend graph and frontend MapView.
- Corrected route labeling where alternate routes were incorrectly tagged as "Shortest".
- Fixed the "Indiagate to Connaught Place" emergency bypass bug.

---

**Smart Traffic Systems v1.2.0**  
*Built for safety. Driven by AI.*
