import React, { useState } from 'react';
import { Sliders, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { updateRule, resetRulesToDefault } from '../services/api';

const SENSOR_UNITS = {
  battery: '%',
  temperature: '°C',
  distance: 'cm'
};

export default function AlertRulesPanel({ rules = [], onRulesUpdated }) {
  const [editingValues, setEditingValues] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleInputChange = (ruleId, field, value) => {
    setEditingValues((prev) => ({
      ...prev,
      [ruleId]: {
        ...prev[ruleId],
        [field]: value
      }
    }));
  };

  const handleSave = async (rule) => {
    const draft = editingValues[rule.id] || {};
    const thresholdRaw = draft.threshold !== undefined ? draft.threshold : rule.threshold;
    const operator = draft.operator !== undefined ? draft.operator : rule.operator;
    const severity = draft.severity !== undefined ? draft.severity : rule.severity;

    const threshold = Number(thresholdRaw);

    // Client-side validations
    if (isNaN(threshold) || thresholdRaw === '') {
      setFeedback({ type: 'error', message: `Invalid threshold for ${rule.sensor}. Must be a valid number.` });
      return;
    }

    if (rule.sensor === 'battery' && (threshold < 0 || threshold > 100)) {
      setFeedback({ type: 'error', message: 'Battery threshold must be between 0% and 100%.' });
      return;
    }

    if (rule.sensor === 'distance' && threshold < 0) {
      setFeedback({ type: 'error', message: 'Distance threshold cannot be negative.' });
      return;
    }

    setSavingId(rule.id);
    setFeedback(null);

    try {
      await updateRule({
        id: rule.id,
        threshold,
        operator,
        severity
      });

      // Clear draft for this rule
      setEditingValues((prev) => {
        const next = { ...prev };
        delete next[rule.id];
        return next;
      });

      setFeedback({ type: 'success', message: `Rule for ${rule.sensor} updated successfully!` });
      if (onRulesUpdated) onRulesUpdated();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update rule.' });
    } finally {
      setSavingId(null);
    }
  };

  const handleResetDefaults = async () => {
    setIsResetting(true);
    setFeedback(null);
    try {
      await resetRulesToDefault();
      setEditingValues({});
      setFeedback({ type: 'success', message: 'All alert rules reset to factory defaults.' });
      if (onRulesUpdated) onRulesUpdated();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to reset rules.' });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
            Editable Alert Thresholds & Rules
          </h3>
        </div>
        <button
          onClick={handleResetDefaults}
          disabled={isResetting}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition cursor-pointer border border-slate-700/60"
        >
          <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
          <span>Reset Defaults</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`mb-4 p-2.5 rounded text-xs font-mono flex items-center space-x-2 border ${
            feedback.type === 'error'
              ? 'bg-rose-950/40 border-rose-800 text-rose-300'
              : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <Check className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Rules list */}
      <div className="space-y-3 font-mono text-xs">
        {rules.map((rule) => {
          const draft = editingValues[rule.id] || {};
          const currentThreshold = draft.threshold !== undefined ? draft.threshold : rule.threshold;
          const currentOp = draft.operator !== undefined ? draft.operator : rule.operator;
          const currentSeverity = draft.severity !== undefined ? draft.severity : rule.severity;
          const hasDraft =
            draft.threshold !== undefined ||
            draft.operator !== undefined ||
            draft.severity !== undefined;

          const unit = SENSOR_UNITS[rule.sensor] || '';

          return (
            <div
              key={rule.id}
              className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              {/* Sensor label */}
              <div className="w-36 shrink-0">
                <span className="font-semibold text-slate-200 uppercase tracking-wide">
                  {rule.sensor}
                </span>
                <span className="block text-[10px] text-slate-500 uppercase">RULE ID: {rule.id}</span>
              </div>

              {/* Controls: Operator, Threshold, Severity */}
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {/* Operator selector */}
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded px-1.5 py-1">
                  <span className="text-[10px] text-slate-400 mr-1.5">COND:</span>
                  <select
                    value={currentOp}
                    onChange={(e) => handleInputChange(rule.id, 'operator', e.target.value)}
                    className="bg-transparent text-cyan-400 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="<" className="bg-slate-900 text-slate-200">&lt; (less than)</option>
                    <option value=">" className="bg-slate-900 text-slate-200">&gt; (greater than)</option>
                    <option value="<=" className="bg-slate-900 text-slate-200">&lt;= (less or equal)</option>
                    <option value=">=" className="bg-slate-900 text-slate-200">&gt;= (greater or equal)</option>
                  </select>
                </div>

                {/* Threshold input */}
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded px-2 py-1">
                  <span className="text-[10px] text-slate-400 mr-1.5">LIMIT:</span>
                  <input
                    type="number"
                    step="any"
                    value={currentThreshold}
                    onChange={(e) => handleInputChange(rule.id, 'threshold', e.target.value)}
                    className="w-16 bg-transparent text-slate-100 font-bold focus:outline-none"
                  />
                  <span className="text-slate-400 ml-1">{unit}</span>
                </div>

                {/* Severity selector */}
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded px-1.5 py-1">
                  <span className="text-[10px] text-slate-400 mr-1.5">SEV:</span>
                  <select
                    value={currentSeverity}
                    onChange={(e) => handleInputChange(rule.id, 'severity', e.target.value)}
                    className={`bg-transparent font-semibold focus:outline-none cursor-pointer ${
                      currentSeverity === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  >
                    <option value="CRITICAL" className="bg-slate-900 text-rose-400">CRITICAL</option>
                    <option value="WARNING" className="bg-slate-900 text-amber-400">WARNING</option>
                    <option value="INFO" className="bg-slate-900 text-cyan-400">INFO</option>
                  </select>
                </div>
              </div>

              {/* Action Save button */}
              <button
                onClick={() => handleSave(rule)}
                disabled={savingId === rule.id || !hasDraft}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer flex items-center justify-center space-x-1 shrink-0 ${
                  hasDraft
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {savingId === rule.id ? (
                  <span>Saving...</span>
                ) : (
                  <span>Save Rule</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

