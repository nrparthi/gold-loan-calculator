import React, { useState } from 'react';
import { Download, TrendingUp, BarChart3, PieChart, Filter, Calendar, Activity, CheckCircle2, Clock } from 'lucide-react';

const Reports = ({ loans = [] }) => {
  const [dateRange, setDateRange] = useState({ 
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], 
    to: new Date().toISOString().split('T')[0] 
  });

  const filteredLoans = loans.filter(loan => {
    if (!loan.loanDate) return true;
    const date = new Date(loan.loanDate);
    return date >= new Date(dateRange.from) && date <= new Date(dateRange.to);
  });

  const summary = {
    totalLoans: filteredLoans.length,
    totalLoanAmount: filteredLoans.reduce((sum, l) => sum + (parseFloat(l.amountGiven || l.loanAmount) || 0), 0),
    totalInterestPaid: filteredLoans.reduce((sum, l) => sum + (parseFloat(l.totalInterestPaid) || 0), 0),
    closedLoans: filteredLoans.filter(l => l.status === 'closed').length,
    activeLoans: filteredLoans.filter(l => l.status === 'active' || !l.status).length,
  };

  return (
    <div className="space-y-10 animate-in fade-in zoom-in duration-700">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-10 lg:p-14 shadow-2xl border border-white/10">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400 rounded-full blur-[100px] animate-pulse"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
              <BarChart3 size={40} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight">Reports & Analytics</h1>
              <p className="text-emerald-100 text-lg font-medium mt-2 opacity-90">Deep dive into your branch performance and loan metrics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-slate-800/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-xl flex flex-col lg:flex-row items-end gap-6">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 ml-1">From Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="date" 
                value={dateRange.from} 
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} 
                className="w-full pl-12 pr-5 py-4 bg-slate-900/50 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 ml-1">To Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="date" 
                value={dateRange.to} 
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} 
                className="w-full pl-12 pr-5 py-4 bg-slate-900/50 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold" 
              />
            </div>
          </div>
        </div>
        <div className="flex gap-4 w-full lg:w-auto">
          <button className="flex-1 lg:flex-none px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl font-black tracking-wide transition-all shadow-xl shadow-emerald-500/20 active:scale-95">
            Update Report
          </button>
          <button className="p-4 bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 rounded-2xl transition-all shadow-xl">
            <Download size={24} />
          </button>
        </div>
      </div>

      {/* High-Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-[#1e293b]/60 backdrop-blur-xl rounded-[2rem] border border-white/5 p-8 shadow-xl">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Volume</p>
            <Activity size={20} className="text-blue-400" />
          </div>
          <p className="text-4xl font-black text-white mt-4">{summary.totalLoans}</p>
          <p className="text-blue-400 text-xs font-bold mt-2">Total Loans Processed</p>
        </div>

        <div className="bg-[#1e293b]/60 backdrop-blur-xl rounded-[2rem] border border-white/5 p-8 shadow-xl">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Value</p>
            <TrendingUp size={20} className="text-orange-400" />
          </div>
          <p className="text-3xl font-black text-white mt-4">₹{(summary.totalLoanAmount / 100000).toFixed(2)}L</p>
          <p className="text-orange-400 text-xs font-bold mt-2">Portfolio Net Worth</p>
        </div>

        <div className="bg-[#1e293b]/60 backdrop-blur-xl rounded-[2rem] border border-white/5 p-8 shadow-xl">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Revenue</p>
            <PieChart size={20} className="text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white mt-4">₹{summary.totalInterestPaid.toLocaleString()}</p>
          <p className="text-emerald-400 text-xs font-bold mt-2">Interest Interest Earned</p>
        </div>

        <div className="bg-[#1e293b]/60 backdrop-blur-xl rounded-[2rem] border border-white/5 p-8 shadow-xl">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Growth</p>
            <BarChart3 size={20} className="text-purple-400" />
          </div>
          <p className="text-4xl font-black text-white mt-4">{summary.totalLoanAmount > 0 ? ((summary.totalInterestPaid / summary.totalLoanAmount) * 100).toFixed(1) : 0}%</p>
          <p className="text-purple-400 text-xs font-bold mt-2">Return on Portfolio</p>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-[2.5rem] border border-emerald-500/20 p-10 shadow-2xl flex items-center justify-between">
          <div>
            <p className="text-emerald-400 text-xs font-black uppercase tracking-[0.2em] mb-4">Active Status</p>
            <p className="text-6xl font-black text-white">{summary.activeLoans}</p>
            <p className="text-slate-400 font-bold mt-4">Ongoing active accounts</p>
          </div>
          <div className="p-8 bg-emerald-500/20 rounded-full">
            <Clock size={48} className="text-emerald-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-500/10 to-slate-400/10 rounded-[2.5rem] border border-slate-500/20 p-10 shadow-2xl flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-4">Closed Status</p>
            <p className="text-6xl font-black text-white">{summary.closedLoans}</p>
            <p className="text-slate-400 font-bold mt-4">Successfully liquidated</p>
          </div>
          <div className="p-8 bg-slate-500/20 rounded-full">
            <CheckCircle2 size={48} className="text-slate-400" />
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-10 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-3xl font-black text-white tracking-tight">Detailed Breakdown</h2>
          <div className="px-6 py-2.5 bg-[#1e293b] text-emerald-400 rounded-2xl text-xs font-black border border-emerald-500/20">
            {filteredLoans.length} ENTRIES
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/30 text-slate-500 border-b border-white/5">
              <tr>
                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em]">Customer ID</th>
                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em]">Customer Name</th>
                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em]">Amount Given</th>
                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em]">Paid Int.</th>
                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em]">Loan No.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-white/[0.02] transition-all group">
                  <td className="px-10 py-8 font-black text-blue-400">{loan.customerId || (loan.id?.includes('-') ? loan.id.split('-')[0] : loan.id)}</td>
                  <td className="px-10 py-8">
                    <div className="text-lg font-bold text-white">{loan.customerName}</div>
                  </td>
                  <td className="px-10 py-8 font-bold text-white/90">₹{(parseFloat(loan.amountGiven || loan.loanAmount) || 0).toLocaleString()}</td>
                  <td className="px-10 py-8 font-bold text-emerald-400">₹{(parseFloat(loan.totalInterestPaid) || 0).toLocaleString()}</td>
                  <td className="px-10 py-8">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                      loan.status === 'closed'
                        ? 'bg-slate-800/50 text-slate-400 border-slate-700'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {loan.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-10 py-8 font-black text-slate-400">
                    {loan.id.split('-').pop()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
