import React from 'react';

interface Participant {
  id: string;
  name: string;
  team: string;
  rollNumber: string;
  inside: boolean;
  remainingShort: number;
  sleepUsed: boolean;
  qrId: string;
}

interface Props {
  data: Participant[];
}

const ParticipantTable: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 font-semibold text-slate-600">Name</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Team</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Roll No</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
              <th className="px-6 py-4 font-semibold text-slate-600 hidden md:table-cell">Short Breaks left</th>
              <th className="px-6 py-4 font-semibold text-slate-600 hidden lg:table-cell">Sleep Used</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{p.name}</td>
                <td className="px-6 py-4 text-slate-600">{p.team}</td>
                <td className="px-6 py-4 text-slate-600">{p.rollNumber}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${p.inside ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {p.inside ? 'Inside' : 'Outside'}
                  </span>
                </td>
                <td className="px-6 py-4 hidden md:table-cell text-slate-600 text-center">
                  <span className={`font-mono ${p.remainingShort === 0 ? 'text-amber-600 font-bold' : ''}`}>{p.remainingShort}</span>/3
                </td>
                <td className="px-6 py-4 hidden lg:table-cell">
                  {p.sleepUsed ? (
                    <span className="text-amber-600 font-medium">Yes</span>
                  ) : (
                     <span className="text-slate-400">No</span>
                  )}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
               <tr>
                 <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No participants found.</td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <p className="text-xs text-slate-500">Showing {data.length} entries</p>
      </div>
    </div>
  );
};

export default ParticipantTable;
