import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const FloatingChat = () => {
  const { t } = useTranslation();
  const location = useLocation();

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <Link
      to="/contact"
      className="fixed bottom-0 right-0 z-50 flex items-center gap-2 bg-white text-[#ee4d2d] py-2 px-4 rounded-tl-xl shadow-[0_0_10px_rgba(0,0,0,0.1)] hover:bg-zinc-50 transition-colors pointer-events-auto cursor-pointer"
    >
      <div className="relative flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 7C21 5.89543 20.1046 5 19 5H17V15C17 16.1046 16.1046 17 15 17H7.5L7 19H17L21 22V7Z" fill="#ee4d2d"/>
          <path d="M16 3H4C2.89543 3 2 3.89543 2 5V14C2 15.1046 2.89543 16 4 16H6V19L10.5 16H16C17.1046 16 18 15.1046 18 14V5C18 3.89543 17.1046 3 16 3Z" fill="#ee4d2d"/>
          <path d="M6.5 9C6.5 9 8 11 10 11C12 11 13.5 9 13.5 9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <span className="font-sans font-medium text-lg tracking-wide">{t('nav.chat')}</span>
    </Link>
  );
};

export default FloatingChat;
