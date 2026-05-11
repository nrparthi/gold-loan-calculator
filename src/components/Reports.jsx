import { useState, useEffect } from 'react';
import { Download, TrendingUp, BarChart3, Calendar, Activity, CheckCircle2, Clock, Building2, Loader2 } from 'lucide-react';
import api, { getErrorMessage } from '../api';
import { useToastContext } from './Toast';

const toCSV = (headers, rows, filename) => {
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const fmt = (date) => date ? new Date(date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : '';

const Reports = ({ isSuperAdmin = false, branches = [], currentBranch }) => {
  const { showError, showSuccess } = useToastContext();
  const today = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Kolkata' });
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleDateString('sv', { timeZone: 'Asia/Kolkata' });

  const [dateRange, setDateRange] = useState({ from: lastMonth, to: today });
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!currentBranch) return;
    setLoadingStats(true);
    const branchParam = isSuperAdmin
      ? (selectedBranch === 'all' ? { role: 'super_admin' } : { branchId: selectedBranch })
      : { branchId: currentBranch.id };
    api.get('/loans/stats', { params: { ...branchParam, from: dateRange.from, to: dateRange.to } })
      .then(res => setStats(res.data))
      .catch(err => showError(getErrorMessage(err)))
      .finally(() => setLoadingStats(false));
  }, [dateRange, selectedBranch, currentBranch, isSuperAdmin]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const branchParam = isSuperAdmin
        ? (selectedBranch === 'all' ? { role: 'super_admin' } : { branchId: selectedBranch })
        : { branchId: currentBranch?.id };
      const dateParams = { from: dateRange.from, to: dateRange.to };
      const [loansRes, interestRes, partRes] = await Promise.all([
        api.get('/loans/export', { params: { ...branchParam, ...dateParams } }),
        api.get('/reports/interest-payments', { params: { ...branchParam, ...dateParams } }),
        api.get('/reports/part-payments', { params: { ...branchParam, ...dateParams } }),
      ]);

      const suffix = `${dateRange.from}_to_${dateRange.to}`;

      toCSV(
        ['Loan No.', 'Customer ID', 'Customer Name', 'Phone', 'Branch', 'Loan Date', 'Amount Given', 'Loan Amount', 'Interest Rate (%)', 'Monthly Interest', 'Total Interest Paid', 'Bank Received', 'Bank Settled', 'Status'],
        loansRes.data.map(l => [
          l.id?.split('-').pop() || '',
          l.customerId || '',
          l.customerName || '',
          l.customerPhone || '',
          l.branchName || '',
          fmt(l.loanDate),
          parseFloat(l.amountGiven || l.loanAmount) || 0,
          parseFloat(l.loanAmount) || 0,
          parseFloat(l.interestRate) || 0,
          parseFloat(l.monthlyInterest) || 0,
          parseFloat(l.totalInterestPaid) || 0,
          parseFloat(l.bankAmount) || 0,
          parseFloat(l.bankSettledAmount) || 0,
          l.status || 'active',
        ]),
        `loans_${suffix}.csv`
      );

      toCSV(
        ['Loan No.', 'Customer Name', 'Phone', 'Branch', 'Due Date', 'Amount', 'Paid Amount', 'Payment Date', 'Payment Mode', 'Carry Forward'],
        interestRes.data.map(ip => [
          ip.loan_id?.split('-').pop() || ip.loan_id || '',
          ip.customer_name || '',
          ip.customer_phone || '',
          ip.branch_name || '',
          fmt(ip.due_date),
          parseFloat(ip.amount) || 0,
          parseFloat(ip.paid_amount) || 0,
          fmt(ip.payment_date),
          ip.payment_mode || 'CASH',
          parseFloat(ip.carry_forward) || 0,
        ]),
        `interest_payments_${suffix}.csv`
      );

      toCSV(
        ['Loan No.', 'Customer Name', 'Phone', 'Branch', 'Payment Date', 'Amount Paid', 'Balance After', 'Payment Mode', 'Type'],
        partRes.data.map(pp => [
          pp.loan_id?.split('-').pop() || pp.loan_id || '',
          pp.customer_name || '',
          pp.customer_phone || '',
          pp.branch_name || '',
          fmt(pp.payment_date),
          parseFloat(pp.amount) || 0,
          parseFloat(pp.balance_after) || 0,
          pp.payment_mode || 'CASH',
          pp.is_foreclosure ? 'Foreclosure' : 'Part Payment',
        ]),
        `part_payments_${suffix}.csv`
      );

      showSuccess('3 CSV files downloaded');
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in zoom-in duration-700">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-10 lg:p-14 shadow-2xl border border-white/10">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400 rounded-full blur-[100px] animate-pulse"></div>
        </div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-20 h-20 rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
            <BarChart3 size={40} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight">Reports & Analytics</h1>
            <p className="text-emerald-100 text-lg font-medium mt-2 opacity-90">Deep dive into your branch performance and loan metrics</p>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-slate-800/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-xl flex flex-col lg:flex-row items-end gap-6">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
          {isSuperAdmin && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 ml-1">Branch</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-slate-900/50 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none cursor-pointer font-bold"
                >
                  <option value="all">All Branches</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                </select>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 ml-1 flex items-center gap-2"><Calendar size={14} /> From</label>
            <input type="date" value={dateRange.from}
              onChange={(e) => setDateRange(p => ({ ...p, from: e.target.value }))}
              className="w-full px-5 py-4 bg-slate-900/50 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 ml-1 flex items-center gap-2"><Calendar size={14} /> To</label>
            <input type="date" value={dateRange.to}
              onChange={(e) => setDateRange(p => ({ ...p, to: e.target.value }))}
              className="w-full px-5 py-4 bg-slate-900/50 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-60 text-white rounded-2xl font-black tracking-wide transition-all shadow-xl shadow-emerald-500/20 active:scale-95 whitespace-nowrap"
        >
          {exporting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
          {exporting ? 'Exporting…' : 'Export CSVs'}
        </button>
      </div>

      {/* Summary Stats */}
      {loadingStats ? (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
          <Loader2 size={24} className="animate-spin" />
          <span className="font-bold">Loading stats…</span>
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[
            { label: 'Total Loans', value: stats.totalLoans, icon: Activity, color: 'blue', fmt: v => v },
            { label: 'Active', value: stats.activeCount, icon: CheckCircle2, color: 'emerald', fmt: v => v },
            { label: 'Closed', value: stats.closedCount, icon: Clock, color: 'slate', fmt: v => v },
            { label: 'Amount Given', value: stats.totalAmountGiven, icon: TrendingUp, color: 'orange', fmt: v => `₹${(v/100000).toFixed(1)}L` },
            { label: 'Interest Earned', value: stats.totalInterestPaid, icon: TrendingUp, color: 'violet', fmt: v => `₹${v.toLocaleString()}` },
            { label: 'Bank Received', value: stats.totalBankAmount, icon: TrendingUp, color: 'cyan', fmt: v => `₹${(v/100000).toFixed(1)}L` },
            { label: 'Bank Settled', value: stats.totalBankSettled, icon: TrendingUp, color: 'teal', fmt: v => `₹${(v/100000).toFixed(1)}L` },
            { label: 'Pending Interests', value: stats.pendingInterests, icon: Clock, color: 'red', fmt: v => v },
          ].map(({ label, value, icon: Icon, color, fmt: f }) => (
            <div key={label} className={`bg-${color}-500/5 border border-${color}-500/20 rounded-2xl p-6`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{label}</p>
                <Icon size={16} className={`text-${color}-400`} />
              </div>
              <p className={`text-2xl font-black text-${color}-400`}>{f(value)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reports;
