import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app, { server } from '../src/server.js';
import { robotSimulator } from '../src/simulator/robotSimulator.js';

const PORT = 5099;
let testServer;
let baseUrl;

// Start a dedicated test instance
test.before(async () => {
  // Stop existing default listener from server.js import to avoid collisions
  if (server && server.close) {
    server.close();
  }
  robotSimulator.stop();

  await new Promise((resolve) => {
    testServer = app.listen(PORT, () => {
      baseUrl = `http://localhost:${PORT}`;
      robotSimulator.start();
      resolve();
    });
  });
});

test.after(async () => {
  robotSimulator.stop();
  if (testServer) {
    await new Promise((resolve) => testServer.close(resolve));
  }
});

test('1. Health check returns 200 and valid status payload', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.equal(data.service, 'SensorScope Backend');
});

test('2. GET /api/readings/latest returns active readings for all 3 sensors', async () => {
  // Let simulator tick once if needed
  robotSimulator.tick();

  const res = await fetch(`${baseUrl}/api/readings/latest`);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.ok(data.readings);
  assert.ok(data.readings.battery, 'Battery sensor reading missing');
  assert.ok(data.readings.temperature, 'Temperature sensor reading missing');
  assert.ok(data.readings.distance, 'Distance sensor reading missing');

  assert.equal(typeof data.readings.battery.value, 'number');
  assert.equal(typeof data.readings.temperature.value, 'number');
  assert.equal(typeof data.readings.distance.value, 'number');
});

test('3. Rule update via PUT /api/rules updates threshold and persists', async () => {
  const updatePayload = {
    id: 'rule-temp-high',
    threshold: 48.5,
    operator: '>',
    severity: 'WARNING'
  };

  const putRes = await fetch(`${baseUrl}/api/rules`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatePayload)
  });

  assert.equal(putRes.status, 200);
  const putData = await putRes.json();
  assert.equal(putData.rule.threshold, 48.5);

  // Verify persistence via GET /api/rules
  const getRes = await fetch(`${baseUrl}/api/rules`);
  const getData = await getRes.json();
  const updatedRule = getData.rules.find((r) => r.id === 'rule-temp-high');
  assert.ok(updatedRule);
  assert.equal(updatedRule.threshold, 48.5);
});

test('4. Fault simulation trigger creates an incident in GET /api/incidents', async () => {
  // Clear any existing incidents first
  await fetch(`${baseUrl}/api/incidents`, { method: 'DELETE' });

  // Trigger obstacle mode
  const modeRes = await fetch(`${baseUrl}/api/simulator/mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'obstacle' })
  });
  assert.equal(modeRes.status, 200);

  // Force tick to trigger alert engine evaluation
  robotSimulator.tick();

  const incRes = await fetch(`${baseUrl}/api/incidents`);
  assert.equal(incRes.status, 200);
  const incData = await incRes.json();

  assert.ok(incData.incidents.length > 0, 'No incident was recorded after obstacle fault');
  const obstacleInc = incData.incidents.find((i) => i.sensor === 'distance');
  assert.ok(obstacleInc, 'Distance obstacle incident not found');
  assert.equal(obstacleInc.severity, 'CRITICAL');
  assert.equal(obstacleInc.operator, '<');

  // Reset mode to normal
  await fetch(`${baseUrl}/api/simulator/mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'normal' })
  });
});

test('5. Invalid payload to POST /api/readings returns 400 Bad Request', async () => {
  const invalidPayload = {
    sensor: 'battery',
    value: 'not-a-number'
  };

  const res = await fetch(`${baseUrl}/api/readings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invalidPayload)
  });

  assert.equal(res.status, 400);
  const errorData = await res.json();
  assert.ok(errorData.error);
});

