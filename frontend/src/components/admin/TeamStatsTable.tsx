import React from 'react';

interface TeamStat {
  teamName: string;
  totalMembers: number;
  currentlyInside: number;
  sleepBreaksTaken: number;
}

interface Props {
  data: TeamStat[];
  onTeamClick?: (teamName: string) => void;
}

const TeamStatsTable: React.FC<Props> = ({ data, onTeamClick }) => {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 font-semibold text-slate-600">Team Name</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Total Members</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Currently Inside</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Sleep Breaks (Total)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((team, idx) => (
              <tr 
                key={idx} 
                className={`transition-colors ${onTeamClick ? 'hover:bg-slate-50 cursor-pointer' : 'hover:bg-slate-50/50'}`}
                onClick={() => onTeamClick?.(team.teamName)}
              >
                <td className="px-6 py-4 font-bold text-slate-900">{team.teamName}</td>
                <td className="px-6 py-4 text-slate-600">{team.totalMembers}</td>
                <td className="px-6 py-4 text-slate-600">{team.currentlyInside}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${team.currentlyInside === team.totalMembers ? 'bg-emerald-100 text-emerald-700' : team.currentlyInside === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                    {team.currentlyInside === team.totalMembers ? 'All Present' : team.currentlyInside === 0 ? 'All Outside' : 'Partial'}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600 font-mono">
                  {team.sleepBreaksTaken}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
               <tr>
                 <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No teams found.</td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamStatsTable;
