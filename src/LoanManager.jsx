import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Menu, X, Home, Plus, FileText, Settings, BarChart3, 
  ChevronDown, LogOut, LayoutDashboard 
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import MyLoans from './components/MyLoans';
import LoanCreation from './components/LoanCreation';
import LoanDetails from './components/LoanDetails';
import Reports from './components/Reports';
import SettingsPage from './components/Settings';
import BillModal from './components/BillModal';
import Loader from './components/Loader';

const LoanManager = ({ currentBranch, onUpdateBranch, onLogout }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loans, setLoans] = useState([]);
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [showBillLoan, setShowBillLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLoans = async () => {
    if (!currentBranch) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.get(`${apiUrl}/loans?branchId=${currentBranch.id}`);
      setLoans(response.data || []);
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [currentBranch]);

  const handleAddLoan = async (newLoan) => {
    setActionLoading(true);
    try {
      const loanWithBranch = { ...newLoan, branchId: currentBranch.id };
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.post(`${apiUrl}/loans`, loanWithBranch);
      
      await fetchLoans(); // Refresh list
      setShowBillLoan(null); // Clear the bill modal
      setCurrentPage('dashboard'); // Go to dashboard
    } catch (error) {
      console.error('Error creating loan:', error);
      alert('Failed to create loan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateLoan = async (loanId, updates) => {
    setActionLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const loanToUpdate = loans.find(l => l.id === loanId);
      const updatedLoan = { ...loanToUpdate, ...updates };
      
      await axios.put(`${apiUrl}/loans/${loanId}`, updatedLoan);
      await fetchLoans(); // Refresh list
    } catch (error) {
      console.error('Error updating loan:', error);
      alert('Failed to update loan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectLoan = (id) => {
    setSelectedLoanId(id);
    setCurrentPage('loanDetails');
  };

  const selectedLoan = loans.find(l => l.id === selectedLoanId);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'from-blue-500 to-cyan-500' },
    { id: 'loanCreation', label: 'New Loan', icon: Plus, color: 'from-purple-500 to-pink-500' },
    { id: 'myLoans', label: 'My Loans', icon: FileText, color: 'from-orange-500 to-red-500' },
    { id: 'reports', label: 'Reports', icon: BarChart3, color: 'from-green-500 to-emerald-500' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'from-indigo-500 to-purple-500' }
  ];

  const totalInterestPaid = loans.reduce((sum, l) => sum + (parseFloat(l.totalInterestPaid) || 0), 0);

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

        {/* Total Interest Card - Matching Screenshot */}
        <div className="p-6 mt-auto">
          <div className="bg-[#1e293b] rounded-3xl p-6 border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-purple-500/20 transition-all"></div>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Total Interest</p>
            <p className="text-3xl font-black text-white tracking-tight">₹{totalInterestPaid.toLocaleString()}</p>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-full mt-6 flex items-center justify-center gap-3 px-6 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-bold transition-all duration-300 border border-red-500/20 shadow-lg"
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
              <Dashboard loans={loans} onSelectLoan={handleSelectLoan} />
            )}
            {currentPage === 'myLoans' && (
              <MyLoans loans={loans} onSelectLoan={handleSelectLoan} />
            )}
            {currentPage === 'loanCreation' && (
              <LoanCreation 
                onAddLoan={handleAddLoan} 
                onPreviewBill={setShowBillLoan}
                currentBranch={currentBranch}
              />
            )}
            {currentPage === 'loanDetails' && selectedLoan && (
              <LoanDetails 
                loan={selectedLoan} 
                onUpdateLoan={(updates) => handleUpdateLoan(selectedLoan.id, updates)} 
              />
            )}
            {currentPage === 'reports' && (
              <Reports loans={loans} />
            )}
            {currentPage === 'settings' && (
              <SettingsPage 
                currentBranch={currentBranch} 
                onUpdateBranch={onUpdateBranch} 
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
