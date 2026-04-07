import React, { useState } from 'react';
import QRScannerCamera from '../components/scanner/QRScannerCamera';
import ScanResultOverlay from '../components/scanner/ScanResultOverlay';
import RegisterModal from '../components/scanner/RegisterModal';
import { api, type ActionType, type BreakType, type ScanResult } from '../api/api';
import { LogIn, LogOut, Coffee, Moon, Scan } from 'lucide-react';

const ScannerPage: React.FC = () => {
  const [mode, setMode] = useState<ActionType>('ENTRY');
  const [breakType, setBreakType] = useState<BreakType>('NONE');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [unknownQrId, setUnknownQrId] = useState<string | null>(null);

  const handleScan = async (data: string) => {
    if (isLoading || result) return;
    setIsLoading(true);
    
    try {
      let res: ScanResult;
      switch (mode) {
        case 'INITIAL':
          res = await api.initialScan(data);
          break;
        case 'EXIT':
          if (breakType === 'NONE') {
             // Default to SHORT for safety if they didn't pick
             res = await api.exitScan(data, 'SHORT');
          } else {
             res = await api.exitScan(data, breakType);
          }
          break;
        case 'ENTRY':
        default:
          res = await api.entryScan(data);
          break;
      }
      
      if (!res.success && res.message?.includes('not found')) {
        setUnknownQrId(data);
        setIsRegisterOpen(true);
        setResult(null);
      } else {
        setResult(res);
      }
    } catch (err: any) {
      setResult({
        success: false,
        data: { qrId: data },
        message: err.message || 'Network error.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearResult = () => setResult(null);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-slate-900 text-white w-full max-w-md mx-auto relative overflow-hidden">
      {/* Header */}
      <header className="px-5 py-4 bg-slate-800 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-xl font-bold tracking-tight">ByteVerse</h1>
          <p className="text-sm text-slate-400">Scanner App</p>
        </div>
        <Scan className="text-blue-400 w-7 h-7" />
      </header>

      {/* Camera Area */}
      <div className="p-4 flex-1 flex flex-col justify-center min-h-0">
        <div className="w-full h-full relative flex items-center mb-2">
           <QRScannerCamera onScan={handleScan} isLoading={isLoading} />
        </div>
      </div>

      {/* Controls Area */}
      <div className="flex-none px-4 pb-8 pt-2 space-y-4">
        <div className="bg-slate-800 p-2 rounded-2xl flex space-x-2">
          <ModeToggle 
             icon={<Scan size={20} />} label="Initial" 
             isActive={mode === 'INITIAL'} onClick={() => setMode('INITIAL')} 
          />
          <ModeToggle 
             icon={<LogIn size={20} />} label="Entry" 
             isActive={mode === 'ENTRY'} onClick={() => setMode('ENTRY')} 
          />
          <ModeToggle 
             icon={<LogOut size={20} />} label="Exit" 
             isActive={mode === 'EXIT'} onClick={() => { setMode('EXIT'); setBreakType('SHORT'); }} 
          />
        </div>

        {mode === 'EXIT' && (
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-200">
            <h3 className="text-xs font-semibold text-slate-400 mb-2 ml-2 uppercase tracking-wider">Select Break Type</h3>
            <div className="grid grid-cols-2 gap-3">
               <button 
                 onClick={() => setBreakType('SHORT')}
                 className={`flex flex-col items-center py-4 px-2 rounded-xl border-2 transition-colors active:scale-95 ${breakType === 'SHORT' ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-inner' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
               >
                 <Coffee className="mb-2 w-6 h-6" />
                 <span className="font-bold text-sm">Short Break</span>
               </button>
               <button 
                 onClick={() => setBreakType('SLEEP')}
                 className={`flex flex-col items-center py-4 px-2 rounded-xl border-2 transition-colors active:scale-95 ${breakType === 'SLEEP' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-inner' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
               >
                 <Moon className="mb-2 w-6 h-6" />
                 <span className="font-bold text-sm">Sleep Break</span>
               </button>
            </div>
          </div>
        )}
        
        <div className="text-center mt-4 h-6">
          <p className="text-slate-400 text-sm font-medium animate-pulse">
            {mode === 'ENTRY' ? "Waiting for Entry QR scan..." 
             : mode === 'INITIAL' ? "Waiting for Registration QR scan..."
             : "Select break type and scan to Exit..."}
          </p>
        </div>
      </div>

      <ScanResultOverlay 
        result={result} 
        onClear={clearResult} 
        onRegister={() => setIsRegisterOpen(true)} 
      />
      {isRegisterOpen && (
        <RegisterModal 
          isOpen={isRegisterOpen} 
          onClose={() => {
            setIsRegisterOpen(false);
            setUnknownQrId(null);
          }} 
          initialQrId={unknownQrId || result?.data?.qrId} 
        />
      )}
    </div>
  );
};

const ModeToggle = ({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex flex-col items-center py-4 rounded-xl transition-all active:scale-95 ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'}`}
  >
    {icon}
    <span className="text-[10px] sm:text-xs font-bold mt-1.5 uppercase tracking-wider">{label}</span>
  </button>
);

export default ScannerPage;
