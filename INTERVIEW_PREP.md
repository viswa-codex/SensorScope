# SensorScope — Technical Interview Walkthrough & Architecture Notes

This reference guide summarizes the core design decisions, data flow models, and technical rationales behind **SensorScope** for recruitment interview evaluations.

---

### 1. Why React + Vite + Node/Express?
- **Vite + React**:
  - Vite provides instantaneous Hot Module Replacement (HMR) and optimized Rollup/esbuild bundling, critical for rapid telemetry dashboard prototyping.
  - React’s reactive state model effortlessly handles 2-second telemetry re-renders without full page recalculations, keeping Recharts waveform animations smooth.
- **Node.js + Express**:
  - Express is lightweight, non-blocking, and native to asynchronous event loops, which perfectly fits high-frequency I/O (handling multi-sensor telemetry ticks and simultaneous REST queries).
  - Keeps the entire stack in unified ES Modules JavaScript, reducing context switching and enabling shared validation schemas.

---

### 2. How the 2-Second Simulator Tick & Incident Deduplication Work
- **The Problem**: If a sensor stays in violation for 2 minutes (60 ticks), emitting an incident on every tick would spam 60 identical entries into the log, drowning out new anomalies.
- **The Solution (`alertEngine.js`)**:
  - Maintains an in-memory `violationStates` Map keyed by `${rule.id}:${robotId}`.
  - When a rule condition is first violated, it fires immediately and marks `inViolation = true` with a timestamp.
  - On subsequent ticks while the violation persists, repeat incidents are throttled via a **30-second cooldown period** (`cooldownMs = 30000`).
  - If the sensor recovers back to normal bounds, the state resets (`inViolation = false`), ready to immediately flag a new violation when one occurs.

---

### 3. End-to-End Data Flow Model
```
[ robotSimulator.js (2s loop) ]
           │
           ▼
[ telemetryStore.js ] ───(ring buffer: 100/sensor)───► GET /api/readings/latest & history
           │
           ▼
[ alertEngine.js ]    ───(rule check + cooldown)  ───► GET /api/incidents
           │
           ▼ (HTTP Poll every 2s via useTelemetry.js)
┌────────────────────────────────────────────────────────┐
│                   React Dashboard                      │
│  ├── SensorCard.jsx      (Evaluates live threshold)    │
│  ├── TelemetryChart.jsx  (Renders 50-point waveform)   │
│  ├── AlertRulesPanel.jsx (Edits thresholds via PUT)    │
│  └── IncidentLog.jsx     (Displays deduplicated alerts)│
└────────────────────────────────────────────────────────┘
```

---

### 4. How Physical Hardware (ESP32 / Arduino / ROS2) Connects
- SensorScope is architected with a decoupled manual ingestion route:
  ```http
  POST /api/readings
  Content-Type: application/json

  {
    "sensor": "battery",
    "value": 14.8,
    "robotId": "ROBOT #01"
  }
  ```
- Any microcontroller with Wi-Fi (e.g., ESP32 using `HTTPClient`) or a ROS2 publisher node can POST directly to this endpoint.
- The reading enters the exact same `telemetryStore` ring buffer and `alertEngine` evaluation pipeline without requiring any modifications to the React UI or client polling logic.

---

### 5. Client vs. Server Validation Rationale
- **Client-Side Validation (`AlertRulesPanel.jsx`)**:
  - Provides instant feedback to the operator (prevents NaN, bounds battery to 0–100%, and ensures distance is non-negative) before making unnecessary network roundtrips.
- **Server-Side Validation (`middleware/validator.js`)**:
  - Protects backend integrity against malformed external payloads, automated scripts, or faulty hardware telemetry by rejecting bad input with consistent `400 Bad Request` messages.

---

### 6. Memory Management with Ring Buffers
- Rather than an unbounded growing array, `telemetryStore.js` employs a ring buffer capped at 100 entries per sensor.
- When the buffer reaches 100 items, `buffer.shift()` removes the oldest entry before appending the newest.
- This ensures memory consumption remains bounded and predictable, avoiding memory leaks during long-running telemetry monitoring.
