import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Save, Eye, EyeOff, Plus, Trash2, Settings as SettingsIcon, Lock, Zap, Building2, Gem, Loader2, FolderOpen, CloudUpload, CheckCircle2, Link2Off, Info } from 'lucide-react';

const Settings = ({ currentBranch, onUpdateBranch, isSuperAdmin = false }) => {
  const [settings, setSettings] = useState({
    goldRate: 8000,
    silverRate: 100,
    defaultInterestRate: 1.5,
    storagePath: '',
    adminPassword: '••••••••',
    staffPassword: '••••••••',
    staffModifyLoans: false,
    staffDeleteLoans: false,
    banks: ['SELF', 'ICICI']
  });

  const [showPasswords, setShowPasswords] = useState({ admin: false, staff: false });
  const [newBank, setNewBank] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [branches, setBranches] = useState([]);
  const [newBranch, setNewBranch] = useState({ branchName: '', username: '', password: '' });
  const [branchMsg, setBranchMsg] = useState({ text: '', error: false });
  const [addingBranch, setAddingBranch] = useState(false);
  const [folderBrowser, setFolderBrowser] = useState({ open: false, current: '', dirs: [], parent: null, loading: false, error: '' });
  const [drive, setDrive] = useState({ connected: false, email: '', folderId: '', folderName: '', loading: false });
  const [driveFolderBrowser, setDriveFolderBrowser] = useState({ open: false, parentId: 'root', folders: [], loading: false, breadcrumb: [{ id: 'root', name: 'My Drive' }] });
  const drivePollingRef = useRef(null);
  
  // Ornaments State
  const [ornaments, setOrnaments] = useState([]);
  const [newOrnament, setNewOrnament] = useState({ name: '', metalType: 'GOLD' });

  useEffect(() => {
    return () => { if (drivePollingRef.current) clearInterval(drivePollingRef.current); };
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await axios.get(`${apiUrl}/settings/branch/${currentBranch.id}`);
        setSettings(prev => ({ ...prev, ...response.data }));
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };

    const fetchOrnaments = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await axios.get(`${apiUrl}/settings/ornaments?branchId=${currentBranch.id}`);
        setOrnaments(response.data);
      } catch (err) {
        console.error('Error fetching ornaments:', err);
      }
    };
    const fetchDriveStatus = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const res = await axios.get(`${apiUrl}/auth/google/status`);
        setDrive(prev => ({ ...prev, ...res.data }));
      } catch {}
    };
    const fetchBranches = async () => {
      if (!isSuperAdmin) return;
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const res = await axios.get(`${apiUrl}/branches?adminId=${currentBranch.id}`);
        setBranches(res.data);
      } catch {}
    };
    fetchSettings();
    fetchOrnaments();
    fetchDriveStatus();
    fetchBranches();
  }, [currentBranch]);

  const handleAddOrnament = async () => {
    if (!newOrnament.name) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.post(`${apiUrl}/settings/ornaments`, {
        ...newOrnament,
        branchId: currentBranch.id
      });
      setOrnaments([...ornaments, response.data]);
      setNewOrnament({ name: '', metalType: 'GOLD' });
    } catch (err) {
      console.error('Error adding ornament:', err);
    }
  };

  const handleRemoveOrnament = async (id) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      await axios.delete(`${apiUrl}/settings/ornaments/${id}`);
      setOrnaments(ornaments.filter(o => o.id !== id));
    } catch (err) {
      console.error('Error deleting ornament:', err);
    }
  };

  const handleSettingChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const connectGoogleDrive = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const popup = window.open(`${apiUrl}/auth/google`, 'google-auth', 'width=520,height=620');
    if (drivePollingRef.current) clearInterval(drivePollingRef.current);
    const poll = setInterval(async () => {
      if (popup?.closed) { clearInterval(poll); drivePollingRef.current = null; return; }
      try {
        const res = await axios.get(`${apiUrl}/auth/google/status`);
        if (res.data.connected) {
          clearInterval(poll);
          drivePollingRef.current = null;
          popup?.close();
          setDrive(prev => ({ ...prev, ...res.data }));
        }
      } catch {}
    }, 3000);
    drivePollingRef.current = poll;
    setTimeout(() => { clearInterval(poll); drivePollingRef.current = null; }, 3 * 60 * 1000);
  };

  const disconnectGoogleDrive = async () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    await axios.post(`${apiUrl}/auth/google/disconnect`);
    setDrive({ connected: false, email: '', folderId: '', folderName: '', loading: false });
  };

  const openDriveFolderBrowser = async () => {
    setDriveFolderBrowser({ open: true, parentId: 'root', folders: [], loading: true, breadcrumb: [{ id: 'root', name: 'My Drive' }] });
    const apiUrl = import.meta.env.VITE_API_URL;
    const res = await axios.get(`${apiUrl}/auth/google/folders?parentId=root`);
    setDriveFolderBrowser(prev => ({ ...prev, loading: false, folders: res.data.folders }));
  };

  const navigateDriveFolder = async (folderId, folderName) => {
    setDriveFolderBrowser(prev => ({
      ...prev, loading: true, parentId: folderId,
      breadcrumb: [...prev.breadcrumb, { id: folderId, name: folderName }]
    }));
    const apiUrl = import.meta.env.VITE_API_URL;
    const res = await axios.get(`${apiUrl}/auth/google/folders?parentId=${folderId}`);
    setDriveFolderBrowser(prev => ({ ...prev, loading: false, folders: res.data.folders }));
  };

  const selectDriveFolder = async (folderId, folderName) => {
    const apiUrl = import.meta.env.VITE_API_URL;
    await axios.post(`${apiUrl}/auth/google/folder`, { folderId, folderName });
    setDrive(prev => ({ ...prev, folderId, folderName }));
    setDriveFolderBrowser(prev => ({ ...prev, open: false }));
  };

  const navigateBrowser = async (dirPath) => {
    setFolderBrowser(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await axios.get(`${apiUrl}/fs/dirs?path=${encodeURIComponent(dirPath)}`);
      setFolderBrowser(prev => ({ ...prev, loading: false, ...res.data }));
    } catch (err) {
      setFolderBrowser(prev => ({ ...prev, loading: false, error: err?.response?.data?.error || 'Cannot open folder' }));
    }
  };

  const openFolderBrowser = async () => {
    setFolderBrowser({ open: true, current: '', dirs: [], parent: null, loading: true, error: '' });
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await axios.get(`${apiUrl}/fs/dirs`);
      setFolderBrowser({ open: true, loading: false, error: '', ...res.data });
    } catch (err) {
      setFolderBrowser(prev => ({ ...prev, loading: false, error: err?.response?.data?.error || 'Could not read filesystem' }));
    }
  };

  const handleAddBank = () => {
    if (newBank && !settings.banks.includes(newBank)) {
      setSettings(prev => ({ ...prev, banks: [...prev.banks, newBank] }));
      setNewBank('');
    }
  };

  const handleRemoveBank = (bank) => {
    setSettings(prev => ({ ...prev, banks: prev.banks.filter(b => b !== bank) }));
  };

  const handleAddBranch = async () => {
    const { branchName, username, password } = newBranch;
    if (!branchName || !username || !password) { setBranchMsg({ text: 'All fields are required', error: true }); return; }
    setAddingBranch(true); setBranchMsg({ text: '', error: false });
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await axios.post(`${apiUrl}/branches?adminId=${currentBranch.id}`, { branchName, username, password });
      setBranches(prev => [...prev, res.data]);
      setNewBranch({ branchName: '', username: '', password: '' });
      setBranchMsg({ text: 'Branch created successfully', error: false });
    } catch (err) {
      setBranchMsg({ text: err.response?.data?.error || 'Failed to create branch', error: true });
    } finally { setAddingBranch(false); }
  };

  const handleDeleteBranch = async (id) => {
    if (!window.confirm('Delete this branch? This cannot be undone.')) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      await axios.delete(`${apiUrl}/branches/${id}?adminId=${currentBranch.id}`);
      setBranches(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete branch');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      await axios.put(`${apiUrl}/settings/branch/${currentBranch.id}`, {
        goldRate: parseFloat(settings.goldRate) || 0,
        silverRate: parseFloat(settings.silverRate) || 0,
        defaultInterestRate: parseFloat(settings.defaultInterestRate) || 0,
        storagePath: settings.storagePath || null
      });
      
      // Update the global branch state so other components reflect changes immediately
      if (onUpdateBranch) {
        onUpdateBranch({
          ...currentBranch,
          goldRate: settings.goldRate,
          silverRate: settings.silverRate,
          defaultInterestRate: settings.defaultInterestRate
        });
      }
      
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 lg:p-12 shadow-2xl">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 flex items-center gap-3">
            <SettingsIcon size={40} />
            Settings
          </h1>
          <p className="text-indigo-100 text-lg">Manage system parameters and preferences</p>
        </div>
      </div>

      {/* Success Message */}
      {saveMessage && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-4 flex items-center gap-3 text-green-300">
          <div className="w-6 h-6 rounded-full bg-green-500/30 flex items-center justify-center">✓</div>
          <span className="font-semibold">{saveMessage}</span>
        </div>
      )}

      {/* Gold & Silver Rates */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 lg:p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Zap size={28} className="text-yellow-400" />
          Precious Metal Rates
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-700/30 rounded-xl p-6 border border-white/5">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Gold Rate (₹/gram)</label>
            <input
              type="number"
              value={settings.goldRate}
              onChange={(e) => handleSettingChange('goldRate', e.target.value)}
              className="w-full px-4 py-3 bg-slate-600/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300 mb-3"
            />
            <p className="text-slate-400 text-sm">Current: <span className="text-yellow-400 font-bold">₹{(Number(settings.goldRate) || 0).toLocaleString('en-IN')}</span>/gram</p>
          </div>

          <div className="bg-slate-700/30 rounded-xl p-6 border border-white/5">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Silver Rate (₹/gram)</label>
            <input
              type="number"
              value={settings.silverRate}
              onChange={(e) => handleSettingChange('silverRate', e.target.value)}
              className="w-full px-4 py-3 bg-slate-600/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all duration-300 mb-3"
            />
            <p className="text-slate-400 text-sm">Current: <span className="text-slate-300 font-bold">₹{(Number(settings.silverRate) || 0).toLocaleString('en-IN')}</span>/gram</p>
          </div>

          <div className="bg-slate-700/30 rounded-xl p-6 border border-white/5">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Default Interest Rate (% p.m.)</label>
            <input
              type="number"
              step="0.1"
              value={settings.defaultInterestRate}
              onChange={(e) => handleSettingChange('defaultInterestRate', e.target.value)}
              className="w-full px-4 py-3 bg-slate-600/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 mb-3"
            />
            <p className="text-slate-400 text-sm">Current: <span className="text-purple-400 font-bold">{Number(settings.defaultInterestRate) || 0}%</span> per month</p>
          </div>
        </div>
      </div>

      {/* Storage Path */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 lg:p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <FolderOpen size={28} className="text-cyan-400" />
          Photo Storage Path
        </h2>
        <div className="bg-slate-700/30 rounded-xl p-6 border border-white/5">
          <label className="block text-sm font-semibold text-slate-300 mb-2">Storage Directory</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={settings.storagePath}
              onChange={(e) => handleSettingChange('storagePath', e.target.value)}
              placeholder="e.g. /Users/karthick/Documents/LoanPhotos"
              className="flex-1 px-4 py-3 bg-slate-600/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 font-mono text-sm"
            />
            <button
              type="button"
              onClick={openFolderBrowser}
              className="flex items-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-all duration-200 font-semibold text-sm whitespace-nowrap"
            >
              <FolderOpen size={16} />
              Browse
            </button>
          </div>
          <p className="text-slate-400 text-xs">
            Absolute path on this machine where photos are stored. Folder structure:
            <span className="text-cyan-400 font-mono ml-1">{'{path}'}/{'{customerId}'}/customer.jpg</span> and
            <span className="text-cyan-400 font-mono ml-1">{'{path}'}/{'{customerId}'}/{'{loanId}'}/ornament.jpg</span>.
            Leave blank to use the default server uploads folder.
          </p>
        </div>
      </div>

      {/* Google Drive Storage */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 lg:p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <CloudUpload size={28} className="text-blue-400" />
          Google Drive Storage
        </h2>

        {!drive.connected ? (
          <div className="bg-slate-700/30 rounded-xl p-6 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-white font-semibold mb-1">Connect Google Drive</p>
              <p className="text-slate-400 text-sm">When connected, all photos are uploaded directly to your Google Drive instead of local storage.</p>
              <p className="text-slate-500 text-xs mt-2">Requires <span className="text-blue-400 font-mono">GOOGLE_CLIENT_ID</span> and <span className="text-blue-400 font-mono">GOOGLE_CLIENT_SECRET</span> in your <span className="text-blue-400 font-mono">.env</span> file.</p>
            </div>
            <button
              onClick={connectGoogleDrive}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all shrink-0"
            >
              <CloudUpload size={16} /> Connect
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connected badge */}
            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-400" />
                <div>
                  <p className="text-white font-semibold text-sm">Connected</p>
                  <p className="text-slate-400 text-xs">{drive.email}</p>
                </div>
              </div>
              <button onClick={disconnectGoogleDrive} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-all">
                <Link2Off size={13} /> Disconnect
              </button>
            </div>

            {/* Folder picker */}
            <div className="bg-slate-700/30 rounded-xl p-5 border border-white/5">
              <label className="block text-sm font-semibold text-slate-300 mb-3">Upload Folder in Drive</label>
              <div className="flex gap-2">
                <div className="flex-1 px-4 py-2.5 bg-slate-600/50 border border-white/10 rounded-lg text-sm font-mono truncate text-white">
                  {drive.folderName || <span className="text-slate-500">No folder selected</span>}
                </div>
                <button
                  onClick={openDriveFolderBrowser}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all shrink-0"
                >
                  <FolderOpen size={15} /> Browse
                </button>
              </div>
              {drive.folderId && (
                <p className="text-slate-500 text-xs mt-2 font-mono">ID: {drive.folderId}</p>
              )}
              <p className="text-slate-400 text-xs mt-3">Photos will be saved as: <span className="text-blue-400 font-mono">{drive.folderName || 'folder'}/{'{customerId}'}/{'{loanId}'}/ornament.jpg</span></p>
            </div>
          </div>
        )}
      </div>

      {/* Login Passwords */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 lg:p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Lock size={28} className="text-red-400" />
          Security Settings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Password */}
          <div className="bg-slate-700/30 rounded-xl p-6 border border-white/5">
            <label className="block text-sm font-semibold text-slate-300 mb-3">Admin Password</label>
            <div className="flex gap-2">
              <input
                type={showPasswords.admin ? 'text' : 'password'}
                value={settings.adminPassword}
                onChange={(e) => handleSettingChange('adminPassword', e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-600/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
              />
              <button
                onClick={() => setShowPasswords(prev => ({ ...prev, admin: !prev.admin }))}
                className="px-4 py-3 bg-slate-600/50 border border-white/10 rounded-lg text-slate-300 hover:text-white hover:border-white/20 transition-all duration-300"
              >
                {showPasswords.admin ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-slate-400 text-xs mt-2">Full system access</p>
          </div>

          {/* Staff Password */}
          <div className="bg-slate-700/30 rounded-xl p-6 border border-white/5">
            <label className="block text-sm font-semibold text-slate-300 mb-3">Staff Password</label>
            <div className="flex gap-2">
              <input
                type={showPasswords.staff ? 'text' : 'password'}
                value={settings.staffPassword}
                onChange={(e) => handleSettingChange('staffPassword', e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-600/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
              <button
                onClick={() => setShowPasswords(prev => ({ ...prev, staff: !prev.staff }))}
                className="px-4 py-3 bg-slate-600/50 border border-white/10 rounded-lg text-slate-300 hover:text-white hover:border-white/20 transition-all duration-300"
              >
                {showPasswords.staff ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-slate-400 text-xs mt-2">Limited access based on permissions</p>
          </div>
        </div>
      </div>

      {/* Staff Permissions */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 lg:p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Staff Permissions</h2>

        <div className="space-y-3">
          <label className="flex items-start gap-4 p-4 bg-slate-700/30 rounded-xl border border-white/5 hover:border-white/10 cursor-pointer transition-all duration-300 group">
            <input
              type="checkbox"
              checked={settings.staffModifyLoans}
              onChange={(e) => handleSettingChange('staffModifyLoans', e.target.checked)}
              className="w-5 h-5 mt-1 accent-purple-500 rounded cursor-pointer"
            />
            <div className="flex-1">
              <p className="font-semibold text-white group-hover:text-slate-100 transition">Modify Loans</p>
              <p className="text-slate-400 text-sm">Allow staff members to edit and update existing loan records</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${settings.staffModifyLoans ? 'bg-purple-500/30 text-purple-300' : 'bg-slate-600/30 text-slate-400'}`}>
              {settings.staffModifyLoans ? '✓ Enabled' : '○ Disabled'}
            </span>
          </label>

          <label className="flex items-start gap-4 p-4 bg-slate-700/30 rounded-xl border border-white/5 hover:border-white/10 cursor-pointer transition-all duration-300 group">
            <input
              type="checkbox"
              checked={settings.staffDeleteLoans}
              onChange={(e) => handleSettingChange('staffDeleteLoans', e.target.checked)}
              className="w-5 h-5 mt-1 accent-red-500 rounded cursor-pointer"
            />
            <div className="flex-1">
              <p className="font-semibold text-white group-hover:text-slate-100 transition">Delete Loans</p>
              <p className="text-slate-400 text-sm">Allow staff members to permanently delete loan records</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${settings.staffDeleteLoans ? 'bg-red-500/30 text-red-300' : 'bg-slate-600/30 text-slate-400'}`}>
              {settings.staffDeleteLoans ? '✓ Enabled' : '○ Disabled'}
            </span>
          </label>
        </div>
      </div>

      {/* Ornament Management */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 lg:p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Gem size={28} className="text-purple-400" />
          Ornaments Menu
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <input
            type="text"
            value={newOrnament.name}
            onChange={(e) => setNewOrnament({ ...newOrnament, name: e.target.value })}
            placeholder="Ornament Name (e.g. Chain)"
            className="md:col-span-2 px-4 py-3 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          />
          <select
            value={newOrnament.metalType}
            onChange={(e) => setNewOrnament({ ...newOrnament, metalType: e.target.value })}
            className="px-4 py-3 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="GOLD">Gold</option>
            <option value="SILVER">Silver</option>
          </select>
        </div>
        <button
          onClick={handleAddOrnament}
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white py-3 rounded-lg font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Add to Menu
        </button>

        <div className="mt-8 overflow-hidden rounded-xl border border-white/5">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-700/50 text-slate-300 text-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Ornament Name</th>
                <th className="px-6 py-4 font-semibold">Metal</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ornaments.map((ornament) => (
                <tr key={ornament.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{ornament.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${ornament.metalType === 'GOLD' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-slate-500/20 text-slate-400'}`}>
                      {ornament.metalType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleRemoveOrnament(ornament.id)}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bank Details */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 lg:p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Building2 size={28} className="text-blue-400" />
          Bank Details
        </h2>

        <div className="flex flex-col lg:flex-row gap-3 mb-6">
          <input
            type="text"
            value={newBank}
            onChange={(e) => setNewBank(e.target.value)}
            placeholder="Enter new bank name"
            className="flex-1 px-4 py-3 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
          />
          <button
            onClick={handleAddBank}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} /> Add Bank
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {settings.banks.map((bank, index) => (
            <div key={index} className="flex items-center justify-between bg-slate-700/30 p-4 rounded-xl border border-white/5 hover:border-blue-500/50 transition-all duration-300 group">
              <span className="font-semibold text-white">{bank}</span>
              <button
                onClick={() => handleRemoveBank(bank)}
                className="text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-300"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6">
        <div className="flex gap-4">
          <Info size={24} className="text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-white mb-2">Security Notice</h3>
            <p className="text-slate-300 text-sm">
              Keep your admin password secure and change it regularly. Staff passwords should be unique and not shared among multiple staff members. All changes are logged for audit purposes.
            </p>
          </div>
        </div>
      </div>

      {/* Branch Management — Super Admin only */}
      {isSuperAdmin && (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 lg:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center"><Building2 className="text-indigo-400" size={20} /></div>
            <div>
              <h3 className="text-lg font-bold text-white">Branch Management</h3>
              <p className="text-slate-400 text-sm">Create and manage branch accounts.</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/5 mb-6">
            <table className="w-full">
              <thead className="bg-slate-900/50 text-slate-400 text-left">
                <tr>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider">Branch Name</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider">Username</th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {branches.length === 0 && (
                  <tr><td colSpan={3} className="px-5 py-6 text-center text-slate-500 text-sm">No branches yet</td></tr>
                )}
                {branches.map(b => (
                  <tr key={b.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-4 text-white font-semibold">{b.branchName}</td>
                    <td className="px-5 py-4 text-slate-300 font-mono text-sm">{b.username}</td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => handleDeleteBranch(b.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={newBranch.branchName} onChange={e => setNewBranch(p => ({ ...p, branchName: e.target.value }))} placeholder="Branch Name" className="bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
            <input value={newBranch.username} onChange={e => setNewBranch(p => ({ ...p, username: e.target.value }))} placeholder="Username" className="bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
            <input value={newBranch.password} onChange={e => setNewBranch(p => ({ ...p, password: e.target.value }))} placeholder="Password" type="password" className="bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          {branchMsg.text && <p className={`text-xs mt-2 ${branchMsg.error ? 'text-red-400' : 'text-green-400'}`}>{branchMsg.text}</p>}
          <button onClick={handleAddBranch} disabled={addingBranch} className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all">
            {addingBranch ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Add Branch
          </button>
        </div>
      )}

      {/* Save Button */}
      <div className="flex gap-4 justify-end flex-wrap">
        <button className="px-8 py-3 border border-white/10 text-white rounded-lg hover:bg-white/5 font-semibold transition-all duration-300">
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>

    {/* Google Drive Folder Browser Modal */}
    {driveFolderBrowser.open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-slate-800 border border-white/10 rounded-2xl w-[520px] max-h-[560px] flex flex-col shadow-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <CloudUpload size={18} className="text-blue-400" /> Select Drive Folder
            </h3>
            <button onClick={() => setDriveFolderBrowser(prev => ({ ...prev, open: false }))} className="text-slate-400 hover:text-white text-lg">✕</button>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 px-5 py-3 bg-slate-700/40 border-b border-white/5 flex-wrap">
            {driveFolderBrowser.breadcrumb.map((crumb, i) => (
              <span key={crumb.id} className="flex items-center gap-1">
                {i > 0 && <span className="text-slate-600">/</span>}
                <button
                  onClick={async () => {
                    const newCrumb = driveFolderBrowser.breadcrumb.slice(0, i + 1);
                    setDriveFolderBrowser(prev => ({ ...prev, loading: true, parentId: crumb.id, breadcrumb: newCrumb }));
                    const apiUrl = import.meta.env.VITE_API_URL;
                    const res = await axios.get(`${apiUrl}/auth/google/folders?parentId=${crumb.id}`);
                    setDriveFolderBrowser(prev => ({ ...prev, loading: false, folders: res.data.folders }));
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold"
                >
                  {crumb.name}
                </button>
              </span>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto py-2 px-2">
            {driveFolderBrowser.loading && (
              <div className="flex items-center justify-center p-8 text-slate-400">
                <Loader2 size={20} className="animate-spin mr-2" /> Loading…
              </div>
            )}
            {!driveFolderBrowser.loading && driveFolderBrowser.folders.length === 0 && (
              <p className="text-slate-500 text-sm p-4 text-center">No subfolders — select this folder or go back</p>
            )}
            {!driveFolderBrowser.loading && driveFolderBrowser.folders.map(f => (
              <button
                key={f.id}
                onClick={() => navigateDriveFolder(f.id, f.name)}
                className="w-full text-left px-4 py-2.5 text-slate-200 hover:bg-slate-700/60 rounded-lg flex items-center gap-2 text-sm transition-all"
              >
                <FolderOpen size={15} className="text-yellow-400 shrink-0" />
                <span className="truncate">{f.name}</span>
              </button>
            ))}
          </div>

          <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between gap-3">
            <span className="text-slate-500 text-xs truncate">{driveFolderBrowser.breadcrumb.map(b => b.name).join(' / ')}</span>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setDriveFolderBrowser(prev => ({ ...prev, open: false }))} className="px-4 py-2 text-slate-300 hover:text-white text-sm font-semibold">Cancel</button>
              <button
                onClick={() => {
                  const crumb = driveFolderBrowser.breadcrumb[driveFolderBrowser.breadcrumb.length - 1];
                  selectDriveFolder(crumb.id, crumb.name);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all"
              >
                Select This Folder
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Folder Browser Modal */}
    {folderBrowser.open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-slate-800 border border-white/10 rounded-2xl w-[520px] max-h-[580px] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <FolderOpen size={18} className="text-cyan-400" /> Select Folder
            </h3>
            <button onClick={() => setFolderBrowser(prev => ({ ...prev, open: false }))} className="text-slate-400 hover:text-white text-lg leading-none">✕</button>
          </div>

          {/* Path bar */}
          <div className="flex items-center gap-2 px-5 py-3 bg-slate-700/40 border-b border-white/5">
            {folderBrowser.parent && (
              <button
                onClick={() => navigateBrowser(folderBrowser.parent)}
                className="shrink-0 text-cyan-400 hover:text-cyan-300 text-xs font-bold px-2 py-1 rounded bg-cyan-900/30 hover:bg-cyan-900/50 transition-all"
              >
                ← Up
              </button>
            )}
            <span className="text-slate-300 text-xs font-mono truncate">{folderBrowser.current || 'Loading…'}</span>
          </div>

          {/* Directory list */}
          <div className="flex-1 overflow-y-auto py-2 px-2">
            {folderBrowser.loading && (
              <div className="flex items-center justify-center p-8 text-slate-400">
                <Loader2 size={20} className="animate-spin mr-2" /> Loading…
              </div>
            )}
            {folderBrowser.error && (
              <p className="text-red-400 text-sm p-4 text-center">{folderBrowser.error}</p>
            )}
            {!folderBrowser.loading && !folderBrowser.error && folderBrowser.dirs.length === 0 && (
              <p className="text-slate-500 text-sm p-4 text-center">No subfolders found</p>
            )}
            {!folderBrowser.loading && folderBrowser.dirs.map(({ name, fullPath }) => (
              <button
                key={fullPath}
                onClick={() => navigateBrowser(fullPath)}
                className="w-full text-left px-4 py-2.5 text-slate-200 hover:bg-slate-700/60 rounded-lg flex items-center gap-2 text-sm transition-all"
              >
                <FolderOpen size={15} className="text-yellow-400 shrink-0" />
                <span className="truncate">{name}</span>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between gap-3">
            <span className="text-slate-500 text-xs font-mono truncate">{folderBrowser.current}</span>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setFolderBrowser(prev => ({ ...prev, open: false }))}
                className="px-4 py-2 text-slate-300 hover:text-white text-sm font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleSettingChange('storagePath', folderBrowser.current);
                  setFolderBrowser(prev => ({ ...prev, open: false }));
                }}
                disabled={!folderBrowser.current}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-lg text-sm font-bold transition-all"
              >
                Select This Folder
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Settings;
