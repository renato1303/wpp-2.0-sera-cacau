import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { LeadData } from '../types';
import { getResolvedIntegrationsConfig } from '../data';

interface ThankYouPageProps {
  lead?: LeadData;
  redirectUrl?: string;
  onContactCommercial?: () => void;
}

export default function ThankYouPage({ 
  lead, 
  redirectUrl,
  onContactCommercial 
}: ThankYouPageProps) {
  const WHATSAPP_COMMERCIAL_URL = 'https://api.whatsapp.com/send/?phone=5515981669784&text=Ol%C3%A1.+tudo+bem%3F+Acabei+de+preencher+o+formul%C3%A1rio+da+Ser%C3%A1+Cacau.&type=phone_number&app_absent=0';

  // Commercial team contact URL
  const targetUrl = redirectUrl || WHATSAPP_COMMERCIAL_URL;

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

  const handleContactClick = (e: React.MouseEvent) => {
    if ((window as any).fbq) {
      try {
        (window as any).fbq('track', 'Contact', {
          content_name: 'Botão Falar com Time Comercial'
        });
      } catch (err) {}
    }
    if (onContactCommercial) {
      e.preventDefault();
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
      className="w-full max-w-xl mx-auto space-y-7 py-4 text-left"
      id="thank-you-view"
    >
      {/* Headline exactly matching: Recebemos suas informações, Renato. */}
      <h1 className="font-display font-normal text-3xl sm:text-4xl md:text-[44px] text-white tracking-tight leading-[1.15]">
        Recebemos suas<br />
        informações, {personName}.
      </h1>

      {/* Subtitle / text requested by user */}
      <p className="text-neutral-300 font-sans font-light text-[15px] sm:text-base leading-relaxed">
        Última etapa! Clique no botão abaixo para confirmar seus dados com nosso time
      </p>

      {/* Button to contact commercial team */}
      <div className="pt-2">
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleContactClick}
          className="bg-[#C88452] hover:bg-[#B57242] active:bg-[#A46336] text-white font-display font-medium text-xs sm:text-sm tracking-[0.14em] uppercase px-8 py-4 rounded-[3px] transition-all inline-flex items-center justify-center gap-2.5 cursor-pointer shadow-lg hover:shadow-[#C88452]/25 hover:translate-y-[-1px] text-center no-underline w-full sm:w-auto"
          id="btn-contact-commercial"
        >
          <span>FALAR COM O TIME COMERCIAL</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  );
}
