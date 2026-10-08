/**
 * Request validation middlewares
 */

export const validateReadingInput = (req, res, next) => {
  const { sensor, value } = req.body;

  if (!sensor || typeof sensor !== 'string' || sensor.trim() === '') {
    return res.status(400).json({
      error: 'Invalid or missing sensor. Sensor must be a non-empty string (e.g. battery, temperature, distance).'
    });
  }

  if (value === undefined || value === null || typeof value !== 'number' || Number.isNaN(value)) {
    return res.status(400).json({
      error: 'Invalid or missing value. Value must be a valid number.'
    });
  }

  next();
};

export const validateRuleUpdate = (req, res, next) => {
  const { id, sensor, threshold, operator, severity, enabled } = req.body;

  if (!id && !sensor) {
    return res.status(400).json({
      error: 'Missing identifier. Either rule "id" or "sensor" is required.'
    });
  }

  if (threshold !== undefined && (typeof threshold !== 'number' || Number.isNaN(threshold))) {
    return res.status(400).json({
      error: 'Invalid threshold. Must be a valid number.'
    });
  }

  if (operator !== undefined) {
    const allowedOps = ['<', '>', '<=', '>=', '==', '==='];
    if (!allowedOps.includes(operator)) {
      return res.status(400).json({
        error: `Invalid operator '${operator}'. Supported operators: ${allowedOps.join(', ')}`
      });
    }
  }

  if (severity !== undefined) {
    const allowedSeverities = ['INFO', 'WARNING', 'CRITICAL'];
    if (!allowedSeverities.includes(severity.toUpperCase())) {
      return res.status(400).json({
        error: `Invalid severity '${severity}'. Supported: ${allowedSeverities.join(', ')}`
      });
    }
  }

  if (enabled !== undefined && typeof enabled !== 'boolean') {
    return res.status(400).json({
      error: 'Invalid enabled flag. Must be a boolean (true or false).'
    });
  }

  next();
};

export const validateModeInput = (req, res, next) => {
  const { mode } = req.body;
  const validModes = ['normal', 'battery_drain', 'overheat', 'obstacle', 'offline'];

  if (!mode || typeof mode !== 'string' || !validModes.includes(mode.toLowerCase())) {
    return res.status(400).json({
      error: `Invalid mode '${mode}'. Supported modes: ${validModes.join(', ')}`
    });
  }

  next();
};

