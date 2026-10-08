const SENSOR_UNITS = {
  battery: '%',
  temperature: '°C',
  distance: 'cm'
};

/**
 * Telemetry In-Memory Store
 * Implements ring buffers of size 100 per sensor.
 */
class TelemetryStore {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.buffers = new Map(); // sensor -> array of readings
  }

  /**
   * Adds a telemetry reading to the in-memory ring buffer.
   * @param {Object} reading - { sensor, value, timestamp, robotId }
   */
  addReading({ sensor, value, timestamp = new Date().toISOString(), robotId = 'ROBOT #01' }) {
    if (!sensor || typeof value !== 'number') {
      throw new Error('Invalid reading: sensor and numeric value required');
    }

    const normalizedSensor = sensor.toLowerCase();
    if (!this.buffers.has(normalizedSensor)) {
      this.buffers.set(normalizedSensor, []);
    }

    const buffer = this.buffers.get(normalizedSensor);
    const readingObj = {
      sensor: normalizedSensor,
      value: Number(value),
      timestamp,
      robotId,
      unit: SENSOR_UNITS[normalizedSensor] || ''
    };

    buffer.push(readingObj);
    if (buffer.length > this.maxSize) {
      buffer.shift(); // maintain ring buffer limit
    }

    return readingObj;
  }

  /**
   * Returns the most recent reading for each sensor.
   * @returns {Object} { [sensor]: readingObj }
   */
  getLatestReadings() {
    const latest = {};
    for (const [sensor, buffer] of this.buffers.entries()) {
      if (buffer.length > 0) {
        latest[sensor] = buffer[buffer.length - 1];
      }
    }
    return latest;
  }

  /**
   * Alias for getLatestReadings
   */
  getLatest() {
    return this.getLatestReadings();
  }

  /**
   * Returns reading history for a specific sensor, newest first.
   * @param {string} sensor
   * @param {number} limit
   * @returns {Array}
   */
  getHistory(sensor, limit = 50) {
    if (!sensor) return [];
    const normalizedSensor = sensor.toLowerCase();
    const buffer = this.buffers.get(normalizedSensor) || [];
    const safeLimit = Math.max(1, Math.min(Number(limit) || 50, this.maxSize));
    // Return newest readings first
    return buffer.slice(-safeLimit).reverse();
  }

  /**
   * Returns all readings across all sensors sorted by timestamp.
   * @param {number} limit
   * @returns {Array}
   */
  getAllHistory(limit = 100) {
    return this.getAllReadings(limit);
  }

  /**
   * Returns all readings across all sensors sorted by timestamp ascending or descending.
   * @param {number} limit
   * @returns {Array}
   */
  getAllReadings(limit = 100) {
    const all = [];
    for (const buffer of this.buffers.values()) {
      all.push(...buffer);
    }
    // Sort chronological (oldest to newest)
    all.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 300));
    return all.slice(-safeLimit);
  }

  /**
   * Clears all stored readings (used in tests/resets).
   */
  clear() {
    this.buffers.clear();
  }
}

export const telemetryStore = new TelemetryStore();
