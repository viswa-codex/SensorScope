import React from 'react';
import { Radio, Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function Navbar({ isConnected, lastUpdated, robotId = 'ROBOT #01', simulatorMode, onRefresh }) {
  const formatTime = (date) => {
    if (!date) return '--:--:--';
    return date.toTimeString().split(' ')[0];
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-4 md:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo / Brand */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold tracking-widest text-cyan-400">SENSOR SCOPE</span>
                <span className="text-slate-600 font-mono text-xs">//</span>
                <span className="font-mono text-xs text-slate-400 font-medium">TELEMETRY CONSOLE</span>
              </div>
              <p className="text-[10px] font-mono text-slate-500">Autonomous Telemetry & Sensory Diagnostics</p>
            </div>
          </div>

          {/* Mobile indicator */}
          <div className="md:hidden flex items-center gap-2 font-mono text-xs">
            {isConnected ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-400 animate-ping" />
                ONLINE
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-950/60 text-rose-400 border border-rose-500/30">
                OFFLINE
              </span>
            )}
          </div>
        </div>

        {/* Center / Mode indicator */}
        {simulatorMode && (
          <div className="hidden lg:flex items-center gap-2 font-mono text-xs px-3 py-1 rounded bg-slate-950/80 border border-slate-800">
            <span className="text-slate-400 uppercase">SIM MODE:</span>
            <span className={`font-semibold uppercase ${
              simulatorMode === 'normal' 
                ? 'text-cyan-400' 
                : 'text-amber-400 animate-pulse'
            }`}>
              {simulatorMode}
            </span>
          </div>
        )}

        {/* Status Indicators */}
        <div className="flex items-center space-x-4 w-full md:w-auto justify-end">
          <div className="hidden md:flex items-center space-x-2 font-mono text-xs">
            <span className="text-slate-400">{robotId}</span>
            <span className="text-slate-700">|</span>
            {isConnected ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 mr-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                LINK ACTIVE
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-rose-950/60 text-rose-400 border border-rose-500/30">
                <WifiOff className="w-3.5 h-3.5 mr-1 text-rose-400" />
                DISCONNECTED
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 text-slate-400 font-mono text-xs bg-slate-950 px-3 py-1 rounded border border-slate-800">
            <span>SYNC:</span>
            <span className="text-slate-200">{formatTime(lastUpdated)}</span>
            {onRefresh && (
              <button 
                onClick={onRefresh}
                title="Force Refresh"
                className="ml-1 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

