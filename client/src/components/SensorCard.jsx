import React from 'react';
import { BatteryCharging, Thermometer, Navigation, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function SensorCard({
  sensorKey,
  title,
  unit,
  reading,
  rule,
  isLoading
}) {
  const value = reading?.value;

  // Evaluate rule condition if rule is present
  const isViolated = React.useMemo(() => {
    if (value === undefined || value === null || !rule || !rule.enabled) return false;
    const { operator, threshold } = rule;
    if (operator === '<') return value < threshold;
    if (operator === '>') return value > threshold;
    if (operator === '<=') return value <= threshold;
    if (operator === '>=') return value >= threshold;
    if (operator === '==' || operator === '===') return value === threshold;
    return false;
  }, [value, rule]);

  // Determine severity and visual state
  const severity = isViolated ? (rule?.severity || 'CRITICAL') : 'NORMAL';

  // Sensor Icons
  const getIcon = () => {
    switch (sensorKey) {
      case 'battery':
        return <BatteryCharging className="w-5 h-5" />;
      case 'temperature':
        return <Thermometer className="w-5 h-5" />;
      case 'distance':
        return <Navigation className="w-5 h-5" />;
      default:
        return <CheckCircle2 className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="h-4 bg-slate-800 rounded w-1/3"></div>
          <div className="h-6 w-6 bg-slate-800 rounded-full"></div>
        </div>
        <div className="h-10 bg-slate-800 rounded w-1/2 mb-3"></div>
        <div className="h-3 bg-slate-800 rounded w-2/3"></div>
      </div>
    );
  }

  // Dynamic Border and Glow styles
  const cardBorderClass = isViolated
    ? severity === 'CRITICAL'
      ? 'border-rose-500/80 bg-rose-950/20 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
      : 'border-amber-500/80 bg-amber-950/20 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
    : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 shadow-lg';

  const badgeClass = isViolated
    ? severity === 'CRITICAL'
      ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse'
      : 'bg-amber-500/20 text-amber-400 border-amber-500/50 animate-pulse'
    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

  const iconColor = isViolated
    ? severity === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'
    : 'text-cyan-400';

  return (
    <div className={`rounded-xl border p-5 transition-all duration-300 relative overflow-hidden backdrop-blur-sm ${cardBorderClass}`}>
      {/* Top row: Title and Icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className={`p-2 rounded-lg bg-slate-950 border border-slate-800 ${iconColor}`}>
            {getIcon()}
          </div>
          <div>
            <h3 className="text-xs font-mono font-medium tracking-wider uppercase text-slate-400">
              {title}
            </h3>
            <span className="text-[10px] font-mono text-slate-500">ID: {sensorKey.toUpperCase()}</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border flex items-center gap-1.5 ${badgeClass}`}>
          {isViolated ? (
            <>
              <AlertTriangle className="w-3 h-3" />
              <span>{severity}</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>NORMAL</span>
            </>
          )}
        </div>
      </div>

      {/* Center Value */}
      <div className="mt-5 flex items-baseline justify-between">
        <div className="flex items-baseline space-x-1.5">
          <span className="text-3xl md:text-4xl font-bold font-mono tracking-tight text-slate-100">
            {value !== undefined ? value : '--'}
          </span>
          <span className="text-sm font-mono text-slate-400">{unit}</span>
        </div>

        {/* Progress or bar indicator for battery / distance */}
        {sensorKey === 'battery' && value !== undefined && (
          <div className="w-24 bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                value < 20 ? 'bg-rose-500' : value < 50 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
          </div>
        )}
      </div>

      {/* Threshold / Condition footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-1">
          <span className="text-slate-500">Threshold:</span>
          {rule ? (
            <span className="text-slate-300">
              {rule.operator} {rule.threshold} {unit}
            </span>
          ) : (
            <span className="text-slate-600">None</span>
          )}
        </div>

        <div className="text-[10px] text-slate-500">
          {reading?.timestamp
            ? new Date(reading.timestamp).toLocaleTimeString()
            : '--:--:--'}
        </div>
      </div>
    </div>
  );
}

