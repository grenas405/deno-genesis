# 📜 DenoGenesis — CHANGELOG.md

Track the official version history and evolution of the **DenoGenesis Framework**.

---

## Versioning Notes

- DenoGenesis followed rapid informal iteration during early development.
- **v1.0.0** served as an initial public milestone.
- Starting with **v1.3.0**, DenoGenesis entered a **professional versioning track**:
    - Formal CHANGELOG tracking
    - Dedicated `VERSION` file
    - Semantic Versioning discipline (SemVer):
        - `MAJOR.MINOR.PATCH`

---

## 📚 Table of Contents

- [1.4.10 – 2025-06-25](#1410--2025-06-25)
- [1.4.9 – 2025-06-25](#149--2025-06-25)
- [1.4.8 – 2025-06-24](#148--2025-06-24)
- [1.4.7 – 2025-06-13](#147--2025-06-13)
- [1.4.6 – 2025-06-13](#146--2025-06-13)
- [1.4.4 – 2025-06-12](#144--2025-06-12)
- [1.4.3 – 2025-06-12](#143--2025-06-12)
- [1.4.2 – 2025-06-12](#142--2025-06-12)
- [1.4.1 – 2025-06-11](#141--2025-06-11)
- [1.4.0 – 2025-06-09](#140--2025-06-09)
- [1.3.0 – 2025-05-19](#130--2025-05-19)
- [1.0.0 – Initial Public Release](#v100--initial-public-release)

## [1.4.13] — 2025-06-26

### ✨ Added
- Introduced responsive `<pre>` terminal output container with horizontal scroll prevention.
- Implemented initial CSS media queries to improve display of ASCII art and boot animation on smaller screens.
- Integrated `<span class="ok">` styling into final motto for visual consistency.

### 🛠️ Updated
- Adjusted `boot-sequence.js` to prepare for loading bar animation and future expandability.
- Slightly improved spacing between frames and final terminal output for better readability.

### 🧰 Technical Note
This release lays foundational improvements for display consistency across screen sizes and establishes a more cinematic, Linux-inspired visual identity in the simulated boot sequence experience.

---

## [1.4.12] - 2025-06-26

### ✨ Added
- Introduced a Linux-style booting sequence to `boot-sequence.js`, enhancing startup immersion with realistic `[ OK ]` system logs.
- Personalized boot log includes:
  - Founder details (Pedro M. Dominguez)
  - Birthplace: Ciudad Juárez, Mexico 🇲🇽
  - Hometown: Praxedis G. Guerrero, Chihuahua
  - Mission statement and system architecture metadata.

### 💻 Improved
- Replaced generic boot messages with detailed initialization logs to simulate terminal output found in real Linux distributions.
- Final message includes motivational signature line:  
  `Puro Pa’ Delante 💪 — Todo sea por la familia 🙏`

### 🔧 Technical Notes
- Boot log typed dynamically using `typeLineByLine()`
- Canvas matrix rain continues to run concurrently for added visual depth


## [1.4.11] – 2025-06-25

### 🚀 Added

- **Notifications System (MVP)**
  - Implemented REST-based `notificationsController.ts`:
    - `POST /api/notifications/broadcast` — Admin broadcast message
    - `GET /api/notifications/history?limit=30` — Fetch recent messages
  - Created `notificationsRoutes.ts` and registered at `/api/notifications`
  - Added `notificationsService.ts` — Logic for creating + fetching
  - Built `notificationsModel.ts` — DB layer using `SITE_KEY`, typed interface
  - Introduced `env.ts` — exposes global `SITE_KEY` for all backend layers

### 🛠 Changed

- **Frontend Improvements**
  - `broadcast.html`:
    - Notification type dropdown
    - Styled form with focus ring, clean admin UX
    - Semantic WebSocket status indicator
  - `broadcast.js`:
    - Now sends `message` and `type` via JSON
    - Displays broadcast status with emoji and fallback support
    - Updated success + error handling logic with `showNotification()`

- **Database Schema**
  - Updated `notifications` table in `universal_db`:
    - `site_key VARCHAR(50) NOT NULL`
    - `type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info'`
    - `is_broadcast BOOLEAN DEFAULT TRUE`
    - `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

### 🐛 Fixed

- Resolved column mismatch bug on `insertNotification`
- Fixed SQL timestamp format error in `created_at`
- Status bar now confirms site-level broadcast context

---

📝 **Note:** Currently debugging `[object Object]` issue when parsing backend response in `broadcast.js`.  
Message is sent and saved correctly, but frontend notification bubble needs improved `.message` extraction logic. Patch upcoming.

✅ **Result:** DenoGenesis now supports REST-based notifications, real-time UX prep, and multi-tenant auditing for future dashboard insights.
## v1.0.0 — Initial Public Release

---

**NOTE:** v1.0.0 was an **informal milestone** — much of DenoGenesis' early architecture was exploratory and rapidly evolving.  
Starting from **v1.3.0**, the project is now on formal Semantic Versioning.

### 🎉 Initial release of DenoGenesis

#### Architecture
- Core REST API architecture (Oak + Deno + TypeScript)
- MVC structure → Controllers / Services separation
- NGINX Reverse Proxy setup → multi-app support
- Initial router structure → REST pattern

#### Features
- Admin Login + JWT Auth
- Appointments API
- Contact Messages API
- Dashboard API → Admin UX
- Initial `settings.html` → basic fields
- `chatController.ts` → AI-powered Chat (Gemini API)
- `middleware/verifyAdminToken.ts` → present

#### Frontend Architecture
- Static Assets served → `/public` directory
- `/public/assets/js` → Modular JS
- `/public/assets/css` → Initial styles
- `/public/pages/...` → Page structure in place

#### Real-time
- Early WebSocket Layer prototype

#### UX
- Professional Admin UX styling (v1)

#### Audience
- First public release for OKC agencies → architecture born

---

## v1.3.0 — 2025-05-19

**Summary:** Second public-ready architecture release.  
**v1.3.0 marks the beginning of formal version tracking for DenoGenesis.**

### ✨ Added

- WebSocket Layer:
  - `wsController.ts` + `/api/ws` route
  - Broadcast capability
  - Live WS connected clients tracking
- `/api/dashboard/overview` → Pro Admin Dashboard Payload
- Stripe Terminal link → Admin Dashboard

### 🛠 Changed

- Architecture now → **REST + WebSocket Hybrid**
- Removed redundant version info → `getDashboardOverview`

### 🐛 Fixed

- Improved main.ts system boot logs clarity
- Improved system health transparency → preparing `/api/system/info`

---

## v1.4.0 — 2025-06-09

**Summary:** Major Settings API expansion → first CMS-grade features → dynamic theming architecture begins.

### ✨ Added

- `theme.js` → dynamic theming support → CSS variables
- Expanded Settings API:
  - `footer_text`
  - `primary_color`, `secondary_color`
  - `about_us_text`
  - `facebook_url`, `instagram_url`, `twitter_url`
  - `tracking_code`
- `/api/settings` → full site configuration payload
- Admin `settings.html` upgraded:
  - Footer text, colors, about us, social links, tracking code
  - Modern Admin UX → professional-grade feel
- `CHANGELOG.md` → initial version history formalized

### 🛠 Changed

- Settings Controller → full CMS-grade settings
- Settings API → foundation for:
  - Dynamic site theming
  - Multi-tenant agency branding
  - Realtime live theming (future)

### 🐛 Fixed

- Default color fallback logic → `theme.js`
- `settings.html` JS → consistent form handling + payload structure

---

## v1.4.1 — 2025-06-11

**Summary:** Internal logging polish — prepared consistent color logging across DenoGenesis.

### 🛠 Changed

- `db.ts` → Replaced raw console log with official `std/fmt/colors` → consistent professional logging style.
- Aligned `db.ts` style with `main.ts` direction → preparing for future unified boot log experience.

### Notes

- No API change.
- No feature change.
- No DB change.
- PATCH update → internal polish only.

---

## v1.4.2 — 2025-06-12

**Summary:** Modernize WebSocket layer → prep for API usage → docs foundation created.

### ✨ Added

- Created `docs/` directory → formal documentation structure:
    - Moved `CHANGELOG.md`, `VERSION`, `README.md`, `rethinkx.md` → `/docs`
    - Future-proof → clean project root → foundation for versioned docs.

### 🛠 Changed

- Upgraded WebSocket Layer → modern best-practice:
    - Removed deprecated `std/ws/mod.ts` dependency
    - `websocketHandler.ts` → now fully Oak-native WebSocket API
    - `wsService.ts`:
        - `registerClient()` → auto-unregisters on close/error
        - `broadcast()` → now clean + sync
        - Added `getConnectedClientCount()` → future `/api/ws/connected-count` API

### Notes

- No API breaking change.
- WebSocket layer is now **production-grade foundation** → fully compatible with Oak 12.x → Deno 1.41+.
- `docs/` → DenoGenesis now tracks documentation evolution → future `versioned-docs` support.

### Versioning

- PATCH bump → internal layer improvement + project structure refinement → **v1.4.2**

---

## v1.4.3 — 2025-06-12

**Summary:** Documentation standards introduced → Notifications CSS polished → Frontend refactored to use modular components architecture.

### ✨ Added

- `/docs/Documentation-Standards.md` → **Documentation Standards**:
  - Guidelines for future contributors / agencies → how to write:
    - Documentation  
    - CHANGELOG.md entries  
    - TODO.md structure  
    - Professional commit discipline  
    - Architecture notes  
    - Contribution best practices  
    - Improved process transparency for future maintainers + agency clients

- Implemented professional **Notifications Component CSS**:
    - `/components/notifications.html` → clean component architecture
    - `notifications.css` → modern gradient styling → hover interaction → agency-grade UX polish
    - Elite visual experience → consistent with DenoGenesis goals → agency clients will notice this.

### 🛠 Changed

- `script.js` → Refactored to **import and call Notification component via `load-components.js`**:
    - `loadNotifications()` added → modular design respected
    - Now consistent with `loadFooter()`, `loadChatbot()`, `loadSearchWidget()`, `loadWebSocket()`
    - Result → front-end now fully adheres to component-based design
    - Future-proof for adding more UI components without breaking architecture

### 🐛 Fixed

- None — structural + UX update only.

---

### Notes

- DenoGenesis front-end component architecture is now **fully modular**:
    - Notifications → ✅ modular
    - Footer → ✅ modular
    - Chatbot → ✅ modular
    - Floating Search → ✅ modular
    - WebSocket → ✅ modular
- Script loading is now **clean and consistent** → 100% ready for future UI expansions.
- Front-end CSS is evolving toward a **design system** pattern → ready for agency / multi-tenant use.

---

## Current DenoGenesis Status:

✅ REST + WebSocket Hybrid Core  
✅ MVC discipline → Models extraction in progress  
✅ Modular front-end component architecture → UX polish accelerating  
✅ Docs standards introduced → project is becoming a mature framework  
✅ DenoGenesis continues to evolve into a **world-class sovereign-first web architecture**.

---

## v1.4.4 — 2025-06-12

**Summary:** Major UX milestone — WebSocket-based global notifications now active.  
Began systematic replacement of `console.log` with `showNotification()` across frontend modules → real-time feedback UX across all user experiences.

### ✨ Added

- Global WebSocket Notifications System:
  - WebSocket-based messages now displayed as elegant in-app notifications.
  - UX dramatically improved — first "production-ready" notification experience.
  - WS messages auto-display across desktop, mobile, tablet.
  - System now **real-time ready** — modern UX baseline set for DenoGenesis.

- `notifications.css` → improved visual styling for global notifications component → polished for client-facing apps.


### 🛠 Changed

- `script.js` updated:
  - Now fully uses `load-components.js` + loads global notifications component on every page.

- `manage-blogs.js` → All console messages replaced with notifications.
- `manage-projects.js` → All console messages replaced with notifications.
- `manage-roadmap.js` → All console messages replaced with notifications.
- `contactForm.js` → All console messages replaced with notifications.
- `contactSettings.js` → All console messages replaced with notifications.
- `login.js` → Now uses notifications and inline message.
- `search.js` → Now uses notifications to show search progress / results / errors.
- `navigation.js` → Now shows `✅ Navigation elements loaded successfully!` after setup.
- `payment.js` → All console messages replaced with notifications.

### Notes

- Current **focus in-progress**:
  - Systematic **console.log replacement → showNotification()**
  - Professional frontend polish — production-ready.
  - Preparing roadmap for `v1.5.0`.

- First UX baseline milestone for:
  - **Real-time UX** → WebSocket hybrid stack
  - **Consistent global notification experience**
  - **Unified visual UX** across all Admin + Public pages

---

✅ **Result:** DenoGenesis frontend is now entering its **production UX maturity phase**.  
Notifications UX is **decentralized** → no dev tools required → full feedback on mobile / tablet / touch screens.  
This is a key step toward **framework readiness for agencies and businesses**.

---

## v1.4.6 — 2025-06-13

**Summary:** Published first strategic EU Market Positioning document → positioning DenoGenesis as a sovereign-first, GDPR-aligned web framework for Europe.

### ✨ Added

- `/docs/EU-Positioning.md` → first formal positioning document for the European market
  - Explains DenoGenesis alignment with:
    - 🇪🇺 EU digital sovereignty priorities
    - GDPR & ePrivacy-first trends
    - Open Source-first public sector procurement mandates
    - Public Money → Public Code philosophy
  - Outlines ideal target markets:
    - Public Sector → municipalities, regions, gov agencies
    - NGOs & Nonprofits
    - Small Businesses & Artisan sectors
    - Civic Tech & Educational institutions
  - Strategic communication language prepared for EU audiences
  - First recommendations for outreach partners / organizations included

### 🛠 Notes

- No API change.
- No DB change.
- No code change → pure **docs version** → version bump justified due to **strategic market positioning milestone**.
- This prepares the ground for DenoGenesis' future **EU-facing strategy and outreach** → **competitive differentiator vs existing stacks**.

---

## v1.4.7 — 2025-06-13  

**Summary:** 🚀 Established core philosophical pillar → _Sovereign Defense Architecture_  
→ Documented in `/docs/Sovereign-Defense-Architecture.md`  
→ Aligns DenoGenesis roadmap with transparent, auditable, sovereign-first stack principles.  

### ✨ Added  

- **`/docs/Sovereign-Defense-Architecture.md`**  
  - Formalized DenoGenesis response to adversarial technologies (space-time manipulation, black-box AI, digital dystopias).  
  - Defines architecture principles for transparency, auditability, and human-first UX.  
  - Documents why REST + WS Hybrid + Global Notifications is a strategic countermeasure.  
  - Publicly declares DenoGenesis positioning in defense of human freedom.  

### 🛠 Changed  

- Philosophical foundation of project elevated:  
  - DenoGenesis is not just a productivity stack — it is now also a **sovereign digital defense stack**.  

### Notes  

- This marks the first **meta-architecture publication milestone** in DenoGenesis history.  
- Expect continued docs expansion → `/docs` → to align all components of DenoGenesis under this transparent philosophy.  

---

# 📦 Changelog

## [1.4.8] – 2025-06-24  
### 🚀 Added  
- **New Boot Terminal Animation**:  
  - Implemented terminal-style boot sequence with animated typing.
  - Integrated `Anime.js` for smooth per-character rendering.
  - Final signature message: `"Puro Pa Delante, Todo Sea Por La Familia 💪🙏👨‍👩‍👧‍👦"`.

- **Matrix Rain Background**:  
  - Added `matrixRain.js` module to render animated green glyphs.
  - Overlays entire boot modal with atmospheric visual effect.

- **Modal Boot UI**:  
  - Terminal interface displayed as fullscreen modal overlay.
  - Includes glowing terminal frame, scanlines, and locked scroll.

### ♻️ Changed  

- **UI Enhancements**:  
  - Improved animation timing and styling in `boot.css`.
  - Optimized fade-out with `.hide` class for smooth transitions.

### 🐛 Fixed  
- **Null Style Error**:  
  - Safeguards added for `#main-app` and `#boot-screen` checks.

---

✅ This release solidifies first-impression branding and enhances user experience with a cinematic system launch feel.

---

## [1.4.9] – 2025-06-25

### 🚀 Added
- **Canvas-Based Matrix Rain Integration**
  - Fully functional `<canvas>` overlay using `matrixRain.js`
  - True fullscreen digital rain effect behind terminal window
  - Katakana + ASCII glyph blend for authentic CMatrix aesthetic

- **Polished Terminal Boot Experience**
  - Boot terminal overlays Matrix rain dynamically
  - Emojis + line breaks supported in `finalMessage`
  - Perfect z-index layering and scroll-lock behavior

- **Updated `boot.html` Structure**
  - Canvas now embedded **inside** `#boot-screen` for layering precision
  - Removed legacy `#matrix` div — canvas-only now
  - Accessible ARIA tags + semantic structure finalized

### 🛠 Changed
- `boot-sequence.js` → improved timing of `startMatrixRain()` for early rendering
- `typingengine.js` → now exports `clearTerminal()` for use post-intro
- `boot-terminal` → remains layered **above canvas**, never obscured

### ✅ Result
- First **cinematic boot experience** complete for DenoGenesis
- Reinforces brand narrative with visual flair + professional UX

---

🔥 This marks the first fully immersive client-facing boot screen in DenoGenesis history. The stack is now **aesthetically elevated** — ready for public demos, investor meetings, and product launches.

---

## [1.4.10] – 2025-06-25

### 🛠 Enhancements
- Replaced all `console.log` and `alert` calls with the unified `showNotification()` system across:
  - `public-appointments.js`
  - `roadmap.js`
  - `login.js`
  - `terminal-payment-form.js`
- Ensured consistent visual feedback for success, error, and warning states in all user-facing scripts.
- Improved terminal payment form UX by dynamically updating `status-message` and intent `details` with contextual notifications.

### ✅ Benefits
- More polished and professional user experience for clients.
- Unified notification layer allows faster debugging and better user communication.
- Streamlined Stripe Terminal interactions with clearer intent lifecycle feedback.

### 🔐 Security / UX
- Reduced dependency on native `alert()` dialogs for sensitive flows.
- Enhanced accessibility and status visibility via semantic feedback.

---

## 🚧 Upcoming v1.5.0

### Planned Features

#### Core Refactors / Cleanups
- Rename `adminController.ts` → `authController.ts`
- Update routes → `/api/auth/login`
- Refactor `authController` → remove `adminLogin` naming
- Import and use `notifications.js` globally → replace console.logs → `showNotification`
- Rebuild all CSS component files → use variables from `main.css`
- Standardize all `routes/*.ts` files → thin declarative routers

#### Controller Cleanup / Expansion
- Implement `notificationsController.ts` → WS Broadcast + History API
- Implement `systemController.ts` → System Info (version, uptime, WS connected clients)
- Implement `adminUsersController.ts` → Admin Users CRUD
- Implement `tokensController.ts` → Token listing + revocation
- Implement `accessLogsController.ts` → Login / Action logs
- Implement `exportController.ts` → Export Appointments + User Messages (CSV, JSON)

#### Services
- Extract DB logic → `/models` layer
- Create `services/systemService.ts` → System metrics
- Create `services/notificationsService.ts` → WS Broadcast abstraction + history

#### Admin Dashboard UX
- Update `/api/dashboard/overview` → Pro Admin Dashboard Payload
- Add UI components:
    - Live Connected Users panel (WS count)
    - Broadcast Notifications UI
    - Access Logs viewer
    - Data Export buttons (Appointments, Messages)
    - Color Picker → Primary / Secondary Colors

#### Settings UX Upgrades
- Implement Color Picker → `settings.html`
- Store `primary_color`, `secondary_color` → `site_settings` table
- Apply live theming → `theme.js`

#### WebSocket Layer
- `/api/ws/connected-count` route → live connected clients
- WS "Rooms" support → (Home, Dashboard, Agencies, etc.)
- `/api/ws/broadcast` POST route → clean admin API

#### Router Cleanup
- Standardize all routers:
    - Remove redundant Context passing
    - Consistent chaining style → `.get() .post() .put() .delete()`
    - Middleware first → Controllers second
    - REST endpoint patterns → consistent
    - Route comments → ✅ Public / 🔒 Protected / 🔄 WebSocket

#### Database Schema Updates
- Update `site_settings`:
    - Add `primary_color`, `secondary_color`
    - Add `facebook_url`, `instagram_url`, `about_us`, `tracking_code`
    - Test flow: DB → API → UI → Theme → Live site

#### Project Structure
- Implement `/models` directory
- Implement `/middleware` directory → JWT → WS middleware
- Implement `/logs` directory
- Implement `/exports` directory

#### Misc / Professional Polish
- `/api/system/info` route → transparency
- `/about-denogenesis.html` → Admin About
- `/system-updates.html` → System changelog page
- `VERSION` file → remove version from `main.ts` → load dynamically

---

## 🛠️ Philosophy

DenoGenesis is built for:

✅ Open architectures  
✅ Sovereign-first deployment  
✅ REST + WebSocket hybrid UX  
✅ MVC discipline  
✅ Transparency → System Info / Logs  
✅ Real-time → Notifications / Live UX  
✅ Data ownership → Export APIs  
✅ Beautiful agency-first Admin tools  
✅ Simplicity → Small VPS → No Cloud lock-in  

---

**DenoGenesis is a counter-force to centralization — and a foundation for sovereign, transparent, elegant web systems.**  

_Developed with care and precision by Pedro M. Dominguez._

---