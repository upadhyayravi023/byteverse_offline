import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';
import { Settings as SettingsIcon, Save, Loader2, Coffee, Moon, Hash, Timer } from 'lucide-react';
import { toast } from 'sonner';

interface RulesConfig {
  maxShortBreaks: number;
  maxShortBreakDurationMins: number;
  maxSleepBreakDurationMins: number;
}

const FIELD_CLASS = "w-24 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-center text-sm bg-white shadow-sm";

const SettingsPanel: React.FC = () => {
  const [config, setConfig] = useState<RulesConfig>({
    maxShortBreaks: 3,
    maxShortBreakDurationMins: 30,
    maxSleepBreakDurationMins: 240,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.getSettings();
        if (res.success && res.data) {
          setConfig({
            maxShortBreaks:            res.data.maxShortBreaks            ?? 3,
            maxShortBreakDurationMins: res.data.maxShortBreakDurationMins ?? 30,
            maxSleepBreakDurationMins: res.data.maxSleepBreakDurationMins ?? 240,
          });
        }
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await api.updateSettings(config);
      if (res.success) {
        toast.success('Rules updated successfully!');
      } else {
        toast.error('Failed to update rules');
      }
    } catch {
      toast.error('Network error while saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const setField = (field: keyof RulesConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({ ...prev, [field]: parseInt(e.target.value) || 0 }));
  };

  if (isLoading) {
    return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pb-5 border-b border-slate-100">
        <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Rule Engine Configuration</h2>
          <p className="text-sm text-slate-500 mt-0.5">Set break limits applied at entry scanners. Changes take effect immediately.</p>
        </div>
      </div>

      <div className="space-y-8">

        {/* ── Short Break Section ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Coffee className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Short Break Rules</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 pl-6">

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-600">
                <Hash className="w-3.5 h-3.5" />
                <label className="text-sm font-semibold">Maximum Count</label>
              </div>
              <p className="text-xs text-slate-400">How many short breaks a participant can take in total.</p>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={config.maxShortBreaks}
                  onChange={setField('maxShortBreaks')}
                  className={FIELD_CLASS}
                />
                <span className="text-sm text-slate-500 font-medium">breaks</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-600">
                <Timer className="w-3.5 h-3.5" />
                <label className="text-sm font-semibold">Max Duration Per Break</label>
              </div>
              <p className="text-xs text-slate-400">If a break exceeds this, it is flagged as a violation on re-entry.</p>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="number"
                  min={1}
                  max={480}
                  value={config.maxShortBreakDurationMins}
                  onChange={setField('maxShortBreakDurationMins')}
                  className={FIELD_CLASS}
                />
                <span className="text-sm text-slate-500 font-medium">minutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sleep Break Section ── */}
        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Moon className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Sleep Break Rules</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 pl-6">

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-600">
                <Hash className="w-3.5 h-3.5" />
                <label className="text-sm font-semibold">Maximum Count</label>
              </div>
              <p className="text-xs text-slate-400">Only <strong>1</strong> sleep break is allowed per participant (fixed rule).</p>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="number"
                  value={1}
                  disabled
                  className={`${FIELD_CLASS} opacity-40 cursor-not-allowed`}
                />
                <span className="text-sm text-slate-400 font-medium">break (fixed)</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-600">
                <Timer className="w-3.5 h-3.5" />
                <label className="text-sm font-semibold">Max Duration Per Break</label>
              </div>
              <p className="text-xs text-slate-400">If sleep break exceeds this, it flags a violation on re-entry.</p>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="number"
                  min={30}
                  max={720}
                  value={config.maxSleepBreakDurationMins}
                  onChange={setField('maxSleepBreakDurationMins')}
                  className={FIELD_CLASS}
                />
                <span className="text-sm text-slate-500 font-medium">minutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-6 border-t border-slate-100">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
