# 🦸 CivicPulse - AI Community Hero

> **Hyperlocal Problem Solver** - citizens report community issues with a single photo, while a team of **Google Gemini AI agents** categorizes, risk-scores, de-duplicates, and routes every report to the appropriate municipal department with transparent tracking, predictive insights, and gamified community engagement.

Built for the **Vibe2Ship Hackathon - "Community Hero"** problem statement.

![status](https://img.shields.io/badge/status-prototype-brightgreen)
![stack](https://img.shields.io/badge/Next.js-15-black)
![ai](https://img.shields.io/badge/Google-Gemini-4285F4)

---

# ✨ Why CivicPulse stands out

Designed to map directly to the Vibe2Ship evaluation criteria.

| Criterion                              | How CivicPulse Delivers                                                                                                                                                                                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Problem Solving & Impact (20%)**     | Complete citizen-to-resolution workflow: identify → report → verify → track → resolve. Automatically drafts complaint letters, assigns SLA targets, and merges duplicate reports to reduce municipal workload.                                      |
| **Agentic Depth (20%)**                | A **6-agent AI report pipeline** with a transparent reasoning console, complemented by a Municipal Co-pilot, Resolution Verification Agent, Hero Assistant, and Predictive Insights Agent - **9 AI agents in total.**                               |
| **Innovation & Creativity (20%)**      | Multilingual and voice-based reporting, live "Watch the Agents Think" console, semantic duplicate detection using Gemini embeddings, AI-powered before/after verification, automated complaint generation, and AI-generated municipal action plans. |
| **Usage of Google Technologies (15%)** | Built around **Google Gemini** multimodal reasoning, structured outputs, and Gemini embeddings. Designed for seamless deployment on **Google Cloud Run** with Google AI Studio integration.                                                         |
| **Product Experience & Design (10%)**  | Modern responsive UI with full **light/dark mode** (system-aware, persisted), interactive issue map, analytics dashboards, gamified leaderboard, and an AI-powered floating civic assistant.                                                          |
| **Technical Implementation (10%)**     | Next.js App Router architecture, strongly typed agent orchestration, graceful Gemini fallback mode, and production-ready Docker deployment.                                                                                                         |
| **Completeness & Usability (5%)**      | Runs completely out-of-the-box using realistic seeded data-even without a Gemini API key.                                                                                                                                                           |

---

# 🧠 AI Agent System

CivicPulse orchestrates **nine Gemini-powered AI agents** that collaborate across both citizen and municipal workflows.

## 🚀 Report Pipeline (`runPipeline()`)

Every report passes through six specialized AI agents, each producing a visible reasoning trace.

### 🌐 1. Language Understanding Agent

* Detects the citizen's language
* Supports Hindi, Kannada, Tamil, and other regional languages
* Translates to English for downstream processing while preserving the original text

---

### 👁️ 2. Vision Intake Agent

Uses Gemini multimodal reasoning to analyze the uploaded image alongside the user's description.

Responsible for:

* Scene understanding
* Hazard detection
* Context extraction
* Confidence estimation

---

### 🏷️ 3. Categorization Agent

Automatically determines:

* Issue category
* Subcategory
* Smart tags
* Short descriptive title

---

### 🚨 4. Severity & Safety Agent

Evaluates:

* Risk level (1-5)
* Urgency
* Citizens affected
* Estimated repair cost
* Public safety implications

---

### 🔍 5. Deduplication Agent

Uses **Gemini embeddings** for semantic similarity instead of simple keyword matching.

Fallback strategy:

* Geographic proximity
* Keyword similarity
* Metadata comparison

Duplicate reports are merged into a single high-signal issue to minimize municipal noise.

---

### 📨 6. Routing & Action Agent

Automatically determines:

* Responsible department
* Expected SLA
* Required field actions
* Priority level

Also generates a professionally formatted complaint letter ready for submission.

---

# Additional AI Agents

### 🛡️ Municipal Co-pilot Agent (`/admin`)

Acts as an AI chief-of-staff for municipal authorities.

It:

* Prioritizes open issues
* Optimizes crew assignments
* Estimates repair timelines
* Balances departmental workloads
* Generates AI-powered action plans

---

### ✅ Resolution Verification Agent

Uses computer vision to compare before-and-after images.

Automatically:

* Verifies repairs
* Calculates confidence score
* Updates issue status
* Generates visual proof of completion

---

### 🦸 Hero Assistant Agent

A conversational AI assistant available throughout the application.

Can:

* Answer civic questions
* Help citizens file reports
* Explain issue status
* Provide recommendations using live community data

---

### 📈 Predictive Insights Agent

Analyzes historical reports to generate:

* Hotspot detection
* Trend analysis
* Demand forecasting
* Infrastructure insights
* Dashboard analytics

---

> **No Gemini API key? No problem.**
>
> Every AI agent includes an intelligent heuristic fallback, allowing the entire prototype to remain fully functional during demos. Simply add `GEMINI_API_KEY` to enable live Gemini-powered reasoning.

---

# 🚀 Run Locally

```bash
cd community-hero

npm install --legacy-peer-deps

cp .env.example .env

npm run dev
```

Visit:

```
http://localhost:3000
```

Obtain a free Gemini API key from **Google AI Studio** and add it to `.env`.

```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

---

# ☁️ Deploy to Google Cloud Run

The application produces a standalone Next.js build and includes a production-ready Dockerfile.

## Option A - Deploy from Source

```bash
gcloud run deploy civicpulse \
 --source . \
 --region asia-south1 \
 --allow-unauthenticated \
 --set-env-vars GEMINI_API_KEY=YOUR_KEY,GEMINI_MODEL=gemini-2.5-flash
```

---

## Option B - Deploy Container

```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/civicpulse

gcloud run deploy civicpulse \
 --image gcr.io/PROJECT_ID/civicpulse \
 --region asia-south1 \
 --allow-unauthenticated \
 --set-env-vars GEMINI_API_KEY=YOUR_KEY
```

Cloud Run automatically injects `PORT=8080`, which is already supported by the Docker configuration.

The generated URL becomes your **official deployed application link** for hackathon submission.

> **Production Tip:** Store the Gemini API key in **Google Secret Manager** and reference it using:
>
> ```bash
> --set-secrets GEMINI_API_KEY=gemini-key:latest
> ```

---

# 🗂️ Project Structure

```text
src/
  app/
    page.tsx                 # Landing page
    report/                  # Report flow + Live Agent Console
    map/                     # Interactive issue map
    issues/                  # Issue listing + filters
    issues/[id]/             # AI analysis, timeline, actions
    dashboard/               # Analytics + Predictive Insights
    leaderboard/             # Gamification
    admin/                   # Municipal Co-pilot
    api/                     # report, issues, action, assistant, insights, leaderboard, meta

  lib/
    agents/
      orchestrator.ts        # 6-agent report pipeline
      assistant.ts           # Hero Assistant Agent
      insights.ts            # Predictive Insights Agent
      copilot.ts             # Municipal Co-pilot
      verifier.ts            # Resolution Verification Agent

    gemini.ts                # Gemini client + JSON helpers + fallback
    store.ts                 # In-memory store (Firestore-ready abstraction)
    seed.ts
    types.ts
    gamification.ts
    format.ts

  components/
    Navbar
    AssistantWidget
    IssuesMap
    IssueCard
    ui/
```

---

# 🔧 Tech Stack

* **Next.js 15** (App Router + React 19 + TypeScript)
* **Google Gemini** (`@google/genai`) for multimodal reasoning and structured AI agents
* **Gemini Embeddings** for semantic duplicate detection
* **Tailwind CSS** for the design system
* **Leaflet** + CARTO tiles for geospatial visualization
* **Recharts** for analytics dashboards
* **Docker** for containerization
* **Google Cloud Run** for scalable deployment

---

# 🛡️ Production hardening

CivicPulse ships with the polish expected of a production website, not just a prototype:

* **SEO**: per-route titles and descriptions, canonical URLs, `metadataBase`, Open Graph and Twitter cards (with generated 1200x630 social image), JSON-LD structured data, dynamic `sitemap.xml` and `robots.txt`.
* **PWA**: installable web app manifest, maskable icons (192 / 512), Apple touch icon, SVG favicon, theme-color, and a safe network-first service worker with offline fallback.
* **Security**: hardened HTTP headers (Content-Security-Policy, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) and in-memory rate limiting on expensive AI endpoints.
* **RBAC (role-based access control)**: JWT session cookies with two roles. Citizens report, confirm and track; municipal staff additionally get the Co-pilot, crew dispatch and workflow status changes. Enforced in edge middleware (gates `/admin`) and re-checked server-side on every privileged API (defense in depth). One-click demo personas at `/login`.
* **Accessibility**: skip-to-content link, semantic landmarks, ARIA labels, visible focus rings, full light/dark theme, and `prefers-reduced-motion` support.
* **Resilience**: custom `404`, route error boundaries, a global error page, and loading states.
* **Ops**: `/api/health` health-check endpoint, a GitHub Actions CI workflow (install, lint, build), and env-gated Google Analytics.

Set `SITE_URL` (runtime) or `NEXT_PUBLIC_SITE_URL` (build time) to your deployed origin so canonical URLs, the sitemap and social cards point at the right host. Set `AUTH_SECRET` to a long random string to sign RBAC session cookies in production.

---

# 📌 Notes

* CivicPulse ships with an **in-memory datastore** seeded with realistic Bengaluru civic issues, making the demo immediately interactive.
* The datastore is abstracted behind `lib/store.ts`, allowing seamless migration to **Firestore** or another production database.
* Every AI feature gracefully falls back to deterministic heuristics when no Gemini API key is configured, ensuring the application remains fully functional.
* See **`SUBMISSION.md`** for the ready-to-submit hackathon project description, solution overview, technologies, and feature summary.