'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi, setAuthToken } from '@/lib/api';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen bg-gradient-to-br from-[#E8F3F1] via-[#F4EBE3] to-[#FCDED4] flex flex-col items-center justify-center px-4 font-sans text-[#3A352F]">
      
      <Link href="/" className="absolute top-8 left-8 p-3 rounded-full bg-white shadow-sm hover:scale-105 transition-transform">
        <ArrowLeft size={20} className="text-[#3A352F]" />
      </Link>

      {/* Logo area */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-4 shadow-xl border border-black/5">
          <MessageSquare size={36} className="text-[#3A352F]" />
        </div>
        <h1 className="text-[#3A352F] text-3xl font-extrabold tracking-tight">MConnect</h1>
        <p className="text-[#7C746B] font-medium mt-1">Welcome back. Let's chat.</p>
      </motion.div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl">
        <h2 className="text-[#3A352F] text-2xl font-bold mb-1">Sign In</h2>
        <p className="text-[#968E85] text-sm mb-6 font-semibold">Enter your details to continue</p>

        {error && (
          <div className="bg-[#FFDCD6] border border-[#FF5B5B]/20 rounded-xl px-4 py-3 mb-6 shadow-sm">
            <p className="text-[#FF5B5B] text-sm font-bold">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[#968E85] text-xs uppercase tracking-widest font-bold block mb-1.5 pl-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-white text-[#3A352F] font-medium rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 shadow-sm border border-black/5 transition-all"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-[#968E85] text-xs uppercase tracking-widest font-bold block mb-1.5 pl-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-white text-[#3A352F] font-medium rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 shadow-sm border border-black/5 transition-all"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3A352F] hover:bg-[#2A2520] disabled:opacity-50 disabled:scale-100 hover:scale-105 active:scale-95 text-white font-bold py-4 rounded-full mt-4 transition-all shadow-lg"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-[#968E85] text-sm font-semibold text-center mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#3A352F] hover:underline font-bold">Create one</Link>
        </p>
      </motion.div>
    </div>
  );
}
