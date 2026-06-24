import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';

import { TopNavbar, Annotation, Sidebar } from './components/Layout';
import { SignUp } from './components/SignUp';
import { Dashboard } from './components/Dashboard';
import { Workspace } from './components/Workspace';
import { Marketplace } from './components/Marketplace';
import { Checkout } from './components/Checkout';
import { SettingsScreen } from './components/Settings';
import type { AppUser, Template } from './types';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:5000';

type Page = 'signup' | 'dashboard' | 'workspace' | 'marketplace' | 'checkout' | 'settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('signup');
  const [user, setUser] = useState<AppUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('speak2design_token'));
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);

  // Handle OAuth (Google/GitHub) return: ?token=... on success, ?oauth_error=... on failure.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get('token');
    const oauthError = params.get('oauth_error');
    if (oauthToken || oauthError) {
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      url.searchParams.delete('oauth');
      url.searchParams.delete('oauth_error');
      url.searchParams.delete('provider');
      window.history.replaceState({}, '', url.toString());
    }
    if (oauthError) {
      const provider = params.get('provider') || 'provider';
      const msg = oauthError === 'not_configured'
        ? `${provider[0].toUpperCase() + provider.slice(1)} login isn't configured yet.`
        : oauthError === 'no_email'
        ? 'Your account has no accessible email. Use email/password instead.'
        : 'Social login failed. Please try again.';
      toast.error(msg);
    }
    if (oauthToken) {
      localStorage.setItem('speak2design_token', oauthToken);
      setAuthToken(oauthToken);
      toast.success('Signed in successfully.');
    }
  }, []);

  useEffect(() => {
    const bootstrapSession = async () => {
      // A password-reset link (?reset=token) must always land on the auth screen
      // so the reset modal can handle it — even if a stale session token exists.
      if (new URLSearchParams(window.location.search).get('reset')) {
        setCurrentPage('signup');
        return;
      }
      if (!authToken) { setCurrentPage('signup'); return; }
      try {
        const res = await fetch(`${API_BASE}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (data.success) {
          const p = data.user;
          setUser({
            id: p._id,
            name: p.name,
            email: p.email,
            avatar: p.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
            tier: p.tier,
            usageCount: p.usageCount || 0
          });
          setCurrentPage('dashboard');
        } else { clearUserSession(); }
      } catch { clearUserSession(); }
    };
    bootstrapSession();
  }, [authToken]);

  const clearUserSession = () => {
    localStorage.removeItem('speak2design_token');
    setAuthToken(null); setUser(null); setCurrentPage('signup');
  };

  const handleAuthenticationSuccess = (token: string, userData: any) => {
    localStorage.setItem('speak2design_token', token);
    setUser(userData); setAuthToken(token); setCurrentPage('dashboard');
  };

  const handleNavigate = (page: string) => {
    if (page === 'logout') { clearUserSession(); toast.info('Logged out securely.'); return; }
    setCurrentPage(page as Page);
  };

  const handleNewProject = async () => {
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: 'Untitled Project', language: 'English' })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedProjectId(data.project._id);
        setCurrentPage('workspace');
      } else {
        toast.error('Failed to create project.');
      }
    } catch {
      setSelectedProjectId(null);
      setCurrentPage('workspace');
    }
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentPage('workspace');
  };

  const handleCheckout = (template: any) => {
    setSelectedTemplate(template); setCurrentPage('checkout');
  };

  const handleConfirmPurchase = () => {
    setShowPurchaseSuccess(true); setCurrentPage('dashboard');
    toast.success('Template purchased successfully!');
  };

  const handleUserUpdate = (updatedUser: any) => {
    setUser((prev: any) => ({
      ...prev,
      name: updatedUser.name || prev.name,
      email: updatedUser.email || prev.email,
      avatar: updatedUser.avatar || prev.avatar,
      tier: updatedUser.tier || prev.tier,
      usageCount: updatedUser.usageCount ?? prev.usageCount
    }));
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'signup':
        return <SignUp onAuthSuccess={handleAuthenticationSuccess} />;
      case 'dashboard':
        return (
          <Dashboard
            onNewProject={handleNewProject}
            onSelectProject={handleSelectProject}
            showSuccess={showPurchaseSuccess}
          />
        );
      case 'workspace':
        return <Workspace projectId={selectedProjectId} onBack={() => setCurrentPage('dashboard')} />;
      case 'marketplace':
        return <Marketplace onCheckout={handleCheckout} onBack={() => setCurrentPage('dashboard')} />;
      case 'checkout':
        return <Checkout template={selectedTemplate} onConfirm={handleConfirmPurchase} onBack={() => setCurrentPage('marketplace')} />;
      case 'settings':
        return (
          <SettingsScreen
            user={user}
            onBack={() => setCurrentPage('dashboard')}
            onUserUpdate={handleUserUpdate}
          />
        );
      default:
        return <SignUp onAuthSuccess={handleAuthenticationSuccess} />;
    }
  };

  const getAnnotationText = () => {
    switch (currentPage) {
      case 'signup':    return { title: 'Authenticating',    text: 'Create an account to save your voice-generated designs and access the marketplace.' };
      case 'dashboard': return { title: 'Project Dashboard', text: 'View all your recent designs. Filter by language and manage your project lifecycle.' };
      case 'workspace': return { title: 'Voice Canvas',      text: 'Press the microphone to activate AI transcription. Command the AI in English or Urdu.' };
      case 'marketplace': return { title: 'Asset Hub',       text: 'Buy professionally designed templates or sell your own voice-created masterpieces.' };
      case 'checkout':  return { title: 'Secure Payment',    text: 'Pay using EasyPaisa/JazzCash or International Cards via Stripe.' };
      case 'settings':  return { title: 'Personalization',   text: 'Update your profile, switch voice language, and manage your plan.' };
      default:          return { title: 'Speak2Design',      text: 'The future of UI design is vocal.' };
    }
  };

  const annotation = getAnnotationText();
  const showSidebar = !['signup', 'workspace'].includes(currentPage) && user !== null;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Inter',_sans-serif]">
      <Toaster position="top-center" richColors />
      {currentPage !== 'signup' && user && (
        <TopNavbar currentPage={currentPage} onNavigate={handleNavigate} user={user} />
      )}
      {showSidebar && <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />}
      <main className={`${showSidebar ? 'pl-64' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
      <Annotation title={annotation.title} text={annotation.text} />
    </div>
  );
}
