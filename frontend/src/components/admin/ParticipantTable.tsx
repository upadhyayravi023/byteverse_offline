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
  onParticipantClick?: (qrId: string) => void;
}

const ParticipantTable: React.FC<Props> = ({ data, onParticipantClick }) => {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-sm">

      {/* ── Mobile Card View (< md) ─────────────────────────────── */}
      <div className="md:hidden divide-y divide-slate-100">
        {data.length === 0 && (
          <p className="px-4 py-8 text-center text-slate-400 text-sm">No participants found.</p>
        )}
        {data.map((p) => (
          <div key={p.id} onClick={() => onParticipantClick && onParticipantClick(p.qrId)} className="flex items-start gap-3 px-4 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors active:bg-slate-100">
            {/* Status dot */}
            <span className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${p.inside ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                <span className={`inline-flex shrink-0 items-center px-2 py-0.5 rounded-full text-xs font-semibold
                  ${p.inside ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {p.inside ? 'Inside' : 'Outside'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{p.team} &middot; {p.rollNumber}</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 font-medium">
                <span>Short breaks left: <span className={p.remainingShort === 0 ? 'text-amber-600 font-bold' : 'text-slate-600'}>{p.remainingShort}</span>/3</span>
                <span>&middot;</span>
                <span>Sleep: <span className={p.sleepUsed ? 'text-amber-600 font-bold' : 'text-slate-400'}>{p.sleepUsed ? 'Used' : 'Available'}</span></span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop Table View (≥ md) ───────────────────────────── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-5 py-3.5 font-semibold text-slate-600">Name</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600">Team</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600">Roll No</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600">Status</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600">Breaks left</th>
              <th className="px-5 py-3.5 font-semibold text-slate-600 hidden lg:table-cell">Sleep</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((p) => (
              <tr key={p.id} onClick={() => onParticipantClick && onParticipantClick(p.qrId)} className="hover:bg-slate-50/80 transition-colors cursor-pointer group">
                <td className="px-5 py-3.5 font-medium text-slate-900">{p.name}</td>
                <td className="px-5 py-3.5 text-slate-600">{p.team}</td>
                <td className="px-5 py-3.5 text-slate-600">{p.rollNumber}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                    ${p.inside ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {p.inside ? 'Inside' : 'Outside'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-600 text-center">
                  <span className={`font-mono ${p.remainingShort === 0 ? 'text-amber-600 font-bold' : ''}`}>{p.remainingShort}</span>/3
                </td>
                <td className="px-5 py-3.5 hidden lg:table-cell">
                  {p.sleepUsed
                    ? <span className="text-amber-600 font-medium">Used</span>
                    : <span className="text-slate-400">–</span>}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">No participants found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
        <p className="text-xs text-slate-400">Showing {data.length} {data.length === 1 ? 'entry' : 'entries'}</p>
      </div>
    </div>
  );
};

export default ParticipantTable;
