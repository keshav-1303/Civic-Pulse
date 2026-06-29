# CivicPulse - Project Description (Submission)

> Paste this into your Google Doc for the BlockseBlock submission. Make sure the doc is shared as "anyone with the link can view".

## Problem Statement Selected
**Community Hero - Hyperlocal Problem Solver.** Communities face fragmented, opaque, and hard-to-track reporting of issues like potholes, water leakages, broken streetlights, waste, and unsafe infrastructure. We built a platform that lets citizens identify, report, validate, track, and resolve these issues through collaboration, data, and intelligent automation.

## Solution Overview
**CivicPulse** turns a single photo + one line of text (in any Indian language, typed or spoken) into fully triaged, routed, and trackable civic action. Instead of a static form, every report flows through a transparent **team of AI agents** powered by Google Gemini:

1. **Language Understanding Agent** detects the citizen's language and translates to English for routing while preserving their original words.
2. **Vision Intake Agent** understands the photo and description (multimodal).
3. **Categorization Agent** classifies the issue and tags it.
4. **Severity & Safety Agent** scores risk 1-5, flags who is in danger, and estimates repair cost.
5. **Deduplication Agent** uses **Gemini embeddings** for semantic similarity to merge duplicate reports into one high-signal issue, cutting municipal noise.
6. **Routing & Action Agent** assigns the right department, sets an SLA, and auto-drafts a formal complaint letter the citizen can send.

On the municipal side, a **Co-pilot Agent** triages the entire open queue into a prioritized daily dispatch plan (crews, ETAs, department workload), and a **Resolution Verification Agent** inspects an "after" photo to auto-resolve issues with before/after proof. A **conversational assistant** ("Hero") and a **predictive insights** engine round out nine agents in total. Citizens verify each other's reports (community validation), track status from *Reported → Verified → In Progress → Resolved*, and earn points and badges on a Community Hero leaderboard.

## Key Features
- 🌐 **Multilingual + voice reporting** - report in Hindi/Kannada/Tamil/etc., typed or spoken
- 📸 **Image + text reporting** with a live "watch the agents think" console
- 🧠 **6-agent triage pipeline** with a visible reasoning trace
- 🔍 **Semantic duplicate detection & smart-merge** via Gemini embeddings
- 📨 **Auto-drafted official complaint letters** + department routing + SLA
- 🛡️ **Municipal Co-pilot** - AI-prioritized daily dispatch plan for officials
- ✅ **AI resolution verification** - before/after photo proof closes the loop
- 🗺️ **Live geo-map** of all issues with severity-coded, pulsing pins
- 🙌 **Community verification** (5 confirmations auto-verify an issue)
- 📊 **Impact dashboard**: category/status/ward charts + **predictive insights**
- 🏆 **Gamification**: points, levels, badges, and a heroes leaderboard
- 💬 **Conversational AI assistant** grounded on live community data
- 🔄 **Transparent status tracking** with a full activity timeline

## Technologies Used
- Next.js 15 (App Router, React 19, TypeScript)
- Tailwind CSS, Recharts, Leaflet (mapping)
- Typed multi-agent orchestrator with graceful heuristic fallback
- Docker (standalone build)

## Google Technologies Utilized
- **Google Gemini API** (`@google/genai`) - multimodal image+text reasoning, structured JSON outputs, and conversational responses across all nine agents.
- **Gemini Embeddings** (`text-embedding-004`) - semantic similarity for the Deduplication Agent.
- **Google AI Studio** - API key provisioning and model selection (`gemini-2.5-flash`).
- **Google Cloud Run** - containerized, autoscaling deployment of the application (the public submission link).
- **Google Cloud Build** - building and pushing the container image.
- (Production-ready) **Firestore / Secret Manager** abstractions for durable storage and secret handling.

## Links
- **Deployed Application:** <add Cloud Run URL>
- **GitHub Repository:** <add repo URL>
- **Demo video (optional):** <add link>
