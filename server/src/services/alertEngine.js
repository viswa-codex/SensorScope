import { randomUUID } from 'crypto';

const DEFAULT_RULES = [
  {
    id: 'rule-battery-low',
    sensor: 'battery',
    operator: '<',
    threshold: 20,
    severity: 'CRITICAL',
    enabled: true
  },
  {
    id: 'rule-temp-high',
    sensor: 'temperature',
    operator: '>',
    threshold: 45,
    severity: 'WARNING',
    enabled: true
  },
  {
    id: 'rule-dist-critical',
    sensor: 'distance',
    operator: '<',
    threshold: 10,
    severity: 'CRITICAL',
    enabled: true
  }
];

/**
 * Alert Engine Service
 * Manages threshold rules, evaluates incoming telemetry readings,
 * throttles incident spam, and stores timestamped incidents.
 */
class AlertEngine {
  constructor() {
    this.rules = JSON.parse(JSON.stringify(DEFAULT_RULES));
    this.incidents = [];
    this.maxIncidents = 200;

    // Track active violation status and timestamps to prevent spam
    this.violationStates = new Map();
    this.cooldownMs = 30000; // 30 seconds throttle if violation persists
  }

  /**
   * Retrieves all configured rules.
   */
  getRules() {
    return [...this.rules];
  }

  /**
   * Resets all rules to factory defaults.
   */
  resetRulesToDefault() {
    this.rules = JSON.parse(JSON.stringify(DEFAULT_RULES));
    return [...this.rules];
  }

  /**
   * Updates an existing rule by ID or sensor name.
   * @param {string} id
   * @param {Object} updates
   */
  updateRule(id, updates = {}) {
    const ruleIndex = this.rules.findIndex(r => r.id === id || r.sensor === id);
    if (ruleIndex === -1) {
      return null;
    }

    const current = this.rules[ruleIndex];
    const updated = {
      ...current,
      ...(updates.threshold !== undefined && { threshold: Number(updates.threshold) }),
      ...(updates.operator !== undefined && { operator: updates.operator }),
      ...(updates.severity !== undefined && { severity: updates.severity }),
      ...(updates.enabled !== undefined && { enabled: Boolean(updates.enabled) })
    };

    this.rules[ruleIndex] = updated;
    return updated;
  }

  /**
   * Evaluates a sensor reading against all active rules.
   * Emits incident if rule condition triggers.
   * @param {Object} reading - { sensor, value, timestamp, robotId }
   */
  evaluateReading(reading) {
    if (!reading || !reading.sensor) return [];

    const generatedIncidents = [];
    const now = Date.now();
    const sensor = reading.sensor.toLowerCase();

    for (const rule of this.rules) {
      if (!rule.enabled || rule.sensor.toLowerCase() !== sensor) {
        continue;
      }

      const isViolated = this.checkCondition(reading.value, rule.operator, rule.threshold);
      const stateKey = `${rule.id}:${reading.robotId || 'default'}`;
      const state = this.violationStates.get(stateKey) || { inViolation: false, lastIncidentAt: 0 };

      if (isViolated) {
        // If not already in violation, or cooldown elapsed
        const shouldTrigger = !state.inViolation || (now - state.lastIncidentAt >= this.cooldownMs);

        if (shouldTrigger) {
          const incident = {
            id: `inc-${randomUUID().slice(0, 8)}`,
            timestamp: reading.timestamp || new Date().toISOString(),
            robotId: reading.robotId || 'ROBOT #01',
            sensor: rule.sensor,
            observedValue: reading.value,
            threshold: rule.threshold,
            operator: rule.operator,
            severity: rule.severity,
            message: `Telemetry alert: ${rule.sensor} is ${reading.value} (threshold ${rule.operator} ${rule.threshold})`
          };

          this.incidents.unshift(incident);
          if (this.incidents.length > this.maxIncidents) {
            this.incidents.pop();
          }

          generatedIncidents.push(incident);
          this.violationStates.set(stateKey, { inViolation: true, lastIncidentAt: now });
        }
      } else {
        // Recovered
        if (state.inViolation) {
          this.violationStates.set(stateKey, { inViolation: false, lastIncidentAt: state.lastIncidentAt });
        }
      }
    }

    return generatedIncidents;
  }

  checkCondition(val, op, threshold) {
    if (op === '<') return val < threshold;
    if (op === '>') return val > threshold;
    if (op === '<=') return val <= threshold;
    if (op === '>=') return val >= threshold;
    if (op === '===' || op === '==') return val === threshold;
    return false;
  }

  /**
   * Retrieves incidents sorted newest first.
   * @param {number} limit
   */
  getIncidents(limit = 50) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 50, this.maxIncidents));
    return this.incidents.slice(0, safeLimit);
  }

  /**
   * Clears incident history.
   */
  clearIncidents() {
    this.incidents = [];
    this.violationStates.clear();
  }
}

export const alertEngine = new AlertEngine();
