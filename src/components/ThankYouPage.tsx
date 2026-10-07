import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, MessageCircle, ArrowRight } from 'lucide-react';
import { LeadData } from '../types';
import { getResolvedIntegrationsConfig } from '../data';

interface ThankYouPageProps {
  lead?: LeadData;
  redirectUrl?: string;
  calendlyUrl?: string;
  onContactCommercial?: () => void;
  onScheduleCalendly?: () => void;
}

export default function ThankYouPage({ 
  lead, 
  redirectUrl,
  calendlyUrl,
  onContactCommercial,
  onScheduleCalendly
}: ThankYouPageProps) {
  const config = getResolvedIntegrationsConfig();

  const WHATSAPP_COMMERCIAL_URL = 'https://api.whatsapp.com/send/?phone=5515981669784&text=Ol%C3%A1.+tudo+bem%3F+Acabei+de+preencher+o+formul%C3%A1rio+da+Ser%C3%A1+Cacau.&type=phone_number&app_absent=0';
  const CALENDLY_DEFAULT_URL = 'https://calendly.com/comercial-seracacau/30min';

  // URLs for Botão A (Calendly) and Botão B (WhatsApp)
  const targetCalendlyUrl = calendlyUrl || config.calendlyUrl || CALENDLY_DEFAULT_URL;
  const targetWhatsAppUrl = redirectUrl || config.redirectUrl || WHATSAPP_COMMERCIAL_URL;

  // Get user's first name if passed via query params or lead data, defaulting to 'Renato'
  const [userName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const n = params.get('nome') || params.get('name') || '';
      if (n) return n.trim();
    }
    return lead?.nome?.trim() || 'Renato';
  });

  const rawFirstName = userName ? userName.split(' ')[0] : 'Renato';
  const personName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1);

  // Track conversion on land
  useEffect(() => {
    if ((window as any).fbq && !(window as any).__metaPixelThankYouTracked) {
      try {
        (window as any).fbq('track', 'CompleteRegistration', {
          content_name: 'Página de Obrigado',
          status: true
        });
        (window as any).fbq('track', 'Lead', {
          content_name: 'Lead Página de Obrigado',
          status: true
        });
        (window as any).__metaPixelThankYouTracked = true;
      } catch (e) {
        console.error('Meta pixel error in thank you page:', e);
      }
    }
  }, []);

  const handleCalendlyClick = () => {
    if ((window as any).fbq) {
      try {
        (window as any).fbq('trackCustom', 'AgendarApresentacaoCalendly', {
          content_name: 'Botão A - Agendar Apresentação Calendly'
        });
      } catch (err) {}
    }
    if (onScheduleCalendly) {
      onScheduleCalendly();
    }
  };

  const handleWhatsAppClick = () => {
    if ((window as any).fbq) {
      try {
        (window as any).fbq('track', 'Contact', {
          content_name: 'Botão B - Fazer Primeiro Pedido WhatsApp'
        });
      } catch (err) {}
    }
    if (onContactCommercial) {
      onContactCommercial();
    }
  };

  return (
    <motion.div
      key="thank-you-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-xl mx-auto space-y-6 py-4 text-left"
      id="thank-you-view"
    >
      {/* Headline: Recebemos suas informações, Renato. */}
      <h1 className="font-display font-normal text-3xl sm:text-4xl md:text-[44px] text-white tracking-tight leading-[1.15]">
        Recebemos suas<br />
        informações, {personName}.
      </h1>

      {/* Subtitle */}
      <p className="text-neutral-300 font-sans font-light text-[15px] sm:text-base leading-relaxed">
        Última etapa! Escolha uma das opções abaixo para prosseguir com nosso time:
      </p>

      {/* Exatamente os 2 botões solicitados: BOTÃO A e BOTÃO B */}
      <div className="pt-2 space-y-3.5">
        {/* BOTÃO A: AGENDAR UMA CONSULTORIA GRATUITA COM O TIME COMERCIAL */}
        <a
          href={targetCalendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleCalendlyClick}
          className="group w-full bg-[#C88452] hover:bg-[#B57242] active:bg-[#A46336] text-white px-5 sm:px-6 py-4.5 sm:py-5 rounded-[4px] transition-all flex items-center justify-between gap-3 cursor-pointer shadow-lg hover:shadow-[#C88452]/25 hover:translate-y-[-1px] no-underline text-left"
          id="btn-calendly-schedule"
        >
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0 text-white">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="font-display font-medium text-xs sm:text-[13px] tracking-[0.08em] uppercase leading-snug text-white">
              AGENDAR UMA CONSULTORIA GRATUITA COM O TIME COMERCIAL
            </span>
          </div>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </a>

        {/* BOTÃO B: CONTINUAR COM O MEU PEDIDO PELO WHATSAPP */}
        <a
          href={targetWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsAppClick}
          className="group w-full bg-[#182B1F] hover:bg-[#1E3827] active:bg-[#132219] border border-[#25D366]/40 hover:border-[#25D366]/80 text-white px-5 sm:px-6 py-4.5 sm:py-5 rounded-[4px] transition-all flex items-center justify-between gap-3 cursor-pointer shadow-lg hover:shadow-[#25D366]/20 hover:translate-y-[-1px] no-underline text-left"
          id="btn-whatsapp-order"
        >
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center shrink-0 text-[#25D366]">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="font-display font-medium text-xs sm:text-[13px] tracking-[0.08em] uppercase leading-snug text-white">
              CONTINUAR COM O MEU PEDIDO PELO WHATSAPP
            </span>
          </div>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-[#25D366] opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </a>
      </div>
    </motion.div>
  );
}
