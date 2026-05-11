import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import api, { getErrorMessage } from './api';
import { useToastContext } from './components/Toast';
import {
  Menu, X, Plus, FileText, Settings, BarChart3,
  ChevronDown, LogOut, LayoutDashboard, Bell, AlertCircle
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import MyLoans from './components/MyLoans';
import LoanCreation from './components/LoanCreation';
import LoanDetails from './components/LoanDetails';
import Reports from './components/Reports';
import SettingsPage from './components/Settings';
import BillModal from './components/BillModal';
import Loader from './components/Loader';

const useSessionCountdown = (expiresAt) => {
  const calc = () => {
    const ms = (expiresAt || 0) - Date.now();
    if (ms <= 0) return { label: '00:00', warning: true };
    const totalMins = Math.floor(ms / 60000);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return {
      label: h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`,
      warning: totalMins < 10,
    };
  };
  const [countdown, setCountdown] = useState(calc);
  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setCountdown(calc()), 30000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return countdown;
};

const LoanManager = ({ currentBranch, onUpdateBranch, onLogout, sessionExpiresAt }) => {
  const { showError, showSuccess } = useToastContext();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showBillLoan, setShowBillLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [autoPayInterest, setAutoPayInterest] = useState(false);
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [totalInterestPaid, setTotalInterestPaid] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const isSuperAdmin = currentBranch?.role === 'super_admin';
  const sessionCountdown = useSessionCountdown(sessionExpiresAt);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);
  const [branches, setBranches] = useState([]);

  const navItems = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'from-blue-500 to-cyan-500' },
    ...(!isSuperAdmin ? [{ id: 'loanCreation', label: 'New Loan', icon: Plus, color: 'from-purple-500 to-pink-500' }] : []),
    { id: 'myLoans', label: isSuperAdmin ? 'All Loans' : 'My Loans', icon: FileText, color: 'from-orange-500 to-red-500' },
    { id: 'reports', label: 'Reports', icon: BarChart3, color: 'from-green-500 to-emerald-500' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'from-indigo-500 to-purple-500' }
  ], [isSuperAdmin]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSummary = useCallback(async () => {
    if (!currentBranch) return;
    try {
      const params = isSuperAdmin ? { role: 'super_admin' } : { branchId: currentBranch.id };
      const res = await api.get('/loans/summary', { params });
      setOverdueLoans(res.data.overdueLoans || []);
      setTotalInterestPaid(res.data.totalInterestPaid || 0);
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [currentBranch, isSuperAdmin, showError]);

  useEffect(() => {
    fetchSummary();
    if (isSuperAdmin) {
      api.get('/branches', { params: { role: 'super_admin' } })
        .then(r => setBranches(r.data || []))
        .catch(err => showError(getErrorMessage(err)));
    }
  }, [currentBranch]);

  const handleAddLoan = useCallback(async (newLoan) => {
    setActionLoading(true);
    try {
      await api.post('/loans', { ...newLoan, branchId: currentBranch.id });
      setShowBillLoan(null);
      setCurrentPage('dashboard');
      setRefreshKey(k => k + 1);
      fetchSummary();
      showSuccess('Loan created successfully');
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }, [currentBranch, showSuccess, showError, fetchSummary]);

  const handleUpdateLoan = useCallback(async (loanId, updates) => {
    setActionLoading(true);
    try {
      const updatedLoan = { ...selectedLoan, ...updates };
      await api.put(`/loans/${loanId}`, updatedLoan);
      setSelectedLoan(prev => prev?.id === loanId ? { ...prev, ...updates } : prev);
      setRefreshKey(k => k + 1);
      fetchSummary();
    } catch (err) {
      showError(getErrorMessage(err));
      // Resync selected loan from server on failure
      api.get(`/loans/${loanId}`).then(r => setSelectedLoan(r.data)).catch(() => {});
    } finally {
      setActionLoading(false);
    }
  }, [selectedLoan, showError, fetchSummary]);

  const handleSelectLoan = useCallback(async (loanOrId, openPay = false) => {
    setAutoPayInterest(openPay);
    setCurrentPage('loanDetails');
    if (loanOrId && typeof loanOrId === 'object') {
      setSelectedLoan(loanOrId);
    } else {
      try {
        const res = await api.get(`/loans/${loanOrId}`);
        setSelectedLoan(res.data);
      } catch (err) {
        showError(getErrorMessage(err));
        setCurrentPage('myLoans');
      }
    }
  }, [showError]);

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200 overflow-hidden font-sans">
      {loading && <Loader fullPage />}
      {actionLoading && <Loader fullPage />}
      
      {/* Sidebar - Matching Screenshot */}
      <aside
        className={`fixed lg:static left-0 top-0 w-72 h-screen bg-[#1e293b]/50 backdrop-blur-2xl border-r border-white/5 flex flex-col z-40 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20">
            ₹
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight text-white">LoanVault</h1>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{currentBranch?.branchName || 'Gold Management'}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id || (item.id === 'myLoans' && currentPage === 'loanDetails');
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
                  isActive
                    ? `bg-gradient-to-r ${item.color} text-white shadow-xl shadow-blue-500/10`
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={22} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
                <span className="font-bold tracking-wide">{item.label}</span>
                {isActive && <ChevronDown size={16} className="ml-auto opacity-50" />}
              </button>
            );
          })}
        </nav>

        {/* Overdue Notification Bell */}
        <div className="px-6 mb-2 relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-all"
          >
            <div className="flex items-center gap-3">
              <Bell size={18} className={overdueLoans.length > 0 ? 'text-amber-400' : 'text-slate-500'} />
              <span className="text-sm font-bold text-slate-400">Notifications</span>
            </div>
            {overdueLoans.length > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-full">{overdueLoans.length}</span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute bottom-14 left-0 right-0 mx-6 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="p-4 border-b border-white/5 flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-400" />
                <span className="text-white font-black text-sm">Overdue Loans</span>
              </div>
              {overdueLoans.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm font-medium">All loans are up to date</div>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                  {overdueLoans.map(loan => (
                    <button
                      key={loan.id}
                      onClick={() => { handleSelectLoan(loan.id, true); setShowNotifications(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 transition-all"
                    >
                      <div className="text-white font-bold text-sm">{loan.customerName}</div>
                      <div className="text-red-400 text-xs font-medium mt-0.5">
                        Due: {(() => { const d = new Date(loan.lastPaidDate); d.setMonth(d.getMonth() + 1); return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }); })()}
                      </div>
                      <div className="text-slate-500 text-xs">₹{(parseFloat(loan.monthlyInterest) || 0).toLocaleString()} pending</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Total Interest Card - Matching Screenshot */}
        <div className="p-6 mt-auto">
          <div className="bg-[#1e293b] rounded-3xl p-6 border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-purple-500/20 transition-all"></div>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Total Interest</p>
            <p className="text-3xl font-black text-white tracking-tight">₹{totalInterestPaid.toLocaleString()}</p>
          </div>
          
          <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl mb-3 border ${
            sessionCountdown.warning
              ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
              : 'bg-white/5 border-white/5 text-slate-400'
          }`}>
            <span className="text-[10px] font-black uppercase tracking-widest">Session</span>
            <span className={`text-xs font-black tabular-nums ${sessionCountdown.warning ? 'text-red-400' : 'text-slate-300'}`}>
              {sessionCountdown.label}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-bold transition-all duration-300 border border-red-500/20 shadow-lg"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header Mobile */}
        <header className="lg:hidden flex items-center justify-between p-6 bg-[#1e293b]/80 backdrop-blur-md border-b border-white/5 z-30">
           <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold">₹</div>
            <h1 className="font-bold text-lg">LoanVault</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-3 bg-white/5 rounded-xl text-white"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-6 lg:p-12">
          <div className="max-w-7xl mx-auto pb-20">
            {currentPage === 'dashboard' && (
              <Dashboard
                currentBranch={currentBranch}
                isSuperAdmin={isSuperAdmin}
                onSelectLoan={handleSelectLoan}
                overdueLoans={overdueLoans}
              />
            )}
            {currentPage === 'myLoans' && (
              <MyLoans
                currentBranch={currentBranch}
                isSuperAdmin={isSuperAdmin}
                onSelectLoan={handleSelectLoan}
                refreshKey={refreshKey}
              />
            )}
            {currentPage === 'loanCreation' && !isSuperAdmin && (
              <LoanCreation
                onAddLoan={handleAddLoan}
                onPreviewBill={setShowBillLoan}
                currentBranch={currentBranch}
              />
            )}
            {currentPage === 'loanDetails' && selectedLoan && (
              <LoanDetails
                key={selectedLoan.id}
                loan={selectedLoan}
                autoPayInterest={autoPayInterest}
                onUpdateLoan={(updates) => handleUpdateLoan(selectedLoan.id, updates)}
                onRenewLoan={async (newLoanId) => {
                  try {
                    await handleSelectLoan(newLoanId);
                    setRefreshKey(k => k + 1);
                    fetchSummary();
                  } catch (err) {
                    showError(getErrorMessage(err));
                    setCurrentPage('myLoans');
                  }
                }}
              />
            )}
            {currentPage === 'reports' && (
              <Reports isSuperAdmin={isSuperAdmin} branches={branches} currentBranch={currentBranch} />
            )}
            {currentPage === 'settings' && (
              <SettingsPage
                currentBranch={currentBranch}
                onUpdateBranch={onUpdateBranch}
                isSuperAdmin={isSuperAdmin}
              />
            )}
          </div>
        </div>

        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[120px] -mr-96 -mt-96 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[120px] -ml-72 -mb-72 pointer-events-none"></div>
      </main>

      {/* Bill Modal */}
      {showBillLoan && (
        <BillModal
          loan={showBillLoan}
          currentBranch={currentBranch}
          onConfirmSave={(loanData) => {
             if (currentPage === 'loanCreation') {
               handleAddLoan(loanData);
             }
          }}
          onClose={() => {
            setShowBillLoan(null);
            setCurrentPage('myLoans');
          }} 
        />
      )}
    </div>
  );
};

export default LoanManager;
