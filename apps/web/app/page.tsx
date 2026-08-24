'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare, Zap, Lock, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAuthToken } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (getAuthToken()) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleStart = () => {
    if (isAuthenticated) {
      router.push('/chat');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden selection:bg-emerald-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 backdrop-blur-md border-b border-white/5 bg-black/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
            <MessageSquare size={16} fill="white" className="text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight">MConnect</span>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          {isAuthenticated ? (
            <button onClick={handleStart} className="bg-white text-black px-4 py-2 rounded-full hover:bg-neutral-200 transition-colors">
              Open App
            </button>
          ) : (
            <>
              <Link href="/login" className="text-neutral-400 hover:text-white transition-colors hidden sm:block">Log in</Link>
              <Link href="/signup" className="bg-white text-black px-4 py-2 rounded-full hover:bg-neutral-200 transition-colors">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 md:pt-48 md:pb-32 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-emerald-400 mb-8"
        >
          <Sparkles size={14} />
          <span>MConnect is now in beta</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.1] mb-6 max-w-4xl"
        >
          Conversations, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">connected.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-lg md:text-xl text-neutral-400 mb-10 max-w-2xl"
        >
          A premium real-time messaging experience designed for speed, simplicity, and focus. Built with modern technology for modern teams.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <button onClick={handleStart} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-4 rounded-full transition-all hover:scale-105 active:scale-95">
            Start messaging
            <ArrowRight size={18} />
          </button>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full text-left"
        >
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/[0.07] transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
              <Zap className="text-emerald-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Lightning Fast</h3>
            <p className="text-neutral-400 leading-relaxed">Built on a robust real-time architecture that delivers messages instantly across all your devices.</p>
          </div>
          
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/[0.07] transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6">
              <Lock className="text-cyan-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
            <p className="text-neutral-400 leading-relaxed">Your data is stored securely in PostgreSQL with JWT-based authentication to keep your conversations private.</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/[0.07] transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
              <Sparkles className="text-purple-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Intelligent (Optional)</h3>
            <p className="text-neutral-400 leading-relaxed">Optional AI features powered by Hugging Face to enhance your messaging experience when you need it.</p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between text-sm text-neutral-500">
          <p>© {new Date().getFullYear()} MConnect. All rights reserved.</p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
