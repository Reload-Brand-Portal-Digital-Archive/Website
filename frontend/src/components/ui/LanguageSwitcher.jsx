import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = ({ className = '' }) => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('id') ? 'en' : 'id';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-xs font-mono uppercase tracking-widest ${className}`}
      title={i18n.language.startsWith('id') ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
    >
      <Globe className="w-3.5 h-3.5" />
      <span>{i18n.language.startsWith('id') ? 'ID' : 'EN'}</span>
    </button>
  );
};

export default LanguageSwitcher;
