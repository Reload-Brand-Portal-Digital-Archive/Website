import React from 'react';
import { motion } from 'framer-motion';
import reloadLogoTransparent from '../../assets/reload_logo_transparent.png';
import { useTranslation } from 'react-i18next';

export default function MaintenanceScreen() {
    const { t } = useTranslation();
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center font-sans">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-md w-full"
            >
                <img 
                    src={reloadLogoTransparent} 
                    alt="RELOAD" 
                    className="h-12 w-auto mx-auto mb-12 opacity-80" 
                />
                
                <div className="space-y-6">
                    <span className="font-mono text-xs tracking-[0.3em] text-rose-500 uppercase block">
                        {t('maintenance.badge')}
                    </span>
                    <h1 className="text-4xl font-black text-zinc-50 uppercase tracking-tighter leading-none">
                        {t('maintenance.title')}
                    </h1>
                    <p className="text-zinc-400 text-sm leading-relaxed max-w-[32ch] mx-auto">
                        {t('maintenance.desc')}
                    </p>
                </div>
                
                <div className="mt-16 flex justify-center">
                    <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-zinc-700 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-zinc-700 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-zinc-700 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
