import React, { useState, useEffect } from 'react';
import { api } from '../../api/api';
import { Settings as SettingsIcon, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SettingsPanel: React.FC = () => {
  const [maxShortBreaks, setMaxShortBreaks] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.getSettings();
        if (res.success && res.data) {
          setMaxShortBreaks(res.data.maxShortBreaks ?? 3);
        }
      } catch (err) {
         toast.error("Failed to load settings");
      } finally {
         setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await api.updateSettings({ maxShortBreaks });
      if (res.success) {
         toast.success('Rules updated successfully');
      } else {
         toast.error('Failed to update rules');
      }
    } catch (err) {
       toast.error('Network error while saving settings');
    } finally {
       setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
         <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
           <SettingsIcon className="w-5 h-5" />
         </div>
         <div>
           <h2 className="text-lg font-bold text-slate-800">Rule Engine Configuration</h2>
           <p className="text-sm text-slate-500">Dynamically update hackathon constraints applied at the entry scanners.</p>
         </div>
      </div>

      <div className="space-y-6">
         <div className="flex flex-col gap-2">
           <label className="text-sm font-semibold text-slate-700">Maximum Allowed Short Breaks</label>
           <p className="text-xs text-slate-500">Participants exceeding this cumulative number of short breaks will be flagged upon entry.</p>
           <div className="flex items-center gap-4 mt-2">
             <input 
               type="number" 
               min="1" 
               max="20" 
               value={maxShortBreaks}
               onChange={(e) => setMaxShortBreaks(parseInt(e.target.value) || 3)}
               className="w-24 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-center"
             />
             <span className="text-sm font-medium text-slate-600">breaks per participant</span>
           </div>
         </div>

         <div className="pt-6 mt-6 border-t border-slate-100">
           <button 
             onClick={handleSave}
             disabled={isSaving}
             className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
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
