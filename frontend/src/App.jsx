import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import TurnstileSimulator from './components/TurnstileSimulator';
import MemberManagement from './components/MemberManagement';
import SubscriptionManagement from './components/SubscriptionManagement';
import AttendanceAnalytics from './components/AttendanceAnalytics';
import ServiceHealth from './components/ServiceHealth';
import StaffConsole from './components/StaffConsole';
import MemberPortal from './components/MemberPortal';
import Demo from './components/ui/demo';
import ValidationPage from './components/ui/ValidationPage';
import AiInnovationHub from './components/AiInnovationHub';
import SwaggerPortal from './components/SwaggerPortal';
import { authApi } from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('turnstile');
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  // Check if a valid session already exists in localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('pulsefit_user');
    const savedToken = localStorage.getItem('pulsefit_token');

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        setUser(null);
      }
    } else {
      // First visit: First landing page is Sign In / Login page!
      setUser(null);
    }
  }, []);

  const autoLoginRole = async (targetRole, username, password) => {
    try {
      const res = await authApi.login(username, password);
      localStorage.setItem('pulsefit_token', res.data.token);
      const userData = {
        username: res.data.username,
        role: res.data.role,
        email: res.data.email
      };
      localStorage.setItem('pulsefit_user', JSON.stringify(userData));
      setUser(userData);
    } catch (err) {
      console.warn('Login to Auth Service failed:', err);
      // Fallback in case backend is offline
      const fallbackUser = {
        username: username,
        role: targetRole,
        email: `${username}@pulsefit.com`
      };
      localStorage.setItem('pulsefit_token', 'demo-jwt-token');
      localStorage.setItem('pulsefit_user', JSON.stringify(fallbackUser));
      setUser(fallbackUser);
    }
  };

  const handleSwitchRole = async (targetRole, username, password) => {
    await autoLoginRole(targetRole, username, password);
  };

  const handleLogout = () => {
    localStorage.removeItem('pulsefit_token');
    localStorage.removeItem('pulsefit_user');
    setUser(null);
  };

  // If user requested Validation Page from inside dashboard
  if (showValidation) {
    return <ValidationPage onBack={() => setShowValidation(false)} />;
  }

  // FIRST LANDING PAGE: If not logged in, render the Sign-In / Login Page first!
  if (!user) {
    return (
      <Demo 
        onLoginSuccess={(userData) => setUser(userData)} 
      />
    );
  }

  // ONCE AUTHENTICATED: Main Dashboard is displayed!
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navigation with Role Window Switcher */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        onOpenLogin={() => setShowLoginModal(true)}
        onSwitchRole={handleSwitchRole}
        onOpenSignInPage={handleLogout}
        onOpenValidation={() => setShowValidation(true)}
        onOpenSwagger={() => { setShowValidation(false); setActiveTab('swagger'); }}
      />

      {/* Main Content Area - Role-Based Windows */}
      <main style={{ flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '24px 20px' }}>
        
        {/* ROLE 1: MEMBER WINDOW */}
        {user?.role === 'ROLE_MEMBER' && (
          <MemberPortal user={user} />
        )}

        {/* ROLE 2: STAFF WINDOW */}
        {user?.role === 'ROLE_STAFF' && (
          <StaffConsole user={user} />
        )}

        {/* ROLE 3: ADMIN WINDOW */}
        {(!user || user?.role === 'ROLE_ADMIN') && (
          <>
            {activeTab === 'turnstile' && <TurnstileSimulator onCheckInSuccess={() => {}} />}
            {activeTab === 'members' && <MemberManagement />}
            {activeTab === 'subscriptions' && <SubscriptionManagement />}
            {activeTab === 'attendance' && <AttendanceAnalytics />}
            {activeTab === 'ai-hub' && <AiInnovationHub />}
            {activeTab === 'swagger' && <SwaggerPortal user={user} />}
            {activeTab === 'services' && <ServiceHealth />}
          </>
        )}

      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '16px 24px', fontSize: '0.74rem', color: 'var(--text-dim)', background: 'rgba(8, 9, 14, 0.92)' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>PulseFIT Health Clubs © 2026 — Enterprise SOA Platform</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {['Java 17', 'Spring Boot 3.2.5', 'Spring Cloud 2023', 'Netflix Eureka'].map(t => (
              <span key={t} style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', fontSize: '0.68rem' }}>{t}</span>
            ))}
          </div>
        </div>
      </footer>

      {/* Auth Modal (for switching roles in-dashboard) */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={(userData) => setUser(userData)}
      />

    </div>
  );
}
