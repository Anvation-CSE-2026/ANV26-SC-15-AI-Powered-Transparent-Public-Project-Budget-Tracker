# CivicSight — AI-Powered Transparent Public Project & Budget Tracker

> **“See the Project. Understand the Data. Make Your Voice Count.”**

[![ANVATION 2026](https://img.shields.io/badge/ANVATION-2026%20Smart%20City%20GovTech-blue.svg)](https://github.com/Anvation-CSE-2026/ANV26-SC-15-AI-Powered-Transparent-Public-Project-Budget-Tracker)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19.2-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff?logo=vite)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20|%20Firestore%20|%20Storage%20|%20Functions-ffca28?logo=firebase)](https://firebase.google.com/)
[![Gemini API](https://img.shields.io/badge/Google%20Gemini-AI%20Assistant-8e75c2?logo=google)](https://ai.google.dev/)
[![Tests](https://img.shields.io/badge/Vitest-212%20Passing-brightgreen?logo=vitest)](https://vitest.dev/)

---

## 1. Executive Summary & Problem Statement

Public infrastructure projects in modern cities frequently suffer from lack of public visibility, unexpected budget overruns, undisclosed schedule delays, and disconnected grievance redressal. Citizens lack insight into tax money utilization, while municipal authorities struggle to monitor contractors proactively.

**CivicSight** bridges this governance gap. It is an end-to-end, role-secured, transparent public infrastructure tracking ecosystem. It empowers citizens to inspect real-time project progress, reports grievances, enables participatory democracy, and leverages **Google Gemini AI** and the **CivicSight Risk Indicator** to detect anomalies before they turn into costly delays.

---

## 2. Core Architecture & Technology Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19**, **TypeScript**, **Vite 8** | High-performance reactive client with strict type safety |
| **Design System** | **Tailwind CSS v4**, **Lucide Icons** | Accessible GovTech civic interface with dark/light harmony |
| **Backend & Cloud** | **Firebase Auth**, **Cloud Firestore**, **Firebase Storage**, **Cloud Functions** | RBAC identity, real-time reactive sync, secure document/photo uploads, serverless triggers |
| **Civic Intelligence** | **Google Gemini API** (`gemini-2.5-flash`) | Grounded RAG assistant explaining project deviations, budgets, and civic processes in plain language |
| **Geospatial & Viz** | **Leaflet**, **OpenStreetMap**, **Recharts** | Interactive Ward GIS mapping and telemetry data visualization |
| **Testing & Quality** | **Vitest**, **ESLint 10** | 212 automated unit, integration, and security test assertions |

---

## 3. The 3 Persona Roles & User Journeys

### 🏙️ 1. Citizen Portal (`/dashboard/citizen`)
* **Project Transparency Explorer:** Inspect capital projects with 5 comprehensive views (Overview, Milestones, Budget Telemetry, Field Updates, and Public Audit Trail).
* **Grievance Redressal:** Submit geotagged complaints with photo evidence, tracked by strict municipal SLA countdown timers.
* **Participatory Budgeting:** Propose civic suggestions and cast verified ballots in municipal polls with anti-tamper single-vote enforcement.
* **Interactive GIS Map:** Explore infrastructure worksites, road resurfacing, and flood mitigation canals across city wards.
* **Civic AI Assistant:** Query project budgets, contractor history, and complaint procedures in plain conversational language.

### 🏛️ 2. Authority / Project Manager Command Center (`/dashboard/project-manager`)
* **Charter & Project Lifecycle:** Sanction new capital charters, configure milestones, allocate budgets, and assign verified contractors.
* **Contractor Review Queue:** Audit contractor work submissions, inspect compaction tests and quality reports, approve progress releases or request revisions with official remarks.
* **Grievance Triage:** Allocate complaints to specialized municipal departments and responsible officers with SLA deadlines.
* **CivicSight Risk Engine:** Automated telemetry dashboard identifying projects experiencing potential budget anomalies or schedule slippage.
* **Governance Audit Ledger:** Searchable, immutable activity trail displaying before/after state diffs for administrative actions.

### 👷 3. Contractor Portal (`/dashboard/contractor`)
* **Assigned Projects Ledger:** View contract charters, approved physical targets, and baseline budgets.
* **Evidence Submission:** Upload verified milestone completion proof, site photographs, lab compaction reports, and invoices.
* **Delay Disclosures:** Report unavoidable material supply or utility shifting timeline delays directly to authorities.

---

## 4. CivicSight Risk Indicator Formulation

The **CivicSight Risk Indicator** is an automated, objective, non-accusatory algorithmic evaluation that highlights projects needing administrative intervention:

$$\text{Risk Score} = F_{\text{deviation}} + F_{\text{delay}} + F_{\text{progress}} + F_{\text{complaints}}$$

1. **Budget Deviation ($F_{\text{deviation}}$):** $+1$ if $\frac{\text{Actual} - \text{Approved}}{\text{Approved}} \times 100 \ge 15\%$
2. **Schedule Slippage ($F_{\text{delay}}$):** $+1$ if $\text{Delay Days} \ge 30\text{ days}$
3. **Milestone Velocity ($F_{\text{progress}}$):** $+1$ if $\text{Physical Progress} < \text{Expected Progress}$
4. **Public Friction ($F_{\text{complaints}}$):** $+1$ if $\text{Unresolved Complaints} \ge 3$

### Classification Levels:
* **0 – 1:** **Normal** (Emerald) — On Track
* **2:** **Requires Attention** (Amber) — Potential Anomaly
* **3 – 4:** **High Attention** (Rose/Red) — Escalated for PM Review

---

## 5. Realistic Demonstration Datasets

| Parameter | Demo Project A (`PRJ-2026-00101`) | Demo Project B (`PRJ-2026-00102`) |
| :--- | :--- | :--- |
| **Title** | Smart City Arterial Ring Road Resurfacing | North Sector Stormwater Drainage Canal |
| **Department** | Roads & Infrastructure | Stormwater & Drainage |
| **Contractor** | Apex Urban Infra Tech Ltd | Varun Hydraulic Engineers Pvt Ltd |
| **Approved Budget** | **₹10.00 Cr** | **₹8.00 Cr** |
| **Actual Spending** | **₹9.20 Cr** | **₹10.10 Cr** |
| **Budget Deviation** | **-8.00%** (Under Budget) | **+26.25%** (Overrun Detected) |
| **Timeline Delay** | **0 Days** | **45 Days** (Slippage) |
| **Physical Progress** | **82%** (Target: 80%) | **58%** (Target: 80%) |
| **Unresolved Issues** | **0 Unresolved** (1 Total) | **3 Unresolved** (7 Total) |
| **Risk Status** | **Normal** (Score: 0/4) | **High Attention** (Score: 4/4) |

---

## 6. Security, RBAC & Immutability Rules

The application enforces security at both the application route level (`RoleGuard`, `ProtectedRoute`) and database level:

* **Firestore Security (`firestore.rules`):**
  - **Immutable Audit Trail:** `/audit_logs/{id}` allows create by authenticated users but strictly prohibits client updates and deletes (`allow update, delete: if false;`).
  - **Anti-Tamper Ballots:** `/polls/{pollId}/votes/{uid}` enforces One-User-One-Vote by matching document ID to authenticated UID; ballots are immutable once cast.
  - **No Privilege Escalation:** Users cannot modify their own `role` field in `/users/{uid}`.
  - **Internal Remarks Boundary:** Authority internal notes on complaints are strictly invisible to citizens.
* **Storage Security (`storage.rules`):**
  - File validation restricting uploads to images (JPG, PNG, WebP) and PDFs under 10 MB.
* **Cloud Functions (`functions/src/index.ts`):**
  - `onMilestoneApproved`: Atomically updates project completion and emits notifications.
  - `onComplaintAssigned`: Notifies citizens and department officers.
  - `onSuggestionVoted`: Atomic vote counter increment.
  - `scheduledRiskAnalysis`: Automated 6-hour cron evaluating project risk factors.

---

## 7. Local Setup & Installation

### Prerequisites
- Node.js 20+
- npm 10+

### Step 1: Clone Repository
```bash
git clone https://github.com/Anvation-CSE-2026/ANV26-SC-15-AI-Powered-Transparent-Public-Project-Budget-Tracker.git
cd ANV26-SC-15-AI-Powered-Transparent-Public-Project-Budget-Tracker
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment
```bash
cp .env.example .env.local
```
*(Populate `.env.local` with your Firebase and Gemini credentials, or run directly in resilient mock fallback mode)*.

### Step 4: Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 8. Automated Quality & Verification Suite

```bash
# Run Vitest Test Suite (212 Tests)
npm run test

# Run ESLint Static Code Analysis (0 Errors, 0 Warnings)
npm run lint

# Run Production TypeScript & Vite Bundling
npm run build
```

---

## 9. License & Hackathon Attribution

Developed for **ANVATION 2026** by the **CivicSight Engineering Team**. Released under the MIT License for open, accountable civic governance.
