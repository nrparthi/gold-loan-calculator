import React, { useState } from 'react';
import { Search, FileText, Download, Edit3, AlertCircle, CalendarClock } from 'lucide-react';

const today = new Date(); today.setHours(0, 0, 0, 0);

// If DB has no unpaid record, derive next due from loan date + months paid
const getNextDueDate = (loan) => {
  if (loan.nextDueDate) return loan.nextDueDate;
  if (!loan.loanDate || loan.status === 'closed') return null;
  const monthly = parseFloat(loan.monthlyInterest) || 0;
  const paid = parseFloat(loan.totalInterestPaid) || 0;
  const monthsPaid = monthly > 0 ? Math.round(paid / monthly) : 0;
  const d = new Date(loan.loanDate);
  d.setMonth(d.getMonth() + monthsPaid);
  return d.toISOString().split('T')[0];
};

const MyLoans = ({ loans = [], onSelectLoan, isSuperAdmin = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');

  const branches = isSuperAdmin ? [...new Set(loans.map(l => l.branchName).filter(Boolean))].sort() : [];

  const filteredLoans = loans.filter(loan => {
    const matchesSearch =
      loan.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.customerPhone?.includes(searchTerm) ||
      loan.bankLoanNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    const matchesBranch = !isSuperAdmin || branchFilter === 'all' || loan.branchName === branchFilter;
    return matchesSearch && matchesStatus && matchesBranch;
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <FileText className="text-orange-400" size={32} />
            {isSuperAdmin ? 'All Loans' : 'My Loans'}
          </h1>
          <p className="text-slate-400 font-medium mt-1">{isSuperAdmin ? `${filteredLoans.length} loans across all branches` : 'View and manage all branch loans'}</p>
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

          {isSuperAdmin && (
            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)}
              className="px-4 py-3 bg-slate-900/50 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all appearance-none cursor-pointer font-bold text-sm min-w-[140px]">
              <option value="all">All Branches</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-slate-900/50 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all appearance-none cursor-pointer font-bold text-sm min-w-[120px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
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
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em]">Amount Given</th>
                {isSuperAdmin && <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em]">Branch</th>}
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] min-w-[100px]">Status</th>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] min-w-[130px]">Next Due Date</th>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] min-w-[100px]">Loan No.</th>
                <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] min-w-[150px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-white/[0.02] transition-all duration-300 group">
                    <td className="px-8 py-7 font-black text-blue-400">{loan.customerId || (loan.id?.includes('-') ? loan.id.split('-')[0] : loan.id)}</td>
                    <td className="px-8 py-7">
                      <div className="text-white font-bold text-lg">{loan.customerName}</div>
                      <div className="text-slate-500 text-xs font-medium">{loan.customerPhone}</div>
                    </td>
                    <td className="px-8 py-7 font-bold text-white/90">
                      ₹{(parseFloat(loan.amountGiven || loan.loanAmount) || 0).toLocaleString()}
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
                        return (
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                            loan.status === 'closed'
                              ? 'bg-slate-800/50 text-slate-400 border-slate-700'
                              : isOverdue
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {loan.status === 'closed' ? 'Closed' : isOverdue ? 'Overdue' : 'Active'}
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
                              {new Date(dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
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
                          onClick={() => onSelectLoan(loan.id)}
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
                          onClick={() => onSelectLoan(loan.id)}
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
                  <td colSpan="7" className="py-20 text-center">
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
    </div>
  );
};

export default MyLoans;
