import React, { useState } from 'react';
import { api } from '../../api/api';
import { Loader2, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQrId?: string | null;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, initialQrId }) => {
  const [formData, setFormData] = useState({
    qrId: initialQrId || '',
    name: '',
    teamName: '',
    teamId: '',
    rollNumber: '',
    mobile: '',
    hostel: 'Hostel 1',
  });
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // teamId and teamName might be the same if solo, but let's just submit
      const payload = {
        ...formData,
        teamId: formData.teamId || 'TEAM-X',
        teamName: formData.teamName || 'Solo',
      };
      const res = await api.register(payload);
      if (res.success) {
        toast.success('Participant registered successfully!');
        onClose();
      } else {
        toast.error(res.error || res.message || 'Registration failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in">
      <div className="bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-800">
          <h2 className="text-lg font-bold flex items-center gap-2"><UserPlus className="w-5 h-5 text-blue-400" /> Register Participant</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">QR Code ID</label>
            <input required name="qrId" value={formData.qrId} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 font-mono" placeholder="Scan or type..." />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Full Name</label>
            <input required name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500" placeholder="Jane Doe" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Roll Number</label>
              <input required name="rollNumber" value={formData.rollNumber} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 uppercase" placeholder="123456" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Mobile</label>
              <input required name="mobile" value={formData.mobile} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500" placeholder="9876543210" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Team Name</label>
              <input name="teamName" value={formData.teamName} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500" placeholder="Optional" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Hostel</label>
              <select name="hostel" value={formData.hostel} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500">
                <option>Hostel 1</option>
                <option>Hostel 2</option>
                <option>Hostel 3</option>
                <option>Hostel 4</option>
                <option>Day Scholar</option>
              </select>
            </div>
          </div>
          
          <button disabled={isLoading} type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 mt-4 rounded-xl disabled:opacity-50">
            {isLoading ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;
