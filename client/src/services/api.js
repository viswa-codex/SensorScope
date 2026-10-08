// If VITE_API_URL is specified (e.g., in standalone frontend deployment), use it.
// In unified/monorepo production, fallback to relative '/api'.
// In standalone local dev without VITE_API_URL set, fallback to 'http://localhost:5000/api'.
const API_BASE = import.meta.env.VITE_API_URL 
  || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

/**
 * Fetch latest readings for all sensors
 */
export async function getLatestReadings() {
  const res = await fetch(`${API_BASE}/readings/latest`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch latest readings: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch readings history for a specific sensor
 */
export async function getReadingsHistory(sensor, limit = 50) {
  const res = await fetch(`${API_BASE}/readings?sensor=${encodeURIComponent(sensor)}&limit=${limit}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch history for ${sensor}: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch active alert rules
 */
export async function getRules() {
  const res = await fetch(`${API_BASE}/rules`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch alert rules: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Update a rule (by id or sensor)
 */
export async function updateRule(ruleData) {
  const res = await fetch(`${API_BASE}/rules`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ruleData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to update rule: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Reset all alert rules to defaults
 */
export async function resetRulesToDefault() {
  const res = await fetch(`${API_BASE}/rules/reset`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to reset rules: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch incidents log
 */
export async function getIncidents(limit = 50) {
  const res = await fetch(`${API_BASE}/incidents?limit=${limit}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch incidents: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Clear stored incidents
 */
export async function clearIncidents() {
  const res = await fetch(`${API_BASE}/incidents`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to clear incidents: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch simulator run status
 */
export async function getSimulatorStatus() {
  const res = await fetch(`${API_BASE}/simulator/status`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch simulator status: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Set simulator operational mode
 */
export async function setSimulatorMode(mode) {
  const res = await fetch(`${API_BASE}/simulator/mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to set simulator mode: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Trigger CSV export download
 */
export async function downloadTelemetryCSV(limit = 100) {
  const res = await fetch(`${API_BASE}/readings/export?limit=${limit}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to export CSV: ${res.statusText}`);
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = `sensorscope-telemetry-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
