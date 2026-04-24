import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Terminal, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Unsubscribe() {
    const [searchParams] = useSearchParams();
    const urlEmail = searchParams.get('email') || '';
    const [manualEmail, setManualEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const displayEmail = urlEmail || manualEmail;

    const handleUnsubscribe = async (e) => {
        e.preventDefault();
        
        if (!displayEmail) {
            setErrorMessage('EMAIL_REQUIRED_EXCEPTION');
            setStatus('error');
            return;
        }

        setLoading(true);
        setStatus('idle');
        
        try {
            await axios.get(`${import.meta.env.VITE_API_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(displayEmail)}`);
            setStatus('success');
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'UNAUTHORIZED_ACCESS_DENIED');
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-red-600/10 blur-[100px] rounded-full pointer-events-none"></div>
                
                <div className="max-w-xl w-full border border-red-900/50 bg-black/50 p-8 md:p-12 text-center relative z-10 backdrop-blur-sm">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6" />
                    <h1 className="text-2xl md:text-4xl font-black text-red-500 uppercase tracking-tighter mb-4 font-sans">
                        ACCESS REVOKED
                    </h1>
                    <p className="text-zinc-400 font-mono text-sm tracking-widest uppercase mb-8">
                        YOU HAVE LEFT THE UNDERGROUND.
                    </p>
                    <Link 
                        to="/"
                        className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        RETURN TO SURFACE
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-red-900 selection:text-white">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-red-600/5 blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className="max-w-xl w-full relative z-10">
                <Link to="/" className="inline-flex items-center gap-2 text-zinc-600 hover:text-white mb-12 transition-colors font-mono text-xs uppercase tracking-widest">
                    <ArrowLeft className="w-4 h-4" />
                    [ ABORT SEQUENCE ]
                </Link>

                <div className="border border-zinc-800 bg-zinc-900/50 p-8 md:p-12 backdrop-blur-sm shadow-2xl shadow-black">
                    <div className="flex items-center gap-3 mb-8 border-b border-zinc-800 pb-4">
                        <Terminal className="w-5 h-5 text-red-500" />
                        <h2 className="font-mono text-xs md:text-sm tracking-[0.2em] text-zinc-400 uppercase">
                            Connection Termination
                        </h2>
                    </div>

                    <form onSubmit={handleUnsubscribe} className="space-y-8">
                        {urlEmail ? (
                            <div className="space-y-4">
                                <p className="font-mono text-sm text-zinc-300 leading-relaxed uppercase tracking-wider">
                                    Are you sure you want to stop receiving secret drop info for <br/>
                                    <span className="text-red-400 font-bold bg-red-950/30 px-2 py-1 border border-red-900/50 mt-2 inline-block">
                                        {urlEmail}
                                    </span> ?
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.15em] block">
                                    Target Email Override
                                </label>
                                <input
                                    type="email"
                                    value={manualEmail}
                                    onChange={(e) => {
                                        setManualEmail(e.target.value);
                                        setStatus('idle');
                                    }}
                                    placeholder="ENTER_EMAIL@DOMAIN.COM"
                                    className="w-full bg-black border border-zinc-800 focus:border-red-500 outline-none h-12 px-4 text-sm text-red-100 font-mono transition-colors placeholder:text-zinc-700"
                                    required
                                />
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="bg-red-950/30 border border-red-900/50 p-4 font-mono text-xs text-red-400 uppercase tracking-widest flex items-start gap-3">
                                <span className="text-red-500 font-bold">ERR:</span>
                                {errorMessage}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || (!urlEmail && !manualEmail)}
                            className="w-full bg-zinc-50 hover:bg-red-600 text-zinc-950 hover:text-white font-mono text-sm uppercase tracking-widest h-14 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-red-600 transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out"></div>
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent group-hover:border-white group-hover:border-t-transparent rounded-full animate-spin"></div>
                                        EXECUTING...
                                    </>
                                ) : (
                                    '[ REVOKE ACCESS ]'
                                )}
                            </span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
