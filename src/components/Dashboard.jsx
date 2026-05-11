import { useState, useEffect } from 'react';
import { TrendingUp, Clock, DollarSign, AlertCircle, Zap, Award, Target, Calendar, Bell, Loader2 } from 'lucide-react';
import api, { getErrorMessage } from '../api';
import { useToastContext } from './Toast';
import { getNextDueDate } from '../utils/calculations';

const today = new Date().toISOString().split('T')[0];
const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
const sixMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0];

const Dashboard = ({ currentBranch, isSuperAdmin = false, onSelectLoan, overdueLoans = [] }) => {
  const { showError } = useToastContext();
  const [dateRange, setDateRange] = useState({ from: sixMonthsAgo, to: today });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentBranch) return;
    setLoading(true);
    const params = {
      from: dateRange.from,
      to: dateRange.to,
      ...(isSuperAdmin ? { role: 'super_admin' } : { branchId: currentBranch.id }),
    };
    api.get('/loans/stats', { params })
      .then(res => setStats(res.data))
      .catch(err => showError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [dateRange, currentBranch, isSuperAdmin]);

  const monthLabel = (ym) => {
    const [y, m] = ym.split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-IN', { month: 'short', year: '2-digit' });
  };

  const sortedMonths = stats ? [...stats.monthlySummary].sort((a, b) => a.month.localeCompare(b.month)) : [];
  const maxVal = sortedMonths.length ? Math.max(...sortedMonths.map(m => m.total), 1) : 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-10 lg:p-14 shadow-[0_20px_50px_rgba(31,38,135,0.37)] border border-white/10">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-400 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-400 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight">Welcome Back!</h1>
          <p className="text-blue-100 text-xl font-medium mb-8 max-w-2xl opacity-90">Manage your gold loans with ease and efficiency</p>
          <div className="flex items-center gap-3 text-white/90 bg-white/10 backdrop-blur-md w-fit px-5 py-2.5 rounded-2xl border border-white/20">
            <Zap size={22} className="text-yellow-400 fill-yellow-400" />
            <span className="font-semibold tracking-wide uppercase text-xs">Real-time portfolio tracking</span>
          </div>
        </div>
      </div>

      {/* Overdue Alerts */}
      {overdueLoans.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center animate-pulse">
              <Bell size={20} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-red-400 font-black text-lg">{overdueLoans.length} Overdue Loan{overdueLoans.length > 1 ? 's' : ''}</h3>
              <p className="text-red-400/70 text-xs">Interest collection pending — action required</p>
            </div>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {overdueLoans.map(loan => {
              const due = getNextDueDate(loan);
              const daysOverdue = due ? Math.floor((todayDate - new Date(due)) / 86400000) : 0;
              return (
                <button key={loan.id} onClick={() => onSelectLoan(loan.id, true)}
                  className="w-full flex items-center justify-between bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 rounded-2xl px-5 py-3 transition-all group text-left">
                  <div className="flex items-center gap-4">
                    <AlertCircle size={16} className="text-red-400 shrink-0" />
                    <div>
                      <p className="text-white font-bold text-sm">{loan.customerName}</p>
                      <p className="text-slate-400 text-xs">{loan.id} {isSuperAdmin && loan.branchName ? `· ${loan.branchName}` : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-red-400 font-black text-sm">₹{(parseFloat(loan.monthlyInterest) || 0).toLocaleString()}</p>
                    <p className="text-red-400/70 text-xs">{daysOverdue}d overdue</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Date Range Filter */}
      <div className="bg-slate-800/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
        <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-lg"><Calendar size={20} className="text-blue-400" /></div>
          Filter by Date Range
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 ml-1">From</label>
            <input type="date" value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="w-full px-5 py-4 bg-slate-900/50 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 ml-1">To</label>
            <input type="date" value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="w-full px-5 py-4 bg-slate-900/50 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
          <button onClick={() => setDateRange({ from: sixMonthsAgo, to: today })}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-10 py-4 rounded-2xl font-bold tracking-wide transition-all shadow-xl shadow-blue-500/20 active:scale-95">
            Reset
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-slate-500">
          <Loader2 size={28} className="animate-spin" />
          <span className="font-bold text-lg">Loading stats…</span>
        </div>
      ) : stats ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group relative bg-[#1e293b]/60 backdrop-blur-xl rounded-[2rem] border border-blue-500/20 p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(59,130,246,0.15)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-3">Total Loans</p>
                  <p className="text-5xl font-black text-white">{stats.totalLoans}</p>
                </div>
                <div className="p-4 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                  <DollarSign className="text-blue-400" size={32} />
                </div>
              </div>
              <p className="text-blue-400/80 text-sm font-semibold mt-6">In selected range</p>
            </div>

            <div className="group relative bg-[#2d1e1e]/60 backdrop-blur-xl rounded-[2rem] border border-orange-500/20 p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(249,115,22,0.15)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-3">Amount Given</p>
                  <p className="text-4xl font-black text-white">₹{(stats.totalAmountGiven / 100000).toFixed(1)}L</p>
                </div>
                <div className="p-4 bg-orange-500/20 rounded-2xl border border-orange-500/30">
                  <TrendingUp className="text-orange-400" size={32} />
                </div>
              </div>
              <p className="text-orange-400/80 text-sm font-semibold mt-6">Total in range</p>
            </div>

            <div className="group relative bg-[#1e2d24]/60 backdrop-blur-xl rounded-[2rem] border border-emerald-500/20 p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(16,185,129,0.15)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-3">Interest Earned</p>
                  <p className="text-4xl font-black text-white">₹{stats.totalInterestPaid.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                  <Award className="text-emerald-400" size={32} />
                </div>
              </div>
              <p className="text-emerald-400/80 text-sm font-semibold mt-6">Revenue generated</p>
            </div>

            <div className="group relative bg-[#261e2d]/60 backdrop-blur-xl rounded-[2rem] border border-purple-500/20 p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(168,85,247,0.15)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-3">Pending</p>
                  <p className="text-5xl font-black text-white">{stats.pendingInterests}</p>
                </div>
                <div className="p-4 bg-purple-500/20 rounded-2xl border border-purple-500/30">
                  <Clock className="text-purple-400" size={32} />
                </div>
              </div>
              <p className="text-purple-400/80 text-sm font-semibold mt-6">Awaiting payment</p>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group relative bg-[#1e2430]/60 backdrop-blur-xl rounded-[2rem] border border-cyan-500/20 p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(6,182,212,0.15)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-3">Bank Amount Received</p>
                  <p className="text-4xl font-black text-white">₹{(stats.totalBankAmount / 100000).toFixed(1)}L</p>
                </div>
                <div className="p-4 bg-cyan-500/20 rounded-2xl border border-cyan-500/30">
                  <TrendingUp className="text-cyan-400" size={32} />
                </div>
              </div>
              <p className="text-cyan-400/80 text-sm font-semibold mt-6">Total received from bank</p>
            </div>

            <div className="group relative bg-[#1e2420]/60 backdrop-blur-xl rounded-[2rem] border border-teal-500/20 p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(20,184,166,0.15)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-3">Bank Amount Settled</p>
                  <p className="text-4xl font-black text-white">₹{(stats.totalBankSettled / 100000).toFixed(1)}L</p>
                </div>
                <div className="p-4 bg-teal-500/20 rounded-2xl border border-teal-500/30">
                  <Award className="text-teal-400" size={32} />
                </div>
              </div>
              <p className="text-teal-400/80 text-sm font-semibold mt-6">Settled back to bank</p>
            </div>

            <div className="group relative bg-[#2d2218]/60 backdrop-blur-xl rounded-[2rem] border border-amber-500/20 p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(245,158,11,0.15)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-3">Outstanding to Bank</p>
                  <p className="text-4xl font-black text-white">₹{(Math.max(0, stats.totalBankAmount - stats.totalBankSettled) / 100000).toFixed(1)}L</p>
                </div>
                <div className="p-4 bg-amber-500/20 rounded-2xl border border-amber-500/30">
                  <Target className="text-amber-400" size={32} />
                </div>
              </div>
              <p className="text-amber-400/80 text-sm font-semibold mt-6">Balance due to bank</p>
            </div>
          </div>

          {/* Loan Status Breakdown */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: 'Active', count: stats.activeCount, color: 'emerald' },
              { label: 'Closed', count: stats.closedCount, color: 'slate' },
              { label: 'Renewed', count: stats.renewedCount, color: 'indigo' },
            ].map(({ label, count, color }) => (
              <div key={label} className={`bg-${color}-500/5 border border-${color}-500/20 rounded-2xl p-6 text-center`}>
                <p className={`text-4xl font-black text-${color}-400`}>{count}</p>
                <p className="text-slate-400 text-sm font-bold mt-2 uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </div>

          {/* Monthly Bar Chart */}
          <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
            <div className="p-8 border-b border-white/5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Monthly Loans Given</h2>
                <p className="text-slate-400 font-medium mt-1 text-sm">Total amount disbursed per month (last 12 months)</p>
              </div>
              <div className="px-5 py-2 bg-[#1e293b] text-blue-300 rounded-2xl text-sm font-bold border border-blue-500/30">
                {sortedMonths.length} months
              </div>
            </div>

            <div className="p-8">
              {sortedMonths.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center gap-4">
                  <AlertCircle className="text-slate-600" size={48} />
                  <p className="text-slate-500 font-medium">No loan data yet</p>
                </div>
              ) : (
                <>
                  <div className="flex items-end gap-3 h-52">
                    {sortedMonths.map(({ month, total, count }) => {
                      const heightPct = Math.max((total / maxVal) * 100, 2);
                      const isCurrentMonth = month === today.substring(0, 7);
                      return (
                        <div key={month} className="flex-1 flex flex-col items-center gap-1 group" title={`₹${total.toLocaleString('en-IN')} — ${count} loan${count !== 1 ? 's' : ''}`}>
                          <span className="text-slate-400 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            ₹{total >= 100000 ? `${(total / 100000).toFixed(1)}L` : total.toLocaleString('en-IN')}
                          </span>
                          <div className="w-full relative" style={{ height: `${heightPct}%` }}>
                            <div className={`w-full h-full rounded-t-lg transition-all duration-300 group-hover:brightness-125 ${
                              isCurrentMonth ? 'bg-gradient-to-t from-blue-600 to-cyan-400' : 'bg-gradient-to-t from-indigo-700 to-purple-500'
                            }`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-3 mt-2">
                    {sortedMonths.map(({ month }) => (
                      <div key={month} className="flex-1 text-center text-[10px] text-slate-500 font-bold truncate">{monthLabel(month)}</div>
                    ))}
                  </div>
                  <div className="flex items-center gap-6 mt-6 pt-4 border-t border-white/5 text-xs text-slate-400 font-semibold">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-gradient-to-t from-blue-600 to-cyan-400 inline-block"></span> Current month
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-gradient-to-t from-indigo-700 to-purple-500 inline-block"></span> Previous months
                    </span>
                    <span className="ml-auto">Hover a bar for details</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Dashboard;
