'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi, setAuthToken } from '@/lib/api';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '../../components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
      } else {
        setAuthToken(data.token);
        router.push('/');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F3F1] dark:from-[#212624] via-[#F4EBE3] dark:via-[#26211E] to-[#FCDED4] dark:to-[#2B2320] flex flex-col items-center justify-center px-4 font-sans text-[#3A352F] dark:text-[#EAE3D9] transition-colors duration-500">
      
      <div className="absolute top-8 left-8 right-8 flex justify-between items-center">
        <Link href="/" className="p-3 rounded-full bg-white dark:bg-[#1A1A1A] shadow-sm border border-black/5 dark:border-white/5 hover:scale-105 transition-transform">
          <ArrowLeft size={20} className="text-[#3A352F] dark:text-[#EAE3D9]" />
        </Link>
        <ThemeToggle />
      </div>

      {/* Logo area */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-white dark:bg-[#1A1A1A] flex items-center justify-center mb-4 shadow-xl border border-black/5 dark:border-white/5 transition-colors duration-500">
          <MessageSquare size={36} className="text-[#3A352F] dark:text-[#EAE3D9]" />
        </div>
        <h1 className="text-[#3A352F] dark:text-[#EAE3D9] text-3xl font-extrabold tracking-tight transition-colors duration-500">MConnect</h1>
        <p className="text-[#7C746B] dark:text-[#968E85] font-medium mt-1 transition-colors duration-500">Welcome back. Let's chat.</p>
      </motion.div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-white/70 dark:bg-[#1A1A1A]/70 backdrop-blur-xl border border-white dark:border-[#333333] rounded-[2rem] p-8 w-full max-w-sm shadow-2xl transition-colors duration-500">
        <h2 className="text-[#3A352F] dark:text-[#FDFBF7] text-2xl font-bold mb-1 transition-colors duration-500">Sign In</h2>
        <p className="text-[#968E85] dark:text-[#7C746B] text-sm mb-6 font-semibold transition-colors duration-500">Enter your details to continue</p>

        {error && (
          <div className="bg-[#FFDCD6] dark:bg-[#3D2525] border border-[#FF5B5B]/20 rounded-xl px-4 py-3 mb-6 shadow-sm transition-colors duration-500">
            <p className="text-[#FF5B5B] dark:text-[#FF8A8A] text-sm font-bold">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[#968E85] dark:text-[#7C746B] text-xs uppercase tracking-widest font-bold block mb-1.5 pl-1 transition-colors duration-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-white dark:bg-[#2A2A2A] text-[#3A352F] dark:text-[#FDFBF7] font-medium rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 shadow-sm border border-black/5 dark:border-white/5 transition-all duration-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-[#968E85] dark:text-[#7C746B] text-xs uppercase tracking-widest font-bold block mb-1.5 pl-1 transition-colors duration-500">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-white dark:bg-[#2A2A2A] text-[#3A352F] dark:text-[#FDFBF7] font-medium rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 shadow-sm border border-black/5 dark:border-white/5 transition-all duration-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3A352F] dark:bg-[#FDFBF7] hover:bg-[#2A2520] dark:hover:bg-[#EAE3D9] disabled:opacity-50 disabled:scale-100 hover:scale-105 active:scale-95 text-white dark:text-[#121212] font-bold py-4 rounded-full mt-4 transition-all shadow-lg"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-[#968E85] dark:text-[#7C746B] text-sm font-semibold text-center mt-6 transition-colors duration-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#3A352F] dark:text-[#EAE3D9] hover:underline font-bold transition-colors duration-500">Create one</Link>
        </p>
      </motion.div>
    </div>
  );
}
