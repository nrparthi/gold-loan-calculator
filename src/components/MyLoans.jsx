import { useState, useEffect, useCallback } from 'react';
import { Search, FileText, Download, Edit3, AlertCircle, CalendarClock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import api, { getErrorMessage } from '../api';
import { useToastContext } from './Toast';
import { getNextDueDate } from '../utils/calculations';

const PAGE_SIZE = 25;
const today = new Date(); today.setHours(0, 0, 0, 0);

const MyLoans = ({ currentBranch, isSuperAdmin = false, onSelectLoan, refreshKey = 0 }) => {
  const { showError } = useToastContext();
  const [loans, setLoans] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [branchNames, setBranchNames] = useState([]);

  const fetchPage = useCallback(async (p) => {
    if (!currentBranch) return;
    setLoading(true);
    try {
      const params = {
        page: p,
        limit: PAGE_SIZE,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(isSuperAdmin ? { role: 'super_admin' } : { branchId: currentBranch.id }),
        ...(isSuperAdmin && branchFilter !== 'all' && { branchFilter }),
      };
      const res = await api.get('/loans', { params });
      setLoans(res.data.loans || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
      // Collect branch names for the filter dropdown
      if (isSuperAdmin) {
        setBranchNames(prev => {
          const merged = new Set([...prev, ...(res.data.loans || []).map(l => l.branchName).filter(Boolean)]);
          return [...merged].sort();
        });
      }
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [currentBranch, isSuperAdmin, searchTerm, statusFilter, branchFilter, showError]);

  // Re-fetch when page changes or parent triggers a refresh (after add/update)
  useEffect(() => { fetchPage(page); }, [page, refreshKey]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
    fetchPage(1);
  }, [searchTerm, statusFilter, branchFilter]);

  const handleFilterChange = (setter) => (e) => { setter(e.target.value); };

  const currentPage = Math.min(page, totalPages);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <FileText className="text-orange-400" size={32} />
            {isSuperAdmin ? 'All Loans' : 'My Loans'}
          </h1>
          <p className="text-slate-400 font-medium mt-1">{total} loans {isSuperAdmin ? 'across all branches' : 'in this branch'}</p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by ID, name, phone or bank loan no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-slate-600"
            />
          </div>

          {isSuperAdmin && branchNames.length > 0 && (
            <select value={branchFilter} onChange={handleFilterChange(setBranchFilter)}
              className="px-4 py-3 bg-slate-900/50 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all appearance-none cursor-pointer font-bold text-sm min-w-[140px]">
              <option value="all">All Branches</option>
              {branchNames.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={handleFilterChange(setStatusFilter)}
            className="px-4 py-3 bg-slate-900/50 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all appearance-none cursor-pointer font-bold text-sm min-w-[120px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="renewed">Renewed</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/30 text-slate-500 border-b border-white/5">
              <tr>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em]">Customer ID</th>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em]">Customer Name</th>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em]">Loan Amount</th>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em]">Balance</th>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em]">Interest Paid</th>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] min-w-[120px]">Loan Date</th>
                {isSuperAdmin && <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em]">Branch</th>}
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] min-w-[100px]">Status</th>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] min-w-[130px]">Next Due Date</th>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] min-w-[100px]">Loan No.</th>
                <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] min-w-[150px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="11" className="py-20 text-center">
                    <div className="flex items-center justify-center gap-3 text-slate-500">
                      <Loader2 size={24} className="animate-spin" />
                      <span className="font-bold">Loading loans…</span>
                    </div>
                  </td>
                </tr>
              ) : loans.length > 0 ? (
                loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-white/[0.02] transition-all duration-300 group">
                    <td className="px-8 py-7 font-black text-blue-400">{loan.customerId || (loan.id?.includes('-') ? loan.id.split('-')[0] : loan.id)}</td>
                    <td className="px-8 py-7">
                      <div className="text-white font-bold text-lg">{loan.customerName}</div>
                      <div className="text-slate-500 text-xs font-medium">{loan.customerPhone}</div>
                    </td>
                    <td className="px-8 py-7 font-bold text-white/90">
                      ₹{(parseFloat(loan.loanAmount) || 0).toLocaleString()}
                    </td>
                    <td className="px-8 py-7 font-black text-emerald-400 text-base">
                      ₹{(parseFloat(loan.loanAmount) || 0).toLocaleString()}
                    </td>
                    <td className="px-8 py-7 font-black text-violet-400">
                      ₹{(parseFloat(loan.totalInterestPaid) || 0).toLocaleString()}
                    </td>
                    <td className="px-8 py-7">
                      <div className="text-white font-bold text-sm">
                        {loan.loanDate ? new Date(loan.loanDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—'}
                      </div>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-8 py-7">
                        <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase tracking-wider">{loan.branchName || '—'}</span>
                      </td>
                    )}
                    <td className="px-8 py-7">
                      {(() => {
                        const _due = getNextDueDate(loan);
                        const isOverdue = _due && new Date(_due) < today;
                        if (loan.status === 'closed') return <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border bg-slate-800/50 text-slate-400 border-slate-700">Closed</span>;
                        if (loan.status === 'renewed') return <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Renewed</span>;
                        return (
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                            isOverdue ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {isOverdue ? 'Overdue' : 'Active'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-8 py-7">
                      {(() => {
                        const dueDate = getNextDueDate(loan);
                        if (!dueDate) return <span className="text-slate-500 text-xs">—</span>;
                        const isOverdue = new Date(dueDate) < today;
                        return (
                          <div className={`flex items-center gap-2 ${isOverdue ? 'text-red-400' : 'text-slate-300'}`}>
                            <CalendarClock size={14} className={isOverdue ? 'text-red-400' : 'text-slate-500'} />
                            <span className="text-sm font-bold">
                              {new Date(dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                            </span>
                            {isOverdue && <AlertCircle size={13} className="text-red-400" />}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-8 py-7 font-black text-slate-400">
                      {loan.id.split('-').pop()}
                    </td>
                    <td className="px-8 py-7 text-right">
                      <div className="hidden group-hover:flex justify-end items-center gap-2 transition-all duration-300">
                        <button
                          onClick={() => onSelectLoan(loan)}
                          className="p-2.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl transition-all"
                          title="Edit Loan"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          className="p-2.5 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white rounded-xl transition-all"
                          title="Download Bill"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                      <div className="group-hover:hidden flex justify-end">
                        <button
                          onClick={() => onSelectLoan(loan)}
                          className="px-4 py-2 bg-slate-800/50 text-slate-400 rounded-xl text-xs font-bold border border-white/5 hover:bg-slate-700 transition-all"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-6 bg-slate-800 rounded-full">
                        <Search size={40} className="text-slate-600" />
                      </div>
                      <p className="text-slate-500 font-bold">No loans matching your search</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/10">
          <span className="text-slate-400 text-sm font-medium">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, total)} of {total} loans
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="p-2 rounded-xl bg-slate-900/50 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            ><ChevronLeft size={16} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) => p === '...'
                ? <span key={`e${i}`} className="px-2 text-slate-500">…</span>
                : <button key={p} onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${currentPage === p ? 'bg-blue-600 text-white' : 'bg-slate-900/50 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                  >{p}</button>
              )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className="p-2 rounded-xl bg-slate-900/50 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            ><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLoans;
