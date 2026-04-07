import React from 'react';
import { Search, Filter, XCircle } from 'lucide-react';

export type FilterStatusType = 'ALL' | 'INSIDE' | 'OUTSIDE';
export type FilterViolationType = 'ALL' | 'ONLY_VIOLATORS';

interface FilterControlsProps {
  search: string;
  setSearch: (val: string) => void;
  status: FilterStatusType;
  setStatus: (val: FilterStatusType) => void;
  violation: FilterViolationType;
  setViolation: (val: FilterViolationType) => void;
  className?: string;
}

const FilterControls: React.FC<FilterControlsProps> = ({ 
  search, setSearch, status, setStatus, violation, setViolation, className = "" 
}) => {
  const hasFilters = search !== '' || status !== 'ALL' || violation !== 'ALL';

  return (
    <div className={`bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between transition-all duration-300 ${className}`}>
      
      {/* Search Bar - Takes priority */}
      <div className="relative w-full md:w-96 flex-shrink-0 group">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Search by Name, Team, or QR ID..."
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 hover:bg-white transition-all duration-300 shadow-inner"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex w-full md:w-auto items-center gap-3 overflow-x-auto pb-1 md:pb-0">
        <div className="flex items-center gap-2 text-slate-500 shrink-0">
           <Filter className="w-4 h-4" />
           <span className="text-sm font-medium">Filter:</span>
        </div>

        <select 
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-white transition-all duration-200 cursor-pointer"
          value={status}
          onChange={(e) => setStatus(e.target.value as FilterStatusType)}
        >
          <option value="ALL">All Status</option>
          <option value="INSIDE">Inside Venue</option>
          <option value="OUTSIDE">Outside Venue</option>
        </select>

        <select 
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500/50 hover:bg-white transition-all duration-200 cursor-pointer"
          value={violation}
          onChange={(e) => setViolation(e.target.value as FilterViolationType)}
        >
          <option value="ALL">All Records</option>
          <option value="ONLY_VIOLATORS">Flags Only</option>
        </select>

        {hasFilters && (
          <button 
            onClick={() => { setSearch(''); setStatus('ALL'); setViolation('ALL'); }}
            className="flex items-center gap-1.5 shrink-0 px-3 py-2 text-sm font-medium text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all duration-200"
          >
            <XCircle className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

    </div>
  );
};

export default FilterControls;
