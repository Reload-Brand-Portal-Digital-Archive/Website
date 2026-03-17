import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { id, token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (password !== confirmPassword) {
            return setError('Password dan Konfirmasi Password tidak cocok!');
        }

        setLoading(true);

        try {
            const response = await axios.post(`http://localhost:5000/api/auth/reset-password/${id}/${token}`, {
                newPassword: password
            });
            setMessage(response.data.message);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Link tidak valid atau sudah kedaluwarsa.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-950 px-4 font-sans">
            <div className="w-full max-w-md bg-zinc-900 p-8 rounded-none border border-zinc-800">
                <h2 className="text-3xl font-bold text-white text-center mb-2 tracking-widest uppercase">Password <span className="text-zinc-500">Baru</span></h2>
                <p className="text-zinc-400 text-center text-sm mb-8">Silakan buat kata sandi baru untuk akun Anda.</p>

                {message && <div className="bg-green-500/10 border border-green-500 text-green-500 p-3 rounded-none mb-4 text-sm text-center">{message}</div>}
                {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-none mb-4 text-sm text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-zinc-950 text-white border border-zinc-800 focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600 rounded-none text-sm"
                            placeholder="PASSWORD BARU"
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-zinc-950 text-white border border-zinc-800 focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600 rounded-none text-sm"
                            placeholder="KONFIRMASI PASSWORD"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-none focus:outline-none transition-colors uppercase tracking-widest text-sm mt-4">
                        {loading ? 'Menyimpan...' : 'Simpan Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}