import React, { useState } from 'react';
import { Cpu, Flame, BatteryWarning, AlertOctagon, PowerOff, CheckCircle } from 'lucide-react';
import { setSimulatorMode } from '../services/api';

const MODES = [
  {
    id: 'normal',
    label: 'Normal Operations',
    description: 'Autonomous patrol within nominal parameter envelopes.',
    tooltip: 'DEMO: Stabilizes Battery, Temperature, and Distance to safe levels.',
    icon: CheckCircle,
    color: 'hover:border-cyan-500/60',
    activeStyle: 'bg-cyan-950/70 border-cyan-500 text-cyan-300'
  },
  {
    id: 'battery_drain',
    label: 'Battery Drain',
    description: 'Rapid power draw dropping level under critical 20%.',
    tooltip: 'DEMO: Triggers CRITICAL Battery < 20% alert and card red glow.',
    icon: BatteryWarning,
    color: 'hover:border-rose-500/60',
    activeStyle: 'bg-rose-950/70 border-rose-500 text-rose-300'
  },
  {
    id: 'overheat',
    label: 'Overheating',
    description: 'Thermal runaway spiking core temperature > 45°C.',
    tooltip: 'DEMO: Triggers WARNING Temperature > 45°C thermal alert.',
    icon: Flame,
    color: 'hover:border-amber-500/60',
    activeStyle: 'bg-amber-950/70 border-amber-500 text-amber-300'
  },
  {
    id: 'obstacle',
    label: 'Obstacle Hazard',
    description: 'Sudden obstruction triggering critical < 10 cm proximity.',
    tooltip: 'DEMO: Triggers CRITICAL Distance < 10cm sonar collision alert.',
    icon: AlertOctagon,
    color: 'hover:border-rose-500/60',
    activeStyle: 'bg-rose-950/70 border-rose-500 text-rose-300'
  },
  {
    id: 'offline',
    label: 'Robot Offline',
    description: 'Halts telemetry stream to simulate link disconnection.',
    tooltip: 'DEMO: Halts ticker ticks to simulate telemetry loss / freeze.',
    icon: PowerOff,
    color: 'hover:border-slate-500/60',
    activeStyle: 'bg-slate-800 border-slate-600 text-slate-300'
  }
];

export default function SimulatorControls({ currentMode = 'normal', onModeChanged }) {
  const [switching, setSwitching] = useState(false);

  const handleModeSelect = async (modeId) => {
    if (modeId === currentMode || switching) return;
    setSwitching(true);
    try {
      await setSimulatorMode(modeId);
      if (onModeChanged) onModeChanged();
    } catch (err) {
      console.error('Failed to change simulator mode:', err);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 md:p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
            Simulator Fault Injection Console
          </h3>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="text-slate-500">CURRENT MODE:</span>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${
              currentMode === 'normal'
                ? 'bg-cyan-950/60 text-cyan-400 border-cyan-500/40'
                : 'bg-rose-950/60 text-rose-400 border-rose-500/40 animate-pulse'
            }`}
          >
            {currentMode.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;

          return (
            <button
              key={mode.id}
              disabled={switching}
              onClick={() => handleModeSelect(mode.id)}
              title={mode.tooltip}
              className={`p-3.5 rounded-lg border text-left transition flex flex-col justify-between cursor-pointer group ${
                isActive
                  ? `${mode.activeStyle} shadow-lg ring-1 ring-cyan-500/30`
                  : `bg-slate-950/80 border-slate-800/80 text-slate-300 ${mode.color} hover:bg-slate-900`
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-tight">
                    {mode.label}
                  </span>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'opacity-100' : 'text-slate-500'}`} />
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                  {mode.description}
                </p>
                <div className="mt-2 text-[9px] font-mono text-cyan-400/80 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity">
                  {mode.tooltip}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-900/60 text-[10px] font-mono flex items-center justify-between">
                <span className="text-slate-500">STATE:</span>
                <span className={isActive ? 'font-bold' : 'text-slate-500'}>
                  {isActive ? 'ACTIVE' : 'READY'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
