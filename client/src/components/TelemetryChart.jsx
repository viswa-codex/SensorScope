import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Activity, BatteryCharging, Thermometer, Navigation, Download, Check } from 'lucide-react';
import { downloadTelemetryCSV } from '../services/api';

const SENSOR_META = {
  battery: {
    name: 'Battery Level',
    unit: '%',
    stroke: '#10b981', // emerald
    gradientId: 'batteryGrad',
    icon: BatteryCharging,
    domain: [0, 100]
  },
  temperature: {
    name: 'Internal Temperature',
    unit: '°C',
    stroke: '#f59e0b', // amber
    gradientId: 'tempGrad',
    icon: Thermometer,
    domain: ['auto', 'auto']
  },
  distance: {
    name: 'Proximity Distance',
    unit: 'cm',
    stroke: '#06b6d4', // cyan
    gradientId: 'distGrad',
    icon: Navigation,
    domain: [0, 150]
  }
};

export default function TelemetryChart({ history, rules }) {
  const [activeSensor, setActiveSensor] = useState('battery');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const meta = SENSOR_META[activeSensor] || SENSOR_META.battery;
  const rawData = history[activeSensor] || [];

  // Active rule for the current sensor to draw threshold line
  const activeRule = (rules || []).find(
    (r) => r.sensor?.toLowerCase() === activeSensor && r.enabled
  );

  // Format data for chart display
  const chartData = rawData.map((d) => ({
    time: d.timestamp ? new Date(d.timestamp).toLocaleTimeString() : '',
    value: d.value,
    robotId: d.robotId
  }));

  const handleExportCSV = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    try {
      await downloadTelemetryCSV(150);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const isOver = activeRule && (
        (activeRule.operator === '<' && val < activeRule.threshold) ||
        (activeRule.operator === '>' && val > activeRule.threshold)
      );

      return (
        <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-lg shadow-xl font-mono text-xs">
          <p className="text-slate-400 mb-1">Time: {label}</p>
          <p className="text-slate-200 flex items-center gap-1.5 font-semibold">
            <span>{meta.name}:</span>
            <span className={isOver ? 'text-rose-400' : 'text-cyan-400'}>
              {val} {meta.unit}
            </span>
          </p>
          {activeRule && (
            <p className="text-[10px] text-slate-500 mt-1">
              Rule Limit: {activeRule.operator} {activeRule.threshold} {meta.unit}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 md:p-5 shadow-xl backdrop-blur-sm">
      {/* Header with Sensor Switcher Tabs and CSV Export */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-xs md:text-sm font-mono font-semibold tracking-wider text-slate-200 uppercase">
              Telemetry Waveform &bull; {meta.name}
            </h2>
          </div>
          <span className="text-[10px] font-mono bg-slate-950 text-slate-500 px-2 py-0.5 rounded border border-slate-800">
            LAST 50 TICKS
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
          {/* Sensor selection buttons */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            {Object.entries(SENSOR_META).map(([key, config]) => {
              const Icon = config.icon;
              const isSelected = activeSensor === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveSensor(key)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-slate-800 text-cyan-400 font-semibold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="capitalize">{key}</span>
                </button>
              );
            })}
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition cursor-pointer shadow-sm ${
              exportSuccess
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : 'bg-slate-950 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-cyan-300'
            }`}
            title="Download CSV telemetry snapshot"
          >
            {exportSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className={`w-3.5 h-3.5 text-cyan-400 shrink-0 ${isExporting ? 'animate-bounce' : ''}`} />
                <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 md:h-72 w-full mt-4">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 font-mono text-sm">
            Waiting for telemetry data points...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.8} />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={10}
                fontFamily="ui-monospace, monospace"
                tickLine={false}
                minTickGap={30}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                fontFamily="ui-monospace, monospace"
                domain={meta.domain}
                tickLine={false}
                unit={meta.unit}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Threshold reference line if rule exists */}
              {activeRule && (
                <ReferenceLine
                  y={activeRule.threshold}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{
                    value: `ALERT: ${activeRule.operator} ${activeRule.threshold}${meta.unit}`,
                    fill: '#f87171',
                    fontSize: 10,
                    fontFamily: 'ui-monospace, monospace',
                    position: 'insideTopRight'
                  }}
                />
              )}

              <Line
                type="monotone"
                dataKey="value"
                stroke={meta.stroke}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: meta.stroke, stroke: '#0f172a', strokeWidth: 2 }}
                isAnimationActive={false} // Disable laggy SVG animations on rapid 2s ticks
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
