'use client'

import React, { useState } from 'react'
import { Eye, EyeOff, ArrowLeft, Activity, Shield, Zap, Sparkles, CheckCircle2, X, Loader2, User, Mail, Globe, Check, AlertCircle, ExternalLink, KeyRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api/client'
import ValidationPage from './ValidationPage'

interface LoginPageProps {
  onBack?: () => void
  onLoginSuccess?: (user: any) => void
}

export function LoginPage({ onBack, onLoginSuccess }: LoginPageProps = {}) {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showValidationPage, setShowValidationPage] = useState(false)
  const [formData, setFormData] = useState({
    email: 'admin@pulsefit.com',
    password: 'admin123',
    rememberMe: false
  })
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'ROLE_MEMBER'
  })
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [bgTheme, setBgTheme] = useState<'slate' | 'dark'>('slate')

  // Social Login States (Google & GitHub OAuth)
  const [socialModal, setSocialModal] = useState<'google' | 'github' | null>(null)
  const [socialLoading, setSocialLoading] = useState(false)
  const [socialError, setSocialError] = useState('')
  const [customSocial, setCustomSocial] = useState({
    name: '',
    email: '',
    role: 'ROLE_MEMBER'
  })

  // Forgot / Reset Password States
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotIdentifier, setForgotIdentifier] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('')
  const [showForgotPass, setShowForgotPass] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState('')

  const handleSocialLogin = async (provider: 'GOOGLE' | 'GITHUB', email: string, name: string, role: string = 'ROLE_MEMBER') => {
    if (!email || !email.includes('@')) {
      setSocialError('Please enter a valid email address.')
      return
    }
    setSocialLoading(true)
    setSocialError('')
    try {
      const res = await authApi.socialLogin({
        provider,
        email: email.trim().toLowerCase(),
        name: name ? name.trim() : email.split('@')[0],
        role: role || 'ROLE_MEMBER'
      })
      const { token, role: userRole, username } = res.data

      localStorage.setItem('pulsefit_token', token)
      localStorage.setItem('pulsefit_user', JSON.stringify({
        username: username,
        role: userRole,
        email: email.trim().toLowerCase()
      }))

      setSuccessMessage(`Authenticated via ${provider === 'GOOGLE' ? 'Google' : 'GitHub'} as ${userRole}! Saved to MySQL database. Redirecting...`)
      setErrorMessage('')
      setSocialModal(null)
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(token, userRole)
        navigate('/')
      }, 500)
    } catch (err: any) {
      console.error('Social login failed:', err)
      const errorMsg = err.response?.data?.error || `Social login with ${provider} failed. Please ensure auth-service is active.`
      setSocialError(errorMsg)
    } finally {
      setSocialLoading(false)
    }
  }

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError('')
    setForgotSuccess('')

    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your username or email.')
      return
    }
    if (!forgotNewPassword || forgotNewPassword.length < 4) {
      setForgotError('New password must be at least 4 characters.')
      return
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match.')
      return
    }

    setForgotLoading(true)
    try {
      const res = await authApi.resetPassword(forgotIdentifier.trim(), forgotNewPassword)
      setForgotSuccess(res.data.message || 'Password reset successfully in MySQL database!')
      
      // Update form state with new password and username
      setFormData(prev => ({
        ...prev,
        email: res.data.username || forgotIdentifier.trim(),
        password: forgotNewPassword
      }))
      setSuccessMessage(`Password updated in database for "${res.data.username || forgotIdentifier.trim()}"! You can now sign in.`)

      setTimeout(() => {
        setShowForgotModal(false)
        setForgotNewPassword('')
        setForgotConfirmPassword('')
        setForgotSuccess('')
      }, 1200)
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to reset password. Please check your username/email.'
      setForgotError(errorMsg)
    } finally {
      setForgotLoading(false)
    }
  }

  // If user opened the Validation Page, render it immediately
  if (showValidationPage) {
    return <ValidationPage onBack={() => setShowValidationPage(false)} />
  }

  const handleQuickRole = (username: string, pass: string, email: string) => {
    setFormData({
      email: email,
      password: pass,
      rememberMe: true
    })
    setErrorMessage('')
    setSuccessMessage(`Loaded ${username} credentials! Click 'Sign In with JWT' to log in.`)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setErrorMessage('')
  }

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }))
    setErrorMessage('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    const identifier = formData.email.trim()

    try {
      const res = await authApi.login(identifier, formData.password)
      const userData = {
        username: res.data.username,
        role: res.data.role,
        email: res.data.email
      }
      localStorage.setItem('pulsefit_token', res.data.token)
      localStorage.setItem('pulsefit_user', JSON.stringify(userData))
      setSuccessMessage(`Authenticated as ${res.data.username} (${res.data.role.replace('ROLE_', '')})! Entering dashboard...`)
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(userData)
        }
        navigate('/')
      }, 500)
    } catch (err: any) {
      console.warn('Backend login rejected:', err)
      const errorMsg = err.response?.data?.error || (err.response?.status === 401 ? 'Wrong username or password. Please check your credentials.' : 'Unable to connect to Auth Service. Please ensure microservices are running.')
      setErrorMessage(errorMsg)
      setSuccessMessage('')
      // STRICT: Never bypass or store fallback token. Dashboard access blocked!
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    if (!registerData.username.trim() || !registerData.password || !registerData.email.trim()) {
      setErrorMessage('Please fill in username, email, and password.')
      setLoading(false)
      return
    }

    try {
      const res = await authApi.register({
        username: registerData.username.trim(),
        email: registerData.email.trim(),
        password: registerData.password,
        role: registerData.role
      })
      setSuccessMessage(`User "${res.data.username}" created & saved into database! You can now sign in with your password.`)
      setFormData({
        email: res.data.username,
        password: registerData.password,
        rememberMe: true
      })
      setAuthMode('signin')
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Registration failed. Username or email may already exist in database.'
      setErrorMessage(errorMsg)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex overflow-hidden">
      {/* Left Panel - Image Section customized for PulseFIT Health Clubs */}
      <div className="hidden md:flex flex-1 relative overflow-hidden">
        {/* Back Button */}
        <div className="absolute top-5 left-5 z-20">
          <button
            onClick={() => {
              if (onBack) onBack()
              else navigate('/')
            }}
            className="w-9 h-9 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center hover:bg-black/60 transition-all text-white shadow-md"
            title="Back to Platform"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Project Custom Brand Image (Luxury high-tech fitness club) */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop"
            alt="PulseFIT Luxury Multi-Facility Center"
            className="w-full h-full object-cover scale-105"
          />
          {/* High-tech Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-950/20 to-slate-950/90" />
        </div>

        {/* Brand Information Overlay */}
        <div className="relative z-10 flex flex-col justify-end p-8 lg:p-10 text-white max-w-lg">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight">PulseFIT</span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  SOA Cloud
                </span>
              </div>
              <p className="text-[11px] text-slate-300">Multi-Facility Fitness & Attendance Platform</p>
            </div>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight mb-2 text-white leading-tight">
            Seamless Turnstile Access Across Every Facility.
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Real-time RFID & NFC access control, automated subscription renewals, and high-availability microservices for Downtown Elite, Uptown Olympic, and Westside Express clubs.
          </p>

          {/* Feature Highlights Pills */}
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-200">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10">
              <Shield className="w-3 h-3 text-emerald-400" />
              JWT Perimeter Security
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10">
              <Zap className="w-3 h-3 text-cyan-400" />
              &lt;50ms Gate Latency
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10">
              <Sparkles className="w-3 h-3 text-purple-400" />
              OpenFeign Mesh
            </span>
          </div>
        </div>
      </div>

      {/* Right Panel - Medium-sized, clean, ultra-accessible form container */}
      <div className={`flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-y-auto transition-colors duration-300 ${
        bgTheme === 'slate' ? 'bg-[#f0f4f8] text-black border-l border-slate-200' : 'bg-[#090d16] text-white border-l border-slate-800'
      }`}>
        {/* Action Controls in Top-Right: Validation Page & Theme Switcher */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {/* Validation Page Trigger */}
          <button
            type="button"
            onClick={() => setShowValidationPage(true)}
            className="px-3 py-1.5 text-xs font-bold rounded-full border shadow-sm flex items-center gap-1.5 transition-all bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500"
            title="Inspect Database Storage & Validate JWT Tokens"
          >
            <Shield className="w-3.5 h-3.5 text-white" />
            <span>Validation Page</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => setBgTheme(bgTheme === 'slate' ? 'dark' : 'slate')}
            className={`px-3 py-1.5 text-xs font-bold rounded-full border shadow-sm flex items-center gap-1.5 transition-all ${
              bgTheme === 'slate'
                ? 'bg-white border-slate-300 text-black hover:bg-slate-50'
                : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
            }`}
            title="Switch Background Color"
          >
            <span>{bgTheme === 'slate' ? '🌙 Dark' : '☀️ Slate'}</span>
          </button>
        </div>

        {/* Medium-sized Card: max-w-[380px] */}
        <div className="w-full max-w-[380px] my-auto">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 md:hidden mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Activity className="w-4 h-4" />
              </div>
              <span className={`font-extrabold text-lg ${bgTheme === 'slate' ? 'text-black' : 'text-white'}`}>PulseFIT</span>
            </div>
            <h1 className={`text-2xl font-black mb-1 tracking-tight ${bgTheme === 'slate' ? 'text-black' : 'text-white'}`}>
              Welcome Back
            </h1>
            <p className={`font-medium text-xs ${bgTheme === 'slate' ? 'text-slate-700' : 'text-slate-300'}`}>
              Sign in with your role-based credentials to access your portal.
            </p>
          </div>

          {/* Quick Role Selectors for Evaluation / Review */}
          <div className={`mb-3.5 p-3 rounded-xl border-2 shadow-sm ${
            bgTheme === 'slate' ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
          }`}>
            <p className={`text-[10px] font-black uppercase tracking-wider mb-2 ${
              bgTheme === 'slate' ? 'text-black' : 'text-slate-200'
            }`}>
              QUICK TEST CREDENTIALS:
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickRole('admin', 'admin123', 'admin@pulsefit.com')}
                className="px-2 py-1.5 text-xs font-black rounded-lg border-2 border-purple-500 bg-purple-100 text-black hover:bg-purple-200 transition-all text-center shadow-sm"
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole('staff_john', 'staff123', 'staff@pulsefit.com')}
                className="px-2 py-1.5 text-xs font-black rounded-lg border-2 border-cyan-500 bg-cyan-100 text-black hover:bg-cyan-200 transition-all text-center shadow-sm"
              >
                🧑‍💼 Staff
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole('member_alex', 'member123', 'alex@pulsefit.com')}
                className="px-2 py-1.5 text-xs font-black rounded-lg border-2 border-emerald-500 bg-emerald-100 text-black hover:bg-emerald-200 transition-all text-center shadow-sm"
              >
                🏃 Member
              </button>
            </div>
          </div>

          {/* Auth Mode Toggle: Sign In vs Register (Save to DB) */}
          <div className="flex rounded-xl p-1 bg-slate-200/90 dark:bg-slate-800/90 mb-3 border border-slate-300 dark:border-slate-700 shadow-sm">
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${
                authMode === 'signin'
                  ? 'bg-white text-black shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              🔑 Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${
                authMode === 'signup'
                  ? 'bg-white text-black shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              📝 Register (Save to DB)
            </button>
          </div>

          {/* Status Alerts */}
          {errorMessage && (
            <div role="alert" className="mb-3 p-2.5 rounded-lg bg-red-100 border-2 border-red-500 text-red-950 text-xs font-black shadow-sm flex items-start gap-2">
              <span className="text-sm">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div role="status" className="mb-3 p-2.5 rounded-lg bg-emerald-100 border-2 border-emerald-500 text-emerald-950 text-xs font-bold flex items-center gap-2 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {authMode === 'signin' ? (
            /* Sign In Form */
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Email / Username */}
              <div>
                <label htmlFor="email-input" className={`block text-xs font-bold mb-1 ${
                  bgTheme === 'slate' ? 'text-black' : 'text-slate-200'
                }`}>
                  Email Address or Username
                </label>
                <input
                  id="email-input"
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="admin@pulsefit.com or admin"
                  className="w-full px-3 py-2 text-sm text-black font-bold bg-white border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all placeholder:text-slate-400 shadow-sm"
                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password-input" className={`block text-xs font-bold mb-1 ${
                  bgTheme === 'slate' ? 'text-black' : 'text-slate-200'
                }`}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="w-full px-3 py-2 text-sm text-black font-bold pr-10 bg-white border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all placeholder:text-slate-400 shadow-sm"
                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200 rounded-full text-black transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-black" />
                    ) : (
                      <Eye className="w-4 h-4 text-black" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me + Forgot Password */}
              <div className="flex items-center justify-between text-xs py-0.5">
                <label className={`flex items-center space-x-1.5 font-bold cursor-pointer ${
                  bgTheme === 'slate' ? 'text-black' : 'text-slate-200'
                }`}>
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="w-3.5 h-3.5 text-black accent-black border-2 border-slate-400 rounded focus:ring-black"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotIdentifier(formData.email || '')
                    setForgotNewPassword('')
                    setForgotConfirmPassword('')
                    setForgotError('')
                    setForgotSuccess('')
                    setShowForgotModal(true)
                  }}
                  className={`font-bold underline underline-offset-2 cursor-pointer transition-colors ${
                    bgTheme === 'slate' ? 'text-black hover:text-blue-700' : 'text-emerald-400 hover:text-emerald-300'
                  }`}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 px-4 rounded-xl font-black text-sm transition-all shadow-md disabled:opacity-50 focus:ring-2 focus:ring-offset-2 ${
                  bgTheme === 'slate'
                    ? 'bg-black text-white hover:bg-slate-800 focus:ring-black'
                    : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600 focus:ring-emerald-500'
                }`}
              >
                {loading ? 'Authenticating with Auth Service...' : 'Sign In with JWT'}
              </button>
            </form>
          ) : (
            /* Register Form (Saves into Database) */
            <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
              <div>
                <label className={`block text-xs font-bold mb-1 ${bgTheme === 'slate' ? 'text-black' : 'text-slate-200'}`}>
                  New Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={registerData.username}
                  onChange={handleRegisterChange}
                  placeholder="e.g. trainer_dave or john"
                  className="w-full px-3 py-2 text-xs text-black font-bold bg-white border-2 border-slate-300 rounded-lg outline-none shadow-sm"
                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${bgTheme === 'slate' ? 'text-black' : 'text-slate-200'}`}>
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  placeholder="e.g. user@pulsefit.com"
                  className="w-full px-3 py-2 text-xs text-black font-bold bg-white border-2 border-slate-300 rounded-lg outline-none shadow-sm"
                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${bgTheme === 'slate' ? 'text-black' : 'text-slate-200'}`}>
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  placeholder="Create a strong password"
                  className="w-full px-3 py-2 text-xs text-black font-bold bg-white border-2 border-slate-300 rounded-lg outline-none shadow-sm"
                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${bgTheme === 'slate' ? 'text-black' : 'text-slate-200'}`}>
                  Platform Role
                </label>
                <select
                  name="role"
                  value={registerData.role}
                  onChange={handleRegisterChange}
                  className="w-full px-3 py-2 text-xs text-black font-bold bg-white border-2 border-slate-300 rounded-lg outline-none shadow-sm"
                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                >
                  <option value="ROLE_MEMBER">Member (Gym Access)</option>
                  <option value="ROLE_STAFF">Staff (Front Desk & Check-in)</option>
                  <option value="ROLE_ADMIN">Admin (Full System Controls)</option>
                </select>
              </div>

              <p className="text-[10px] text-slate-500 leading-tight">
                🔒 Credentials will be BCrypt-hashed and permanently stored in the Auth Service database table <code className="font-mono font-bold">users</code>.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md disabled:opacity-50"
              >
                {loading ? 'Saving to Database...' : 'Register User into Database'}
              </button>
            </form>
          )}

            {/* Divider */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t-2 ${bgTheme === 'slate' ? 'border-slate-300' : 'border-slate-800'}`}></div>
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className={`px-2.5 font-black uppercase tracking-wider ${
                  bgTheme === 'slate' ? 'bg-[#f0f4f8] text-black' : 'bg-[#090d16] text-slate-400'
                }`}>
                  or continue with
                </span>
              </div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSocialModal('google')
                  setSocialError('')
                  setCustomSocial({ name: '', email: '', role: 'ROLE_MEMBER' })
                }}
                className={`flex items-center justify-center px-3 py-2 border-2 rounded-lg transition-all text-xs font-black shadow-sm ${
                  bgTheme === 'slate'
                    ? 'border-slate-300 bg-white hover:bg-slate-100 text-black hover:border-slate-400'
                    : 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-white hover:border-slate-600'
                }`}
                title="Sign in with Google OAuth"
              >
                {/* Google SVG */}
                <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSocialModal('github')
                  setSocialError('')
                  setCustomSocial({ name: '', email: '', role: 'ROLE_MEMBER' })
                }}
                className={`flex items-center justify-center px-3 py-2 border-2 rounded-lg transition-all text-xs font-black shadow-sm ${
                  bgTheme === 'slate'
                    ? 'border-slate-300 bg-white hover:bg-slate-100 text-black hover:border-slate-400'
                    : 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-white hover:border-slate-600'
                }`}
                title="Sign in with GitHub OAuth"
              >
                {/* GitHub SVG */}
                <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>GitHub</span>
              </button>
            </div>

            {/* Validation Page Link */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowValidationPage(true)}
                className={`w-full py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                  bgTheme === 'slate'
                    ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-900 border-slate-300'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-emerald-400 border-slate-700'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Open Security & Database Validation Page &rarr;</span>
              </button>
            </div>
        </div>
      </div>

      {/* Google OAuth Modal */}
      {socialModal === 'google' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Sign in with Google</h3>
                  <p className="text-xs text-slate-500">to continue to PulseFIT AI Platform</p>
                </div>
              </div>
              <button
                onClick={() => setSocialModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Alert */}
            {socialError && (
              <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{socialError}</span>
              </div>
            )}

            {/* Body: Choose Account */}
            <div className="p-5 space-y-4">
              <div className="text-xs font-semibold text-slate-600">Choose a Google account</div>

              {/* Preset Google Accounts */}
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={socialLoading}
                  onClick={() => handleSocialLogin('GOOGLE', 'alex.mercer@gmail.com', 'Alex Mercer', 'ROLE_MEMBER')}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                      AM
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">Alex Mercer</div>
                      <div className="text-[11px] text-slate-500">alex.mercer@gmail.com</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                    Member
                  </span>
                </button>

                <button
                  type="button"
                  disabled={socialLoading}
                  onClick={() => handleSocialLogin('GOOGLE', 'sarah.connor@gmail.com', 'Sarah Connor', 'ROLE_STAFF')}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                      SC
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">Sarah Connor</div>
                      <div className="text-[11px] text-slate-500">sarah.connor@gmail.com</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                    Staff
                  </span>
                </button>

                <button
                  type="button"
                  disabled={socialLoading}
                  onClick={() => handleSocialLogin('GOOGLE', 'admin.pulsefit@gmail.com', 'David Miller', 'ROLE_ADMIN')}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                      DM
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">David Miller (Admin)</div>
                      <div className="text-[11px] text-slate-500">admin.pulsefit@gmail.com</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                </button>
              </div>

              {/* Or Use Custom Google Account */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide">
                  Or enter your own Google account
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Full Name (e.g. John Doe)"
                    value={customSocial.name}
                    onChange={(e) => setCustomSocial({ ...customSocial, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-black bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <input
                    type="email"
                    placeholder="Google Email (e.g. johndoe@gmail.com)"
                    value={customSocial.email}
                    onChange={(e) => setCustomSocial({ ...customSocial, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-black bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <div className="flex gap-2 items-center">
                    <select
                      value={customSocial.role}
                      onChange={(e) => setCustomSocial({ ...customSocial, role: e.target.value })}
                      className="px-3 py-2 text-xs border border-slate-300 rounded-lg text-black bg-slate-50 focus:bg-white outline-none flex-1"
                    >
                      <option value="ROLE_MEMBER">Role: Member</option>
                      <option value="ROLE_STAFF">Role: Staff</option>
                      <option value="ROLE_ADMIN">Role: Admin</option>
                    </select>
                    <button
                      type="button"
                      disabled={socialLoading || !customSocial.email}
                      onClick={() => handleSocialLogin('GOOGLE', customSocial.email, customSocial.name, customSocial.role)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {socialLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Continue</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Google Identity Service</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <Shield className="w-3 h-3" /> Auto-sync to MySQL
              </span>
            </div>
          </div>
        </div>
      )}

      {/* GitHub OAuth Modal */}
      {socialModal === 'github' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d1117] text-[#c9d1d9] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[#30363d] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-[#30363d] flex items-start justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <div>
                  <h3 className="font-bold text-base text-white">Authorize PulseFIT AI</h3>
                  <p className="text-xs text-[#8b949e]">OAuth 2.0 Identity Provider</p>
                </div>
              </div>
              <button
                onClick={() => setSocialModal(null)}
                className="text-[#8b949e] hover:text-white p-1 rounded-full hover:bg-[#21262d] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Alert */}
            {socialError && (
              <div className="mx-5 mt-4 p-3 bg-red-900/30 border border-red-700 text-red-300 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{socialError}</span>
              </div>
            )}

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 text-xs space-y-1.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Public Profile & Verified Email
                </div>
                <p className="text-[#8b949e] text-[11px]">
                  PulseFIT AI requests read-only access to synchronize your profile to the MySQL database.
                </p>
              </div>

              <div className="text-xs font-semibold text-[#8b949e]">Select a Developer profile</div>

              {/* Preset GitHub Profiles */}
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={socialLoading}
                  onClick={() => handleSocialLogin('GITHUB', 'alex.mercer@github.com', 'alex-mercer', 'ROLE_MEMBER')}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-[#30363d] bg-[#161b22] hover:bg-[#21262d] hover:border-[#8b949e] transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-700 text-white font-mono font-bold flex items-center justify-center text-xs">
                      octo
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">alex-mercer</div>
                      <div className="text-[11px] text-[#8b949e]">alex.mercer@github.com</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 font-bold px-2 py-0.5 rounded-full">
                    Member
                  </span>
                </button>

                <button
                  type="button"
                  disabled={socialLoading}
                  onClick={() => handleSocialLogin('GITHUB', 'dev@pulsefit.ai', 'pulsefit-engineer', 'ROLE_STAFF')}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-[#30363d] bg-[#161b22] hover:bg-[#21262d] hover:border-[#8b949e] transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-900 text-emerald-300 font-mono font-bold flex items-center justify-center text-xs">
                      eng
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">pulsefit-engineer</div>
                      <div className="text-[11px] text-[#8b949e]">dev@pulsefit.ai</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Staff
                  </span>
                </button>
              </div>

              {/* Custom GitHub Form */}
              <div className="pt-2 border-t border-[#30363d]">
                <div className="text-[11px] font-bold text-[#8b949e] mb-2 uppercase tracking-wide">
                  Or enter your GitHub handle
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="GitHub Username (e.g. torvalds)"
                    value={customSocial.name}
                    onChange={(e) => setCustomSocial({ ...customSocial, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#30363d] rounded-lg text-white bg-[#0d1117] focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <input
                    type="email"
                    placeholder="GitHub Email (e.g. user@github.com)"
                    value={customSocial.email}
                    onChange={(e) => setCustomSocial({ ...customSocial, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#30363d] rounded-lg text-white bg-[#0d1117] focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <div className="flex gap-2 items-center">
                    <select
                      value={customSocial.role}
                      onChange={(e) => setCustomSocial({ ...customSocial, role: e.target.value })}
                      className="px-3 py-2 text-xs border border-[#30363d] rounded-lg text-white bg-[#161b22] focus:ring-2 focus:ring-emerald-500 outline-none flex-1"
                    >
                      <option value="ROLE_MEMBER">Role: Member</option>
                      <option value="ROLE_STAFF">Role: Staff</option>
                      <option value="ROLE_ADMIN">Role: Admin</option>
                    </select>
                    <button
                      type="button"
                      disabled={socialLoading || !customSocial.email}
                      onClick={() => handleSocialLogin('GITHUB', customSocial.email, customSocial.name, customSocial.role)}
                      className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white font-bold text-xs rounded-lg transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {socialLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Authorize</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-[#161b22] border-t border-[#30363d] text-[11px] text-[#8b949e] flex items-center justify-between">
              <span>GitHub OAuth Services</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Shield className="w-3 h-3" /> Auto-sync to MySQL
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Forgot / Reset Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-sm">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Reset Password</h3>
                  <p className="text-xs text-slate-500">Update credentials in MySQL (<code className="text-[11px] font-mono bg-slate-200 px-1 py-0.5 rounded">pulsefit_auth.users</code>)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error / Success Notifications */}
            {forgotError && (
              <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}
            {forgotSuccess && (
              <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {/* Quick Test Accounts */}
            <div className="px-5 pt-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Quick Select User:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForgotIdentifier('admin@pulsefit.com')}
                  className="px-2.5 py-1 text-[11px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md border border-purple-200 transition-colors"
                >
                  👑 Admin
                </button>
                <button
                  type="button"
                  onClick={() => setForgotIdentifier('staff@pulsefit.com')}
                  className="px-2.5 py-1 text-[11px] font-bold bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-md border border-cyan-200 transition-colors"
                >
                  👤 Staff
                </button>
                <button
                  type="button"
                  onClick={() => setForgotIdentifier('alex@pulsefit.com')}
                  className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200 transition-colors"
                >
                  🏃 Member
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleResetPasswordSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username or Registered Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="e.g. admin or admin@pulsefit.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg text-black bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password (min 4 chars)
                </label>
                <div className="relative">
                  <input
                    type={showForgotPass ? 'text' : 'password'}
                    required
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-black bg-white focus:ring-2 focus:ring-amber-500 outline-none pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotPass(!showForgotPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showForgotPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showForgotPass ? 'text' : 'password'}
                  required
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-black bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-lg text-[11px] text-amber-800 flex items-center gap-2">
                <Shield className="w-3 h-3 text-amber-600 shrink-0" />
                <span>New password will be encrypted with BCrypt (10 salt rounds) and committed to MySQL.</span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2 px-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {forgotLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Update in Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default LoginPage
