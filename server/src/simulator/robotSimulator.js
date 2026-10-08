import { telemetryStore } from '../services/telemetryStore.js';
import { alertEngine } from '../services/alertEngine.js';

/**
 * Robot #01 Telemetry Simulator
 * Simulates real-time sensor dynamics, state variations, and fault modes.
 */
class RobotSimulator {
  constructor(robotId = 'ROBOT #01') {
    this.robotId = robotId;
    this.isRunning = false;
    this.intervalId = null;
    this.tickIntervalMs = 2000; // 2 seconds

    // Simulation modes: 'normal', 'battery_drain', 'overheat', 'obstacle', 'offline'
    this.mode = 'normal';

    // Baseline internal state
    this.state = {
      battery: 88.0,     // % (0 - 100)
      temperature: 30.0, // °C (20 - 45 normal)
      distance: 75.0     // cm (10 - 150 normal)
    };
  }

  /**
   * Starts the 2-second simulation loop.
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[Simulator] Starting telemetry stream for ${this.robotId} (mode: ${this.mode})`);
    
    // Initial immediate tick
    this.tick();
    this.intervalId = setInterval(() => this.tick(), this.tickIntervalMs);
  }

  /**
   * Stops the simulation loop.
   */
  stop() {
    if (!this.isRunning) return;
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.isRunning = false;
    console.log(`[Simulator] Stopped telemetry stream for ${this.robotId}`);
  }

  /**
   * Returns current active mode.
   */
  getMode() {
    return this.mode;
  }

  /**
   * Sets the operational or fault mode.
   * @param {string} mode
   */
  setMode(mode) {
    const validModes = ['normal', 'battery_drain', 'overheat', 'obstacle', 'offline'];
    if (!validModes.includes(mode)) {
      throw new Error(`Invalid mode: '${mode}'. Supported modes: ${validModes.join(', ')}`);
    }

    this.mode = mode;
    console.log(`[Simulator] Simulation mode switched to: ${this.mode}`);

    // If switching to normal, gently reset critical states toward safe ranges
    if (mode === 'normal') {
      if (this.state.battery < 30) this.state.battery = 88.0;
      if (this.state.temperature > 40) this.state.temperature = 30.0;
      if (this.state.distance < 20) this.state.distance = 75.0;
    }

    return { mode: this.mode, robotId: this.robotId, isRunning: this.isRunning };
  }

  /**
   * Generates next telemetry tick based on active mode.
   */
  tick() {
    if (this.mode === 'offline') {
      // Robot is simulated as offline/disconnected; emit no telemetry
      return;
    }

    const timestamp = new Date().toISOString();

    // 1. Calculate next state depending on mode
    switch (this.mode) {
      case 'battery_drain':
        // Rapid discharge to test < 20 critical threshold
        this.state.battery = Math.max(0, +(this.state.battery - (Math.random() * 5 + 4)).toFixed(1));
        this.state.temperature = +(34 + Math.random() * 3).toFixed(1);
        this.state.distance = +(50 + Math.random() * 30).toFixed(1);
        break;

      case 'overheat':
        // Overheating simulation pushing > 45°C up to 55°C+
        this.state.battery = Math.max(1, +(this.state.battery - 0.2).toFixed(1));
        this.state.temperature = Math.min(85, +(this.state.temperature + (Math.random() * 4 + 3)).toFixed(1));
        this.state.distance = +(60 + Math.random() * 20).toFixed(1);
        break;

      case 'obstacle':
        // Proximity sensor alert, < 10 cm critical barrier (dropping under 8 cm)
        this.state.battery = Math.max(1, +(this.state.battery - 0.1).toFixed(1));
        this.state.temperature = +(32 + Math.random() * 2).toFixed(1);
        this.state.distance = +(Math.random() * 5 + 2).toFixed(1); // 2 - 7 cm
        break;

      case 'normal':
      default:
        // Slow natural battery discharge
        this.state.battery = Math.max(0, +(this.state.battery - 0.05).toFixed(2));
        if (this.state.battery < 15) this.state.battery = 92.0; // auto recharge in normal loop

        // Natural thermal drift (25 - 35°C normal operating range)
        const tempDelta = (Math.random() - 0.5) * 1.0;
        this.state.temperature = +(Math.min(35, Math.max(25, this.state.temperature + tempDelta))).toFixed(1);

        // Ultrasonic range fluctuation (40 - 120 cm)
        const distDelta = (Math.random() - 0.5) * 6.0;
        this.state.distance = +(Math.min(120, Math.max(40, this.state.distance + distDelta))).toFixed(1);
        break;
    }

    // 2. Dispatch readings to store and evaluate alert engine
    const sensors = [
      { sensor: 'battery', value: this.state.battery },
      { sensor: 'temperature', value: this.state.temperature },
      { sensor: 'distance', value: this.state.distance }
    ];

    for (const { sensor, value } of sensors) {
      const reading = telemetryStore.addReading({
        sensor,
        value,
        timestamp,
        robotId: this.robotId
      });
      alertEngine.evaluateReading(reading);
    }
  }

  /**
   * Ingests a manual/external sensor reading.
   * @param {Object} param0
   */
  pushManualReading({ sensor, value, robotId = this.robotId, timestamp }) {
    const reading = telemetryStore.addReading({
      sensor,
      value: Number(value),
      timestamp: timestamp || new Date().toISOString(),
      robotId
    });

    const incidents = alertEngine.evaluateReading(reading);
    return { reading, incidents };
  }

  /**
   * Retrieves status summary of simulator.
   */
  getStatus() {
    return {
      robotId: this.robotId,
      isRunning: this.isRunning,
      mode: this.mode,
      tickIntervalMs: this.tickIntervalMs,
      currentState: { ...this.state },
      online: this.mode !== 'offline' && this.isRunning
    };
  }
}

export const robotSimulator = new RobotSimulator();
