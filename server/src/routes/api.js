import { Router } from 'express';
import { telemetryStore } from '../services/telemetryStore.js';
import { alertEngine } from '../services/alertEngine.js';
import { robotSimulator } from '../simulator/robotSimulator.js';
import {
  validateReadingInput,
  validateRuleUpdate,
  validateModeInput
} from '../middleware/validator.js';

const router = Router();

/**
 * GET /api/readings/export
 * Returns CSV formatted telemetry data containing timestamp,robotId,sensor,value,unit
 */
router.get('/readings/export', (req, res) => {
  try {
    const { limit } = req.query;
    const readings = telemetryStore.getAllReadings(limit ? parseInt(limit, 10) : 100);

    const headers = 'timestamp,robotId,sensor,value,unit\n';
    const rows = readings.map(r => 
      `"${r.timestamp}","${r.robotId}","${r.sensor}",${r.value},"${r.unit || ''}"`
    ).join('\n');

    const csvContent = headers + rows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="sensorscope-telemetry-${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (err) {
    res.status(500).json({ error: `Failed to export CSV: ${err.message}` });
  }
});

/**
 * GET /api/readings/latest
 * Returns latest reading and status for all active sensors.
 */
router.get('/readings/latest', (req, res) => {
  try {
    const latest = telemetryStore.getLatestReadings();
    res.json({
      timestamp: new Date().toISOString(),
      robotId: robotSimulator.robotId,
      readings: latest
    });
  } catch (err) {
    res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
});

/**
 * GET /api/readings?sensor=&limit=
 * Returns historical readings for a sensor.
 */
router.get('/readings', (req, res) => {
  try {
    const { sensor, limit } = req.query;

    if (!sensor) {
      return res.status(400).json({
        error: 'Missing required query parameter "sensor" (e.g. ?sensor=battery)'
      });
    }

    const readings = telemetryStore.getHistory(sensor, limit ? parseInt(limit, 10) : 50);
    res.json({
      sensor: sensor.toLowerCase(),
      count: readings.length,
      readings
    });
  } catch (err) {
    res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
});

/**
 * POST /api/readings
 * Manual ingestion of external sensor readings.
 */
router.post('/readings', validateReadingInput, (req, res) => {
  try {
    const { sensor, value, robotId, timestamp } = req.body;
    const result = robotSimulator.pushManualReading({ sensor, value, robotId, timestamp });

    res.status(201).json({
      message: 'Reading recorded successfully',
      reading: result.reading,
      incidentsTriggered: result.incidents
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to ingest reading: ${err.message}` });
  }
});

/**
 * GET /api/rules
 * Returns list of current alert rules.
 */
router.get('/rules', (req, res) => {
  try {
    res.json({
      rules: alertEngine.getRules()
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to retrieve rules: ${err.message}` });
  }
});

/**
 * PUT /api/rules
 * Updates rule thresholds or operators.
 */
router.put('/rules', validateRuleUpdate, (req, res) => {
  try {
    const { id, sensor, threshold, operator, severity, enabled } = req.body;
    const targetKey = id || sensor;

    const updated = alertEngine.updateRule(targetKey, {
      threshold,
      operator,
      severity,
      enabled
    });

    if (!updated) {
      return res.status(404).json({
        error: `Rule with identifier '${targetKey}' not found.`
      });
    }

    res.json({
      message: 'Rule updated successfully',
      rule: updated
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to update rule: ${err.message}` });
  }
});

/**
 * POST /api/rules/reset
 * Resets alert rules to factory defaults.
 */
router.post('/rules/reset', (req, res) => {
  try {
    const rules = alertEngine.resetRulesToDefault();
    res.json({
      message: 'Rules reset to defaults successfully',
      rules
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to reset rules: ${err.message}` });
  }
});

/**
 * GET /api/incidents
 * Returns incident log sorted newest first.
 */
router.get('/incidents', (req, res) => {
  try {
    const { limit } = req.query;
    const incidents = alertEngine.getIncidents(limit ? parseInt(limit, 10) : 50);
    res.json({
      total: incidents.length,
      incidents
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to retrieve incidents: ${err.message}` });
  }
});

/**
 * DELETE /api/incidents & POST /api/incidents/clear
 * Clears stored incidents.
 */
router.delete('/incidents', (req, res) => {
  try {
    alertEngine.clearIncidents();
    res.json({
      message: 'Incidents cleared successfully',
      incidents: []
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to clear incidents: ${err.message}` });
  }
});

router.post('/incidents/clear', (req, res) => {
  try {
    alertEngine.clearIncidents();
    res.json({
      message: 'Incidents cleared successfully',
      incidents: []
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to clear incidents: ${err.message}` });
  }
});

/**
 * POST /api/simulator/mode
 * Sets simulation mode (normal, battery_drain, overheat, obstacle, offline).
 */
router.post('/simulator/mode', validateModeInput, (req, res) => {
  try {
    const { mode } = req.body;
    const status = robotSimulator.setMode(mode.toLowerCase());
    res.json({
      message: `Simulator mode switched to ${mode}`,
      status
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/simulator/status
 * Returns simulator run state, active mode, and robot status.
 */
router.get('/simulator/status', (req, res) => {
  try {
    res.json(robotSimulator.getStatus());
  } catch (err) {
    res.status(500).json({ error: `Failed to get simulator status: ${err.message}` });
  }
});

export default router;
