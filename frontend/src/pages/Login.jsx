import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', formData);

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            if (response.data.user.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Kredensial tidak valid');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const response = await axios.post('http://localhost:5000/api/auth/google', {
                token: credentialResponse.credential
            });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            if (response.data.user.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login dengan Google gagal');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-950 px-4">
            <div className="w-full max-w-md bg-zinc-900 p-8 rounded-lg shadow-xl border border-zinc-800">
                <h2 className="text-3xl font-bold text-white text-center mb-6 tracking-wider">RELOAD <span className="text-red-600">DISTRO</span></h2>
                <h3 className="text-xl text-zinc-400 text-center mb-8">Masuk ke Akun Anda</h3>

                {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-zinc-400 text-sm font-bold mb-2">Email</label>
                        <input type="email" name="email" onChange={handleChange} required
                            className="w-full px-3 py-2 bg-zinc-800 text-white border border-zinc-700 rounded focus:outline-none focus:border-red-500 transition-colors"
                            placeholder="email@anda.com" />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-zinc-400 text-sm font-bold">Password</label>
                            <Link to="/forgot-password" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Lupa Password?</Link>
                        </div>
                        <input type="password" name="password" onChange={handleChange} required
                            className="w-full px-3 py-2 bg-zinc-800 text-white border border-zinc-700 rounded focus:outline-none focus:border-red-500 transition-colors"
                            placeholder="••••••••" />
                    </div>
                    <button type="submit" disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded focus:outline-none transition-colors mt-4">
                        {loading ? 'Memeriksa...' : 'Login'}
                    </button>
                </form>

                <div className="my-6 flex items-center justify-center">
                    <span className="w-1/5 border-b border-zinc-700"></span>
                    <span className="text-xs text-zinc-500 uppercase px-2">Atau masuk dengan</span>
                    <span className="w-1/5 border-b border-zinc-700"></span>
                </div>

                <div className="flex justify-center">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Login dibatalkan.')}
                        theme="filled_black"
                        shape="rectangular"
                        text="signin_with"
                    />
                </div>

                <p className="text-center text-zinc-400 mt-6 text-sm">
                    Belum punya akun? <Link to="/register" className="text-red-500 hover:text-red-400">Daftar sekarang</Link>
                </p>
            </div>
        </div>
    );
}