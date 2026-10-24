import React, { useState, useEffect } from 'react';
import { 
  X, 
  LogIn, 
  User, 
  Users, 
  ShieldCheck, 
  Sprout, 
  Truck, 
  Store, 
  ShoppingBag, 
  KeyRound, 
  ArrowRight, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const LoginModal = ({ 
  isOpen, 
  onClose, 
  onLoginSuccess,
  currentRole = 'farmer'
}) => {
  const [activeTab, setActiveTab] = useState('personas'); // 'personas' | 'signin' | 'register'
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sign In form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginRole, setLoginRole] = useState(currentRole);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('farmer');
  const [regPhone, setRegPhone] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:8000/auth/users');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users) && data.users.length > 0) {
          setPersonas(data.users);
          return;
        }
      }
    } catch (err) {
      console.debug('Failed to fetch auth personas:', err);
    }

    // Fallback baseline personas
    setPersonas([
      { id: 1, name: 'System Administrator', role: 'admin', email: 'admin@agrichain.io', onchain_role: 'DEFAULT_ADMIN_ROLE' },
      { id: 2, name: 'Rahul Patil (Farmer)', role: 'farmer', email: 'rahul@greenfarms.in', onchain_role: 'FARMER_ROLE' },
      { id: 3, name: 'Safexpress Logistics', role: 'logistics', email: 'dispatch@safexpress.com', onchain_role: 'LOGISTICS_ROLE' },
      { id: 4, name: 'Pune Fresh DarkStore Hub', role: 'darkstore', email: 'anand@punefresh.in', onchain_role: 'RETAILER_ROLE' },
      { id: 5, name: 'Priya Sharma', role: 'consumer', email: 'priya.sharma@gmail.com', onchain_role: 'CONSUMER' },
    ]);
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      fetchUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPersona = async (persona) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username_or_email: persona.username || persona.email, role: persona.role })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Welcome, ${data.user.name}!`);
        onLoginSuccess(data.user);
        onClose();
      } else {
        setErrorMsg(data.detail || 'Login failed.');
      }
    } catch (err) {
      // Local fallback
      setSuccessMsg(`Welcome, ${persona.name}!`);
      onLoginSuccess(persona);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username_or_email: loginIdentifier.trim(), 
          role: loginRole 
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Logged in as ${data.user.name}`);
        onLoginSuccess(data.user);
        onClose();
      } else {
        setErrorMsg(data.detail || 'Invalid username or credentials.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      setErrorMsg('Name and email are required.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const createRes = await fetch('http://localhost:8000/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          role: regRole,
          phone: regPhone.trim() || undefined,
          grant_onchain: true
        })
      });
      const createData = await createRes.json();
      if (createRes.ok && createData.success) {
        setSuccessMsg(`Account created for ${createData.user.name}!`);
        onLoginSuccess(createData.user);
        onClose();
      } else {
        setErrorMsg(createData.detail || 'Failed to register account.');
      }
    } catch (err) {
      setErrorMsg('Error creating account on server.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch ((role || '').toLowerCase()) {
      case 'farmer':
        return <Sprout className="w-5 h-5 text-emerald-700" />;
      case 'logistics':
        return <Truck className="w-5 h-5 text-sky-700" />;
      case 'darkstore':
        return <Store className="w-5 h-5 text-amber-700" />;
      case 'consumer':
        return <ShoppingBag className="w-5 h-5 text-purple-700" />;
      case 'admin':
        return <ShieldCheck className="w-5 h-5 text-[#3D4E2A]" />;
      default:
        return <User className="w-5 h-5 text-gray-700" />;
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch ((role || '').toLowerCase()) {
      case 'farmer':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'logistics':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'darkstore':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'consumer':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-[#FAF7F0] text-[#3D4E2A] border-[#E6E1D5]';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-fadeIn">
      <div className="bg-[#FAF7F0] border border-[#E6E1D5] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#E6E1D5] flex items-center justify-between bg-white/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#354424] text-white flex items-center justify-center shadow-xs">
              <KeyRound className="w-5 h-5 text-[#FAF7F0]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#2D2620] leading-tight">
                AgriChain Authentication
              </h2>
              <p className="text-xs text-[#666057] font-medium">
                Switch participant persona or sign into your account
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center text-[#666057] hover:text-[#2D2620] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-3 pb-1 border-b border-[#E6E1D5] flex gap-2 bg-[#FAF7F0]">
          <button
            onClick={() => setActiveTab('personas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'personas'
                ? 'bg-[#354424] text-white shadow-xs'
                : 'text-[#666057] hover:text-[#2D2620] hover:bg-white/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Click Personas</span>
          </button>
          <button
            onClick={() => setActiveTab('signin')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'signin'
                ? 'bg-[#354424] text-white shadow-xs'
                : 'text-[#666057] hover:text-[#2D2620] hover:bg-white/60'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-[#354424] text-white shadow-xs'
                : 'text-[#666057] hover:text-[#2D2620] hover:bg-white/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>New Account</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: 1-Click Personas */}
          {activeTab === 'personas' && (
            <div className="space-y-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C8275] block mb-2">
                Select an authorized supply-chain persona
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {personas.map((p) => {
                  return (
                    <button
                      key={p.id || p.username}
                      onClick={() => handleSelectPersona(p)}
                      disabled={loading}
                      className="w-full text-left p-3.5 rounded-2xl bg-white hover:bg-[#F5F2EA] border border-[#E6E1D5] hover:border-[#354424] transition-all flex items-center justify-between gap-3 shadow-2xs group cursor-pointer active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF7F0] border border-[#E6E1D5] flex items-center justify-center flex-shrink-0 group-hover:bg-white transition-colors">
                          {getRoleIcon(p.role)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-extrabold text-[#2D2620] group-hover:text-[#354424] transition-colors truncate">
                              {p.name}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${getRoleBadgeStyle(p.role)}`}>
                              {p.role?.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs text-[#666057] block truncate mt-0.5">
                            {p.email}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-[#354424] opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Enter</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Sign In */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#666057] block mb-1">
                  Username or Email Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. rahul@greenfarms.in or admin"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full text-xs font-medium p-3 rounded-xl bg-white border border-[#E6E1D5] text-[#2D2620] focus:outline-none focus:border-[#354424] shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#666057] block mb-1">
                  Role / Portal
                </label>
                <select
                  value={loginRole}
                  onChange={(e) => setLoginRole(e.target.value)}
                  className="w-full text-xs font-bold p-3 rounded-xl bg-white border border-[#E6E1D5] text-[#2D2620] focus:outline-none focus:border-[#354424] shadow-2xs cursor-pointer"
                >
                  <option value="farmer">🌿 Farmer Portal</option>
                  <option value="logistics">🚛 Logistics & Telematics</option>
                  <option value="darkstore">🏬 Dark Store Micro-Hub</option>
                  <option value="consumer">🛒 Consumer Marketplace</option>
                  <option value="admin">⚡ Master Governance & Security</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#354424] hover:bg-[#2B381D] text-white py-3.5 rounded-2xl text-xs font-black shadow-sm cursor-pointer transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              </button>
            </form>
          )}

          {/* TAB 3: Register */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#666057] block mb-1">
                  Full Name / Organization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kavita Deshmukh"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full text-xs font-medium p-3 rounded-xl bg-white border border-[#E6E1D5] text-[#2D2620] focus:outline-none focus:border-[#354424] shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#666057] block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. kavita@nashikfarms.in"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full text-xs font-medium p-3 rounded-xl bg-white border border-[#E6E1D5] text-[#2D2620] focus:outline-none focus:border-[#354424] shadow-2xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#666057] block mb-1">
                    Supply-Chain Role
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full text-xs font-bold p-3 rounded-xl bg-white border border-[#E6E1D5] text-[#2D2620] focus:outline-none focus:border-[#354424] shadow-2xs cursor-pointer"
                  >
                    <option value="farmer">🌿 Farmer</option>
                    <option value="logistics">🚛 Logistics</option>
                    <option value="darkstore">🏬 Dark Store</option>
                    <option value="consumer">🛒 Consumer</option>
                    <option value="admin">⚡ Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#666057] block mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="+91 94231 ..."
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full text-xs font-medium p-3 rounded-xl bg-white border border-[#E6E1D5] text-[#2D2620] focus:outline-none focus:border-[#354424] shadow-2xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#354424] hover:bg-[#2B381D] text-white py-3.5 rounded-2xl text-xs font-black shadow-sm cursor-pointer transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                <Users className="w-4 h-4" />
                <span>{loading ? 'Creating Account & Granting...' : 'Create Account & Enter'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-[#FAF7F0] border-t border-[#E6E1D5] flex items-center justify-between text-[11px] text-[#8C8275]">
          <span>Role-Based Access Control (RBAC)</span>
          <span className="font-bold text-[#354424]">EVM + SQLite Identity</span>
        </div>

      </div>
    </div>
  );
};
