import { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, RefreshCw, Search } from 'lucide-react';

const ACTION_LABELS = {
  LOGIN: { label: 'Login', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  LOAN_CREATE: { label: 'Loan Created', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  LOAN_UPDATE: { label: 'Loan Updated', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  LOAN_DELETE: { label: 'Loan Deleted', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  LOAN_RENEW: { label: 'Loan Renewed', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  INTEREST_PAYMENT: { label: 'Interest Paid', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  PART_PAYMENT: { label: 'Part Payment', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
};

const AuditLog = ({ currentBranch, isSuperAdmin }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const params = isSuperAdmin ? `role=super_admin&limit=200` : `branchId=${currentBranch.id}&limit=200`;
      const res = await axios.get(`${apiUrl}/audit-logs?${params}`);
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const filtered = logs.filter(l => {
    const term = search.toLowerCase();
    return (
      l.action?.toLowerCase().includes(term) ||
      l.entity_id?.toLowerCase().includes(term) ||
      l.branch_name?.toLowerCase().includes(term) ||
      JSON.stringify(l.details || {}).toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Shield className="text-cyan-400" size={32} />
            Audit Log
          </h1>
          <p className="text-slate-400 font-medium mt-1">{filtered.length} activity records</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by action, loan ID, branch..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-slate-600"
            />
          </div>
          <button onClick={fetchLogs} className="p-3 bg-slate-800 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center text-slate-500 font-bold">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-slate-500 font-bold">No activity records found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-800/30 text-slate-500 border-b border-white/5">
                <tr>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Time</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Action</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Loan / Entity</th>
                  {isSuperAdmin && <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Branch</th>}
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(log => {
                  const meta = ACTION_LABELS[log.action] || { label: log.action, color: 'text-slate-400 bg-slate-800/50 border-slate-700' };
                  const details = log.details || {};
                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-all">
                      <td className="px-8 py-5 text-slate-400 text-sm font-medium whitespace-nowrap">
                        {new Date(log.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                        <div className="text-slate-600 text-xs mt-0.5">
                          {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-8 py-5 font-bold text-blue-400 text-sm">{log.entity_id || '—'}</td>
                      {isSuperAdmin && <td className="px-8 py-5 text-slate-400 text-sm">{log.branch_name || '—'}</td>}
                      <td className="px-8 py-5 text-slate-400 text-xs font-medium">
                        {Object.entries(details).map(([k, v]) => (
                          <span key={k} className="inline-block mr-3">
                            <span className="text-slate-600">{k}: </span>
                            <span className="text-slate-300">{String(v)}</span>
                          </span>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
