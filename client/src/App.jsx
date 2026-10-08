import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SensorCard from './components/SensorCard';
import TelemetryChart from './components/TelemetryChart';
import AlertRulesPanel from './components/AlertRulesPanel';
import IncidentLog from './components/IncidentLog';
import SimulatorControls from './components/SimulatorControls';
import { useTelemetry } from './hooks/useTelemetry';
import { Zap, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const {
    latest,
    history,
    rules,
    incidents,
    simulatorStatus,
    isConnected,
    isLoading,
    lastUpdated,
    error,
    refresh
  } = useTelemetry(2000);

  const [countdown, setCountdown] = useState(5);

  // Auto retry countdown when disconnected
  useEffect(() => {
    let timer;
    if (!isConnected && !isLoading) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            refresh();
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(5);
    }
    return () => clearInterval(timer);
  }, [isConnected, isLoading, refresh]);

  // Map sensor key to its active rule
  const getRuleForSensor = (sensorKey) => {
    return (rules || []).find((r) => r.sensor?.toLowerCase() === sensorKey.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Industrial Navbar */}
      <Navbar
        isConnected={isConnected}
        lastUpdated={lastUpdated}
        robotId={simulatorStatus?.robotId || 'ROBOT #01'}
        simulatorMode={simulatorStatus?.mode}
        onRefresh={refresh}
      />

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Connection Failure Alert Banner with Countdown */}
        {(!isConnected || error) && !isLoading && (
          <div className="bg-rose-950/50 border border-rose-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-200 shadow-xl shadow-rose-950/40">
            <div className="flex items-start sm:items-center space-x-3">
              <div className="p-2 rounded-lg bg-rose-900/60 border border-rose-700/60 shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide">Telemetry Uplink Disconnected</p>
                <p className="text-xs text-rose-300/90 font-mono mt-0.5">
                  {error || 'Unable to establish link with backend at http://localhost:5000/api.'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              <span className="text-xs font-mono text-rose-300/80">
                Retrying in <span className="font-bold text-rose-100">{countdown}s</span>
              </span>
              <button
                onClick={() => {
                  setCountdown(5);
                  refresh();
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-900/80 hover:bg-rose-800 border border-rose-600 rounded text-xs font-mono font-medium transition cursor-pointer shadow"
              >
                <RefreshCw className="w-3.5 h-3.5 text-rose-200" />
                <span>Retry Connection</span>
              </button>
            </div>
          </div>
        )}

        {/* Section 1: Simulator Fault Injection Control Panel */}
        <section>
          <SimulatorControls
            currentMode={simulatorStatus?.mode || 'normal'}
            onModeChanged={refresh}
          />
        </section>

        {/* Section 2: Live Sensor Cards */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Real-Time Sensory Telemetry
            </h2>
            <span className="text-[11px] font-mono text-slate-500">POLL: 2000ms</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SensorCard
              sensorKey="battery"
              title="Main Power Pack"
              unit="%"
              reading={latest?.battery}
              rule={getRuleForSensor('battery')}
              isLoading={isLoading}
            />

            <SensorCard
              sensorKey="temperature"
              title="Core Thermals"
              unit="°C"
              reading={latest?.temperature}
              rule={getRuleForSensor('temperature')}
              isLoading={isLoading}
            />

            <SensorCard
              sensorKey="distance"
              title="Sonar Proximity"
              unit="cm"
              reading={latest?.distance}
              rule={getRuleForSensor('distance')}
              isLoading={isLoading}
            />
          </div>
        </section>

        {/* Section 3: Telemetry Waveforms */}
        <section>
          <TelemetryChart history={history} rules={rules} />
        </section>

        {/* Section 4: Rules & Incidents Side-by-Side Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AlertRulesPanel rules={rules} onRulesUpdated={refresh} />
          <IncidentLog incidents={incidents} onRefresh={refresh} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-3.5 px-6 text-center text-xs text-slate-500 font-mono">
        SensorScope Robotics Telemetry Platform &bull; Autonomous Sensory Stream v1.0.0
      </footer>
    </div>
  );
}
