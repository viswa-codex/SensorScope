import React, { useState } from 'react';
import { ShieldAlert, Trash2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { clearIncidents } from '../services/api';

export default function IncidentLog({ incidents = [], onRefresh }) {
  const [clearing, setClearing] = useState(false);

  const handleClear = async () => {
    setClearing(true);
    try {
      await clearIncidents();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to clear incidents:', err);
    } finally {
      setClearing(false);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'WARNING':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'INFO':
      default:
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
            Real-Time Incident Log
          </h3>
          <span className="text-[10px] font-mono bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
            TOTAL: {incidents.length}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {incidents.length > 0 && (
            <button
              onClick={handleClear}
              disabled={clearing}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 text-xs font-mono transition cursor-pointer border border-slate-700/60"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition cursor-pointer border border-slate-700/60"
              title="Refresh Incidents"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Incident List */}
      <div className="flex-1 overflow-y-auto max-h-80 pr-1 space-y-2">
        {incidents.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/80 mb-2" />
            <p className="text-xs font-mono text-slate-300 font-medium">
              No active incidents.
            </p>
            <p className="text-[11px] font-mono text-slate-500 mt-0.5">
              Robot operating within safe telemetry parameters.
            </p>
          </div>
        ) : (
          incidents.map((incident) => {
            const timeStr = incident.timestamp
              ? new Date(incident.timestamp).toLocaleTimeString()
              : '--:--:--';

            return (
              <div
                key={incident.id}
                className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-2 font-mono text-xs"
              >
                {/* Left: Severity badge, sensor, condition */}
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getSeverityBadge(
                      incident.severity
                    )}`}
                  >
                    {incident.severity}
                  </span>

                  <div>
                    <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                      <span className="uppercase text-cyan-400">{incident.sensor}</span>
                      <span className="text-slate-500">&bull;</span>
                      <span>Observed: {incident.observedValue}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Rule Violation: {incident.sensor} {incident.operator} {incident.threshold}
                    </div>
                  </div>
                </div>

                {/* Right: Timestamp & Robot ID */}
                <div className="flex md:flex-col md:items-end justify-between text-[11px] text-slate-500 shrink-0">
                  <span className="text-slate-400">{timeStr}</span>
                  <span className="text-[10px]">{incident.robotId || 'ROBOT #01'}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

