import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getLatestReadings,
  getReadingsHistory,
  getRules,
  getSimulatorStatus,
  getIncidents
} from '../services/api';

/**
 * Custom hook to poll and synchronize live telemetry data every 2s
 */
export function useTelemetry(intervalMs = 2000) {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState({ battery: [], temperature: [], distance: [] });
  const [rules, setRules] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [simulatorStatus, setSimulatorStatus] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);

  const fetchTelemetry = useCallback(async () => {
    try {
      const [
        latestData,
        batteryHist,
        tempHist,
        distHist,
        rulesData,
        simData,
        incData
      ] = await Promise.all([
        getLatestReadings(),
        getReadingsHistory('battery', 50),
        getReadingsHistory('temperature', 50),
        getReadingsHistory('distance', 50),
        getRules().catch(() => ({ rules: [] })),
        getSimulatorStatus().catch(() => null),
        getIncidents(10).catch(() => ({ incidents: [] }))
      ]);

      if (!isMountedRef.current) return;

      setLatest(latestData?.readings || {});
      // Invert back to chronological order (oldest -> newest) for accurate left-to-right charts
      setHistory({
        battery: (batteryHist?.readings || []).slice().reverse(),
        temperature: (tempHist?.readings || []).slice().reverse(),
        distance: (distHist?.readings || []).slice().reverse()
      });
      setRules(rulesData?.rules || []);
      setSimulatorStatus(simData);
      setIncidents(incData?.incidents || []);
      setIsConnected(true);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      if (!isMountedRef.current) return;
      setIsConnected(false);
      setError(err.message || 'Telemetry connection failed');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchTelemetry();

    const intervalId = setInterval(fetchTelemetry, intervalMs);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [fetchTelemetry, intervalMs]);

  return {
    latest,
    history,
    rules,
    incidents,
    simulatorStatus,
    isConnected,
    isLoading,
    lastUpdated,
    error,
    refresh: fetchTelemetry
  };
}

