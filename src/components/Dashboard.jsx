import React, { useState } from 'react';
import { TrendingUp, Clock, DollarSign, AlertCircle, ChevronRight, Zap, Award, Target, Calendar } from 'lucide-react';

const today = new Date().toISOString().split('T')[0];
const sixMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0];

const Dashboard = ({ loans = [], onSelectLoan }) => {
  const [dateRange, setDateRange] = useState({ from: sixMonthsAgo, to: today });

  const filteredLoans = loans.filter(loan => {
    if (!loan.loanDate) return false;
    const d = new Date(loan.loanDate);
    const from = new Date(dateRange.from); from.setHours(0, 0, 0, 0);
    const to = new Date(dateRange.to); to.setHours(23, 59, 59, 999);
    return d >= from && d <= to;
  });

  // Stats based on filtered loans
  const stats = {
    totalLoans: filteredLoans.length,
    totalAmountGiven: filteredLoans.reduce((s, l) => s + (parseFloat(l.amountGiven || l.loanAmount) || 0), 0),
    totalInterestPaid: filteredLoans.reduce((s, l) => s + (parseFloat(l.totalInterestPaid) || 0), 0),
    pendingInterests: filteredLoans.reduce((s, l) => s + (parseInt(l.pending_count) || 0), 0),
  };

  // Monthly bar chart data — group all loans (not range-filtered) by month
  const monthlyMap = loans.reduce((acc, loan) => {
    if (!loan.loanDate) return acc;
    const month = loan.loanDate.substring(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = { total: 0, count: 0 };
    acc[month].total += parseFloat(loan.amountGiven || loan.loanAmount) || 0;
    acc[month].count += 1;
    return acc;
  }, {});

  const sortedMonths = Object.keys(monthlyMap).sort().slice(-12);
  const maxVal = Math.max(...sortedMonths.map(m => monthlyMap[m].total), 1);

  const monthLabel = (ym) => {
    const [y, m] = ym.split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-IN', { month: 'short', year: '2-digit' });
  };

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

      {/* Date Range Filter */}
      <div className="bg-slate-800/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl">
        <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-lg"><Calendar size={20} className="text-blue-400" /></div>
          Filter by Date Range
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 ml-1">From</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="w-full px-5 py-4 bg-slate-900/50 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 ml-1">To</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="w-full px-5 py-4 bg-slate-900/50 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
          <button
            onClick={() => setDateRange({ from: sixMonthsAgo, to: today })}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-10 py-4 rounded-2xl font-bold tracking-wide transition-all shadow-xl shadow-blue-500/20 active:scale-95"
          >
            Reset
          </button>
        </div>
      </div>

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
              {/* Bars */}
              <div className="flex items-end gap-3 h-52">
                {sortedMonths.map((month) => {
                  const { total, count } = monthlyMap[month];
                  const heightPct = Math.max((total / maxVal) * 100, 2);
                  const isCurrentMonth = month === today.substring(0, 7);
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1 group" title={`₹${total.toLocaleString('en-IN')} — ${count} loan${count !== 1 ? 's' : ''}`}>
                      <span className="text-slate-400 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ₹{total >= 100000 ? `${(total / 100000).toFixed(1)}L` : total.toLocaleString('en-IN')}
                      </span>
                      <div className="w-full relative" style={{ height: `${heightPct}%` }}>
                        <div className={`w-full h-full rounded-t-lg transition-all duration-300 group-hover:brightness-125 ${
                          isCurrentMonth
                            ? 'bg-gradient-to-t from-blue-600 to-cyan-400'
                            : 'bg-gradient-to-t from-indigo-700 to-purple-500'
                        }`} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-axis labels */}
              <div className="flex gap-3 mt-2">
                {sortedMonths.map((month) => (
                  <div key={month} className="flex-1 text-center text-[10px] text-slate-500 font-bold truncate">
                    {monthLabel(month)}
                  </div>
                ))}
              </div>

              {/* Legend */}
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

      {/* Filtered Loans Table */}
      <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
        <div className="p-8 border-b border-white/5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Loans in Range</h2>
            <p className="text-slate-400 font-medium mt-1 text-sm">{dateRange.from} → {dateRange.to}</p>
          </div>
          <div className="px-5 py-2 bg-[#1e293b] text-blue-300 rounded-2xl text-sm font-bold border border-blue-500/30">
            {filteredLoans.length} loans found
          </div>
        </div>

        <div className="p-1">
          {filteredLoans.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/20 text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Customer ID</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Customer Name</th>
                    <th className="hidden md:table-cell px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Amount Given</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Loan No.</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-white/[0.02] transition-all duration-300 group">
                      <td className="px-8 py-6 text-base font-black text-blue-400">{loan.customerId || loan.id.split('-')[0]}</td>
                      <td className="px-8 py-6">
                        <div className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">{loan.customerName}</div>
                        <div className="text-xs text-slate-500 font-medium">{loan.customerPhone}</div>
                      </td>
                      <td className="hidden md:table-cell px-8 py-6 text-base font-black text-white/90">
                        ₹{(parseFloat(loan.amountGiven || loan.loanAmount) || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                          loan.status === 'closed'
                            ? 'bg-slate-800/50 text-slate-400 border-slate-700'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {loan.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-8 py-6 font-black text-slate-400">{loan.id.split('-').pop()}</td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => onSelectLoan(loan.id)}
                          className="px-5 py-2 bg-white/5 hover:bg-blue-500 text-slate-300 hover:text-white rounded-xl font-bold transition-all border border-white/10 hover:border-blue-400 flex items-center gap-2 ml-auto group/btn"
                        >
                          Details <ChevronRight size={15} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <AlertCircle className="text-slate-600" size={48} />
              <p className="text-xl font-black text-white/30">No loans in this range</p>
              <p className="text-slate-500 text-sm">Adjust the date range above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
