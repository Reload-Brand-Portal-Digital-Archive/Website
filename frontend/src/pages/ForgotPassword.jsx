import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
            setMessage(response.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan pada server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-950 px-4 font-sans">
            <div className="w-full max-w-md bg-zinc-900 p-8 rounded-none border border-zinc-800">
                <h2 className="text-3xl font-bold text-white text-center mb-2 tracking-widest uppercase">Lupa <span className="text-zinc-500">Password?</span></h2>
                <p className="text-zinc-400 text-center text-sm mb-8">Masukkan email Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi.</p>

                {message && <div className="bg-green-500/10 border border-green-500 text-green-500 p-3 rounded-none mb-4 text-sm text-center">{message}</div>}
                {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-none mb-4 text-sm text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="email"
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-zinc-950 text-white border border-zinc-800 focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600 rounded-none text-sm"
                            placeholder="ALAMAT EMAIL"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-bold py-3 px-4 rounded-none focus:outline-none transition-colors uppercase tracking-widest text-sm mt-4">
                        {loading ? 'Mengirim...' : 'Kirim Link Reset'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link to="/login" className="text-zinc-500 hover:text-zinc-300 text-xs uppercase tracking-widest transition-colors">[ Kembali ke Login ]</Link>
                </div>
            </div>
        </div>
    );
}