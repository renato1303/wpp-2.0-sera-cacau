import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, ArrowRight } from 'lucide-react';
import { getResolvedIntegrationsConfig } from './data';
import { IntegrationConfig } from './types';
import AdminPanel from './components/AdminPanel';
import ThankYouPage from './components/ThankYouPage';

export default function App() {
  // Admin and Password-protection State fields
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('sensesales_admin_logged_in') === 'true';
  });
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  // Commercial team contact URL with dynamic kit/comboEscolhido message customization
  const [commercialUrl] = useState<string>(() => {
    let defaultText = 'Quero finalizar meu pedido aqui no WhatsApp.';
    let baseUrl = `https://api.whatsapp.com/send/?phone=5515981669784&text=${encodeURIComponent(defaultText)}&type=phone_number&app_absent=0`;
    
    if (typeof window !== 'undefined' && window.location.search) {
      const urlParams = new URLSearchParams(window.location.search);
      const kitEscolhido = urlParams.get('kit') || urlParams.get('comboEscolhido');
      if (kitEscolhido) {
        console.log('Kit escolhido pelo cliente:', kitEscolhido);
        const customText = `Quero finalizar meu pedido aqui no WhatsApp. Kit escolhido: ${kitEscolhido}.`;
        baseUrl = `https://api.whatsapp.com/send/?phone=5515981669784&text=${encodeURIComponent(customText)}&type=phone_number&app_absent=0`;
      }
    }
    return baseUrl;
  });

  // Calendly scheduling URL
  const [calendlyUrl] = useState<string>(() => {
    const config = getResolvedIntegrationsConfig();
    const base = config.calendlyUrl || 'https://calendly.com/comercial-seracacau/30min';
    if (typeof window !== 'undefined' && window.location.search) {
      const search = window.location.search.replace(/^\?/, '');
      if (search) {
        return `${base}${base.includes('?') ? '&' : '?'}${search}`;
      }
    }
    return base;
  });

  // Load and initialize marketing and analytics scripts (Meta Pixel, Google Analytics, GTM) on mount
  useEffect(() => {
    const config: IntegrationConfig = getResolvedIntegrationsConfig();

    // 1. Initialize Meta Pixel
    const pixelId = config.metaPixelId || '1378981757464908';
    try {
      (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

      if ((window as any).fbq) {
        const isAlreadyInitialized = (window as any).__metaPixelInitializedId === pixelId;
        const isPageViewAlreadyTracked = (window as any).__metaPixelPageViewTracked;
        const isAdmin = window.location.pathname.includes('/admin') || window.location.hash.includes('admin');

        if (!isAlreadyInitialized) {
          (window as any).fbq('set', 'autoConfig', false, pixelId);
          (window as any).fbq('init', pixelId);
          (window as any).__metaPixelInitializedId = pixelId;
        }

        if (!isPageViewAlreadyTracked && !isAdmin) {
          (window as any).fbq('track', 'PageView');
          (window as any).__metaPixelPageViewTracked = true;
        }

        // Fire CompleteRegistration and Lead on thank you landing
        if (!(window as any).__metaPixelThankYouTracked && !isAdmin) {
          (window as any).fbq('track', 'CompleteRegistration', {
            content_name: 'Página de Obrigado',
            status: true
          });
          (window as any).fbq('track', 'Lead', {
            content_name: 'Lead Página de Obrigado',
            status: true
          });
          (window as any).__metaPixelThankYouTracked = true;
        }
      }
    } catch (e) {
      console.error('Failed to initialize Meta Pixel:', e);
    }

    // 2. Initialize Google Analytics
    if (config.gaTrackingId && config.gaTrackingId !== 'G-XXXXXXXXXX') {
      try {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${config.gaTrackingId}`;
        document.head.appendChild(script);

        (window as any).dataLayer = (window as any).dataLayer || [];
        function gtag(...args: any[]) {
          (window as any).dataLayer.push(arguments);
        }
        (window as any).gtag = gtag;
        (window as any).gtag('js', new Date());
        (window as any).gtag('config', config.gaTrackingId);
      } catch (e) {
        console.error('Failed to initialize Google Analytics:', e);
      }
    }

    // 3. Initialize Google Tag Manager
    if (config.gtmId && config.gtmId !== 'GTM-XXXXXXX') {
      try {
        (window as any).dataLayer = (window as any).dataLayer || [];
        (window as any).dataLayer.push({
          'gtm.start': new Date().getTime(),
          event: 'gtm.js'
        });

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtm.js?id=${config.gtmId}`;
        document.head.appendChild(script);
      } catch (e) {
        console.error('Failed to initialize Google Tag Manager:', e);
      }
    }
  }, []);

  // Listen to path changes and hashes to support /admin and #admin routing cleanly
  useEffect(() => {
    const handleLocationRouting = () => {
      const pathSuffix = window.location.pathname;
      const hashVal = window.location.hash;
      if (pathSuffix.endsWith('/admin') || hashVal === '#admin') {
        setIsAdminRoute(true);
      } else {
        setIsAdminRoute(false);
      }
    };

    handleLocationRouting();
    window.addEventListener('hashchange', handleLocationRouting);
    return () => window.removeEventListener('hashchange', handleLocationRouting);
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    let correctPassword = 'sensesales@admin';
    const storedConfig = localStorage.getItem('sensesales_integrations_config');
    if (storedConfig) {
      try {
        const config: IntegrationConfig = JSON.parse(storedConfig);
        if (config.adminPassword) {
          correctPassword = config.adminPassword;
        }
      } catch (err) {
        console.error('Error parsing config password', err);
      }
    }

    if (adminPasswordInput === correctPassword) {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('sensesales_admin_logged_in', 'true');
      setAdminLoginError(null);
    } else {
      setAdminLoginError('Senha incorreta. Por favor verifique e tente novamente.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('sensesales_admin_logged_in');
    setAdminPasswordInput('');
    window.location.hash = '';
    
    if (window.location.pathname.endsWith('/admin')) {
      window.history.pushState(null, '', window.location.pathname.replace(/\/admin$/, ''));
    }
    setIsAdminRoute(false);
  };

  if (isAdminRoute) {
    if (!isAdminAuthenticated) {
      return (
        <div className="min-h-screen grid-overlay bg-[#FAFAF8] flex flex-col items-center justify-center p-4 relative font-sans overflow-hidden">
          <div className="absolute inset-0 mesh-gradient pointer-events-none"></div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md p-8 md:p-10 glass-panel rounded-[32px] border border-gray-200 shadow-sm relative z-10 space-y-6 text-left"
          >
            <div className="text-center space-y-3">
              <img 
                src="/logo.png" 
                alt="Será Cacau" 
                className="h-11 w-auto object-contain mx-auto mb-2 select-none"
              />
              <div className="w-10 h-10 bg-[#008060]/10 border border-[#008060]/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Lock className="w-4 h-4 text-[#008060]" />
              </div>
              <h1 className="font-display font-bold text-2xl text-gray-900 tracking-tight">Painel do Integrador</h1>
              <p className="text-xs text-gray-500">
                Insira a senha do administrador cadastrada para controlar webhooks, leads, analytics e tags.
              </p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2">SENHA DE ACESSO</label>
                <input
                  type="password"
                  required
                  value={adminPasswordInput}
                  onChange={(e) => {
                    setAdminPasswordInput(e.target.value);
                    if (adminLoginError) setAdminLoginError(null);
                  }}
                  placeholder="Selecione ou insira a senha..."
                  className="w-full text-xs font-mono bg-white border border-gray-300 rounded-2xl p-4 text-gray-900 focus:border-[#008060] focus:outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              {adminLoginError && (
                <div className="text-xs text-rose-600 font-sans leading-relaxed bg-rose-50 border border-rose-100 p-3.5 rounded-xl text-center">
                  {adminLoginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-[#008060] hover:bg-[#00664d] text-white font-display font-medium text-sm tracking-wide rounded-2xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Acessar Painel</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  window.location.hash = '';
                  if (window.location.pathname.endsWith('/admin')) {
                    window.history.pushState(null, '', window.location.pathname.replace(/\/admin$/, ''));
                  }
                  setIsAdminRoute(false);
                }}
                className="text-xs font-mono text-gray-400 hover:text-gray-700 transition-colors"
              >
                ← VOLTAR PARA O INÍCIO
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#FAFAF8] text-gray-900 flex flex-col font-sans">
        <header className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Será Cacau" 
              className="h-8 sm:h-9 w-auto object-contain select-none"
            />
            <div className="h-6 w-[1px] bg-gray-200 mx-1 hidden sm:block" />
            <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center border border-[#14B8A6]/20">
              <Lock className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <div className="text-left">
              <span className="text-[10px] font-mono text-[#14B8A6] font-bold tracking-widest uppercase block">PAINEL DO ADMINISTRADOR</span>
              <h1 className="text-xs font-display font-medium text-gray-900 tracking-tight">Será Cacau Integrador</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleAdminLogout}
              className="text-xs font-mono bg-gray-50 hover:bg-gray-100 px-4 py-2 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 transition-all cursor-pointer"
            >
              SAIR DO PAINEL (LOGOUT)
            </button>
          </div>
        </header>

        <div className="flex-1 w-full bg-[#FAFAF8]">
          <AdminPanel onClose={handleAdminLogout} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-8 md:p-10 relative font-sans overflow-y-auto overflow-x-hidden text-neutral-100 selection:bg-white/20 selection:text-white">
      
      {/* Fixed Background Layer with Será Cacau Image at Low Opacity & Cinematic Vignette */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#0A0908]">
        {/* Será Cacau background image with low opacity */}
        <img 
          src="/IMG_5237_copiar.webp" 
          alt="Será Cacau Background" 
          className="w-full h-full object-cover object-center opacity-25 sm:opacity-30 scale-105 transition-transform duration-1000 ease-out"
        />

        {/* Soft ambient radial vignette */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(10, 9, 8, 0.45) 0%, rgba(10, 9, 8, 0.82) 65%, rgba(6, 5, 4, 0.98) 100%)'
          }}
        />

        {/* Top & bottom linear gradient scrims for contrast and depth */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(8, 7, 6, 0.9) 0%, rgba(8, 7, 6, 0.3) 35%, rgba(8, 7, 6, 0.55) 70%, rgba(6, 5, 4, 0.96) 100%)'
          }}
        />

        {/* Subtle warm ambient glow in center */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            background: 'radial-gradient(circle at 50% 45%, rgba(180, 115, 60, 0.16) 0%, transparent 60%)'
          }}
        />
      </div>

      {/* Header bar with centered luxury logo lockup */}
      <header className="w-full max-w-4xl mx-auto z-10 pt-4 sm:pt-6 pb-2 flex flex-col items-center gap-4">
        <div className="flex items-center justify-center w-full">
          <div 
            className="transition-transform hover:scale-[1.02] active:scale-[0.98]"
            title="Será Cacau"
          >
            <img 
              src="/logo.png" 
              alt="Será Cacau" 
              className="h-10 sm:h-12 md:h-14 w-auto object-contain select-none brightness-0 invert opacity-95 transition-opacity hover:opacity-100 drop-shadow-md"
              id="header-logo"
            />
          </div>
        </div>
      </header>

      {/* Main Container: ONLY THE THANK YOU PAGE */}
      <main className="w-full mx-auto flex-1 flex flex-col items-center justify-center z-10 py-6 my-auto max-w-xl px-4 sm:px-6">
        <ThankYouPage redirectUrl={commercialUrl} calendlyUrl={calendlyUrl} />
      </main>

      {/* Footer bar matching reference aesthetics */}
      <footer className="w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between text-[11px] font-sans text-neutral-400/80 z-10 py-5 px-4 gap-3 border-t border-white/10">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1">
          <span>SERÁ CACAU © 2026</span>
          <span className="hidden md:inline text-neutral-600">•</span>
          <span className="hover:text-white transition-colors cursor-pointer">POLÍTICA DE PRIVACIDADE</span>
          <span className="hidden md:inline text-neutral-600">•</span>
          <span className="hover:text-white transition-colors cursor-pointer">PREFERÊNCIAS DE COOKIES</span>
          <span className="hidden md:inline text-neutral-600">•</span>
          <span>DIRETRIZES LGPD</span>
        </div>
      </footer>

    </div>
  );
}
