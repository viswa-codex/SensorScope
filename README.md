# SensorScope — Real-Time Robot Telemetry & Incident Monitoring

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-black?logo=express)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6+-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-5%20Passing-brightgreen?logo=checkmarx)](server/test/api.test.js)

**SensorScope** is an autonomous robotics telemetry console and incident monitoring system built for the Robotics Club recruitment project (**PS-09 Sensor Scope**). It provides end-to-end telemetry ingestion, in-memory ring-buffer storage, real-time threshold rule evaluation with incident cooldown deduplication, and an interactive high-contrast dark industrial dashboard.

---

## 📌 Project Links & Live Deployments

- **Live Web Application**: `https://sensorscope.onrender.com` *(Placeholder / Configured via `render.yaml`)*
- **Live Backend API**: `https://sensorscope.onrender.com/api/health`
- **GitHub Repository**: `https://github.com/your-username/SensorScope` *(Placeholder)*

---

## 🚀 Problem Statement & Use Case (PS-09)

Autonomous and remotely-operated robotics platforms encounter diverse environmental stresses (voltage drops, motor thermal runaway, proximity hazards). Operators need a reliable, low-latency telemetry monitoring dashboard that:
1. **Visualizes live status** across critical sensor parameters (**Battery**, **Temperature**, **Distance**) without UI lag.
2. **Evaluates customizable safety boundaries** in real time.
3. **Alerts operators instantly** upon rule violations without flooding incident logs with duplicate noise.
4. **Allows deterministic fault testing** through controlled simulation modes.
5. **Accepts physical hardware telemetry** (ESP32 / Arduino / ROS2 nodes) through standard REST endpoints.

---

## ✨ Core Features Completed

| Feature | Description |
| :--- | :--- |
| **Simulated Robot (ROBOT #01)** | Realistic 2-second telemetry stream generating internal battery discharge (`0–100%`), core temperature drifts (`20–45°C`), and ultrasonic proximity variations (`10–150 cm`). |
| **Real-Time Sensor Cards** | Responsive 3-column sensor grid with unit formatting, numerical values, animated status badges (`NORMAL`, `WARNING`, `CRITICAL`), threshold indicators, and emergency red/amber border pulses upon violation. |
| **Telemetry Waveforms (Recharts)** | High-frequency telemetry charts plotting the latest 50 readings per sensor with formatted timestamps (`HH:mm:ss`), dark tooltips, and horizontal threshold limit reference lines. |
| **Editable Alert Rules Engine** | Operators can modify threshold values, comparison operators (`<`, `>`, `<=`, `>=`), and severity classes in real time. Features client validation and a **"Reset Defaults"** factory restore action. |
| **Smart Incident Deduplication** | 30-second cooldown per rule prevents log spamming during sustained faults while tracking state transitions and recording timestamped violation snapshots. |
| **Fault Injection Console** | One-click simulation triggers: `Normal Operations`, `Battery Drain (< 20%)`, `Overheating (> 45°C)`, `Obstacle Hazard (< 10 cm)`, and `Robot Offline (Tele-halt)`. |
| **CSV Telemetry Export** | Built-in CSV export delivering raw historical records (`timestamp,robotId,sensor,value,unit`) directly from the chart toolbar. |
| **Resilient Connection Handling** | Polished disconnected uplink banner with automatic 5-second retry countdown and instant manual reconnection button. |
| **Dual Deployment Architecture** | Serves as a unified single-service full-stack application on Render/Fly.io or standalone SPA on Vercel (`client/vercel.json`). |

---

## 🏗️ Architecture & Tech Stack

```
SensorScope/
├── server/                        # Node.js + Express Backend
│   ├── src/
│   │   ├── middleware/            # Input validation & error guards
│   │   ├── routes/                # REST API router (/api/readings, /api/rules, etc.)
│   │   ├── services/
│   │   │   ├── alertEngine.js     # Rule matching & 30s cooldown deduplicator
│   │   │   └── telemetryStore.js  # In-memory ring buffer (100 readings/sensor)
│   │   ├── simulator/
│   │   │   └── robotSimulator.js  # Autonomous 2s ticker & fault modes
│   │   └── server.js              # Express app, static SPA host, CORS whitelist
│   └── test/                      # Native node:test automated integration suite
│
├── client/                        # React + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/            # Navbar, SensorCard, TelemetryChart,
│   │   │                          # AlertRulesPanel, IncidentLog, SimulatorControls
│   │   ├── hooks/                 # useTelemetry.js (2s polling & sync)
│   │   ├── services/              # api.js (REST client layer)
│   │   └── App.jsx                # Unified dark robotics console
│   └── vite.config.js             # Vite + Tailwind v4 configuration
```

### Backend Services
- **`telemetryStore.js`**: In-memory ring buffers maintaining up to 100 historical readings per sensor with unit metadata.
- **`alertEngine.js`**: Stateful evaluator checking readings against active thresholds. Employs a `violationStates` cache with a 30-second cooldown to suppress redundant incident alerts.
- **`robotSimulator.js`**: Standalone 2-second tick loop generating continuous realistic physics drifts or rapid fault trajectories.

### Frontend Components
- **`useTelemetry.js`**: Custom hook coordinating 2-second background polling, automatic chronological waveform inversion, and disconnect detection.
- **`TelemetryChart.jsx`**: Responsive Recharts canvas rendering without animation frame lag on rapid updates.
- **`AlertRulesPanel.jsx`**: Inline rule editor with numeric validation and factory reset.
- **`SimulatorControls.jsx`**: Fault injection bar with evaluator tooltips explaining each fault scenario.

---

## 📡 API Specification Table

| Method | Endpoint | Query / Body Params | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | None | Returns backend status, service name, and timestamp. |
| `GET` | `/api/readings/latest` | None | Returns most recent telemetry reading for all 3 sensors. |
| `GET` | `/api/readings` | `?sensor=battery&limit=50` | Retrieves chronological reading history for a specified sensor. |
| `GET` | `/api/readings/export` | `?limit=100` | Downloads CSV formatted telemetry records. |
| `POST` | `/api/readings` | `{ sensor, value, robotId? }` | Manual ingestion endpoint for real hardware or external agents. |
| `GET` | `/api/rules` | None | Retrieves all active alert rules and configured limits. |
| `PUT` | `/api/rules` | `{ id, threshold, operator, severity }` | Modifies an existing rule threshold, operator, or severity. |
| `POST` | `/api/rules/reset` | None | Resets all alert rules back to system factory defaults. |
| `GET` | `/api/incidents` | `?limit=50` | Retrieves deduplicated incident records (newest first). |
| `DELETE` | `/api/incidents` | None | Clears the incident buffer history. |
| `GET` | `/api/simulator/status`| None | Returns simulator run state, active mode, and robot status. |
| `POST` | `/api/simulator/mode` | `{ mode }` | Sets mode (`normal`, `battery_drain`, `overheat`, `obstacle`, `offline`). |

---

## 🧪 Evaluator Verification Guide

To quickly verify all mandatory rubric requirements, run through the following test sequence:

### Test Flow: Fault Trigger → Alert State → Incident Log
1. **Start the application**: Run `npm run dev` in the root folder and open `http://localhost:5173`.
2. **Observe Nominal State**: Verify that all 3 cards (Battery, Temperature, Distance) display green **NORMAL** badges and chart waveforms populate every 2 seconds.
3. **Trigger Fault Injection**:
   - In the **Simulator Fault Injection Console**, click **`Battery Drain`**.
   - Notice the battery card drops rapidly. As soon as it crosses below `< 20%`:
     * The **Main Power Pack** card immediately turns **CRITICAL** with an animated red glow and warning border.
     * An incident entry immediately appears in the **Incident Log**:
       `CRITICAL • BATTERY • Observed: 17.6 • Rule Violation: battery < 20`
4. **Test Rule Modification**:
   - In the **Editable Alert Thresholds** panel, change the Core Thermals threshold to `30°C` and click **Save Rule**.
   - Because normal operating temperature is ~33°C, the **Core Thermals** card immediately turns into a **WARNING** state.
   - Click **Reset Defaults** to restore standard thresholds.
5. **Test CSV Telemetry Export**:
   - In the telemetry chart header, click **`Export CSV`**.
   - Verify that your browser downloads a clean CSV file (`sensorscope-telemetry-[timestamp].csv`).
6. **Normalize State**:
   - Click **`Normal Operations`** in the Simulator Console.
   - Values will gently recover to nominal operational ranges and badges return to green **NORMAL**.

---

## 💻 Local Setup & Execution

### Prerequisites
- Node.js `v20.0.0` or later
- npm `v10.0.0` or later

### 1. Installation
Clone the repository and install all dependencies:
```bash
git clone https://github.com/your-username/SensorScope.git
cd SensorScope
npm run install:all
```

### 2. Run in Development Mode
Launch both the backend server (port 5000) and Vite frontend (port 5173) concurrently:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Automated Integration Tests
Verify all API endpoints, rule evaluators, and error guards:
```bash
npm test
```

### 4. Build & Run in Production Mode
Compile the client bundle and start the unified production server:
```bash
npm run build
npm start
```
The unified application is now live at [http://localhost:5000](http://localhost:5000).

---

## ⚙️ Environment Variables

### Server (`server/.env`)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)
```env
# In development (leave empty or point to backend):
VITE_API_URL=http://localhost:5000/api
```

---

## 🤖 How I Used AI (Transparent Disclosure)

In adherence to the transparent AI usage guidelines of the Robotics Club recruitment process:

- **AI Tools Used**: Google Antigravity Agentic AI Assistant (Gemini 3.8 Flash).
- **Role of the Tool**:
  - Accelerated initial boilerplate scaffolding for Express and Vite.
  - Assisted in crafting syntax-accurate Recharts waveform formatting and Tailwind v4 CSS utility layouts.
  - Automated repetitive integration testing boilerplate (`server/test/api.test.js`).
- **Human Author Architectural Authority**:
  - The architectural design (in-memory ring buffer limits, the 30-second deduplication cache, specific fault injection trajectories, and REST contract schemas) was explicitly architected and directed by the author.
  - Every file, threshold rule, and endpoint was iteratively tested, reviewed, and verified locally using terminal test suites to guarantee robust software engineering practices.

---

## 📄 License
MIT © 2026 SensorScope Robotics Team.

