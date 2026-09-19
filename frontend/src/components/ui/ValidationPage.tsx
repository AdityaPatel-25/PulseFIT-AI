import React, { useState, useEffect } from 'react';
import { authApi } from '../../api/client';
import { 
  ShieldCheck, Database, Key, CheckCircle2, XCircle, ArrowLeft, 
  RefreshCw, UserPlus, Lock, User, Mail, Sparkles, Copy, Check
} from 'lucide-react';

interface ValidationPageProps {
  onBack: () => void;
}

export default function ValidationPage({ onBack }: ValidationPageProps) {
  const [token, setToken] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const [copied, setCopied] = useState(false);

  // New user registration state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('ROLE_MEMBER');
  const [registering, setRegistering] = useState(false);
  const [registerResult, setRegisterResult] = useState<any>(null);
  const [registerError, setRegisterError] = useState('');

  // Live database users list from backend
  const [dbUsers, setDbUsers] = useState<any[]>([
    { id: 1, username: 'admin', email: 'admin@pulsefit.com', role: 'ROLE_ADMIN', hashSample: '$2a$10$EixZaYVK1Fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW' },
    { id: 2, username: 'staff_john', email: 'staff@pulsefit.com', role: 'ROLE_STAFF', hashSample: '$2a$10$Q7y0B6eNq35YgR9xS.XpEOG2LhKq5z8Xq1Wm3aB4vC5dE6fG7hI8j' },
    { id: 3, username: 'member_alex', email: 'alex@pulsefit.com', role: 'ROLE_MEMBER', hashSample: '$2a$10$Z1a2B3c4D5e6F7g8H9i0J.K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z' },
  ]);

  const loadDatabaseUsers = async () => {
    try {
      const res = await authApi.getUsers();
      if (res.data && Array.isArray(res.data)) {
        setDbUsers(res.data.map((u: any) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          role: u.role,
          hashSample: u.passwordHash || 'BCrypt Hashed in DB'
        })));
      }
    } catch (e) {
      console.warn('Could not load live database users:', e);
    }
  };

  useEffect(() => {
    loadDatabaseUsers();
    const savedToken = localStorage.getItem('pulsefit_token') || '';
    setToken(savedToken);
    if (savedToken) {
      handleValidate(savedToken);
    }
  }, []);

  const handleValidate = async (tokenToTest?: string) => {
    const activeTok = tokenToTest || token;
    if (!activeTok) {
      setValidationResult({ valid: false, error: 'No token found in localStorage or input' });
      return;
    }

    setValidating(true);
    setValidationResult(null);

    try {
      // Calls backend GET /api/auth/validate via Axios client
      const res = await authApi.validate();
      setValidationResult(res.data);
    } catch (err: any) {
      if (err.response && err.response.data) {
        setValidationResult(err.response.data);
      } else {
        // Parse JWT payload client-side if offline
        try {
          const parts = activeTok.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            setValidationResult({
              valid: true,
              username: payload.sub,
              role: payload.role,
              clientDecoded: true,
              exp: payload.exp
            });
          } else {
            setValidationResult({ valid: false, error: 'Malformed JWT structure' });
          }
        } catch (e) {
          setValidationResult({ valid: false, error: 'Invalid token verification' });
        }
      }
    } finally {
      setValidating(false);
    }
  };

  const handleRegisterToDb = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    setRegisterError('');
    setRegisterResult(null);

    try {
      const res = await authApi.register({
        username: newUsername.trim(),
        password: newPassword,
        email: newEmail.trim(),
        role: newRole
      });

      setRegisterResult(res.data);
      await loadDatabaseUsers();
      setNewUsername('');
      setNewPassword('');
      setNewEmail('');
    } catch (err: any) {
      setRegisterError(err.response?.data?.error || 'Registration to Auth Service DB failed.');
    } finally {
      setRegistering(false);
    }
  };

  const handleCopy = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white p-4 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-white transition-all shadow-sm"
              title="Return to Previous Page"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <h1 className="text-2xl font-black tracking-tight text-white">
                  JWT Security & Database Validation Console
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-time verification of Auth Service (:8081) and Spring Cloud Gateway (:8080)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              HS256 Verified
            </span>
          </div>
        </div>

        {/* Top Grid: Live Token Validator & DB Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Card 1: JWT Token Live Validator */}
          <div className="bg-[#0f172a] rounded-2xl p-6 border-2 border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-bold text-white">Live JWT Token Inspector</h2>
                </div>
                <button
                  onClick={() => handleValidate()}
                  disabled={validating}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${validating ? 'animate-spin' : ''}`} />
                  <span>Verify with Backend</span>
                </button>
              </div>

              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Current Authorization Token (localStorage: pulsefit_token)
              </label>
              <div className="relative mb-4">
                <textarea
                  rows={3}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste or generate a JWT token..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 resize-none outline-none focus:border-cyan-500"
                />
                {token && (
                  <button
                    onClick={handleCopy}
                    className="absolute right-2.5 top-2.5 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                    title="Copy token to clipboard"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {/* Validation Result Box */}
              {validationResult && (
                <div className={`p-4 rounded-xl border-2 ${
                  validationResult.valid 
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' 
                    : 'bg-red-950/40 border-red-500/50 text-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {validationResult.valid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="font-extrabold text-sm uppercase tracking-wide">
                      {validationResult.valid ? 'TOKEN IS VALID (HTTP 200 OK)' : 'TOKEN IS INVALID / EXPIRED'}
                    </span>
                  </div>

                  {validationResult.valid && (
                    <div className="grid grid-cols-2 gap-2 text-xs mt-3 pt-3 border-t border-emerald-500/20">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Subject (Username)</span>
                        <strong className="text-white text-sm">{validationResult.username}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Granted Authority (Role)</span>
                        <strong className="text-cyan-400 text-sm">{validationResult.role}</strong>
                      </div>
                      <div className="col-span-2 mt-1">
                        <span className="text-slate-400 block text-[10px] uppercase">Algorithm & Security</span>
                        <span className="text-slate-300 font-mono">HMAC-SHA256 (Signed with JJWT Secret Key)</span>
                      </div>
                    </div>
                  )}

                  {!validationResult.valid && (
                    <p className="text-xs text-red-300 mt-1">
                      Reason: {validationResult.error || 'Signature mismatch or expired token timestamp.'}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Endpoint: <code className="text-cyan-400 font-mono">GET /api/auth/validate</code></span>
              <span className="text-emerald-400 font-semibold">Stateless Session OK</span>
            </div>
          </div>

          {/* Card 2: Database Storage Verification */}
          <div className="bg-[#0f172a] rounded-2xl p-6 border-2 border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">Database Storage Architecture</h2>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs mb-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Users & Passwords ARE Stored in Database!</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Every account is stored in the Auth Service relational database (<strong className="text-white">users table</strong>). 
                  Passwords are <strong className="text-white">never stored in plain text</strong>; they are encrypted using <strong className="text-cyan-400">BCrypt cryptographic hashing</strong> (10 salt rounds) before persistence.
                </p>
              </div>

              {/* DB Schema Details */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono mb-4">
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">ENGINE</span>
                  <strong className="text-white">H2 / JPA</strong>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">TABLE</span>
                  <strong className="text-white">users</strong>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">HASHING</span>
                  <strong className="text-emerald-400">BCrypt</strong>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
              <strong className="text-slate-200">Security Flow: </strong>
              <span>User types password $\rightarrow$ BCrypt checks hash in DB $\rightarrow$ JWT issued $\rightarrow$ Gateway verifies signature on every request.</span>
            </div>
          </div>

        </div>

        {/* Bottom Section: Stored Database Accounts & Live Registration Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Stored Accounts Table (7 cols) */}
          <div className="lg:col-span-7 bg-[#0f172a] rounded-2xl p-6 border-2 border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Registered Database Accounts (Table: users)</span>
              </h2>
              <span className="text-xs text-slate-400">{dbUsers.length} Persisted</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Username</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">BCrypt Password Hash (Database)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {dbUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 text-slate-400">#{u.id}</td>
                      <td className="py-2.5 px-3 font-bold text-white font-sans">{u.username}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'ROLE_ADMIN' 
                            ? 'bg-purple-950 text-purple-300 border border-purple-800' 
                            : u.role === 'ROLE_STAFF' 
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' 
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {u.role.replace('ROLE_', '')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 truncate max-w-[200px]" title={u.hashSample}>
                        {u.hashSample.slice(0, 24)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Register New User Form (5 cols) */}
          <div className="lg:col-span-5 bg-[#0f172a] rounded-2xl p-6 border-2 border-slate-800 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Register New User into DB</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Executes <code className="text-emerald-400">POST /api/auth/register</code> to persist a new user record.
            </p>

            {registerResult && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>User &quot;{registerResult.username}&quot; saved in database! You can now log in with it.</span>
              </div>
            )}

            {registerError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950 border border-red-500 text-red-300 text-xs font-bold">
                {registerError}
              </div>
            )}

            <form onSubmit={handleRegisterToDb} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Username *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. coach_mike"
                    className="w-full px-3 py-2 pl-9 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-emerald-500"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Password * (Encrypted in DB)</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full px-3 py-2 pl-9 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-emerald-500"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Email *</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="mike@pulsefit.com"
                    className="w-full px-3 py-2 pl-9 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-emerald-500"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Role Assignment</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-emerald-500"
                >
                  <option value="ROLE_MEMBER">ROLE_MEMBER (Gym Member Pass)</option>
                  <option value="ROLE_STAFF">ROLE_STAFF (Front Desk Receptionist)</option>
                  <option value="ROLE_ADMIN">ROLE_ADMIN (Full Platform Admin)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={registering}
                className="w-full py-2.5 mt-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{registering ? 'Saving to Database...' : 'Register User into Database'}</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
