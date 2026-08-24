'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare, Zap, Lock, Sparkles, Phone, Video } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-[#E8F3F1] via-[#F4EBE3] to-[#FCDED4] text-[#3A352F] overflow-hidden selection:bg-[#3A352F]/10 font-sans antialiased">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 backdrop-blur-2xl border-b border-[#EAE3D9]/60 bg-white/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
            <MessageSquare size={20} className="text-[#3A352F]" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-[#3A352F]">MConnect</span>
        </div>
        <div className="flex items-center gap-4 text-sm font-bold">
          {isAuthenticated ? (
            <button onClick={handleStart} className="bg-[#3A352F] text-white px-5 py-2.5 rounded-full hover:scale-105 transition-all shadow-md active:scale-95">
              Open App
            </button>
          ) : (
            <>
              <Link href="/login" className="text-[#7C746B] hover:text-[#3A352F] transition-colors hidden sm:block">Log in</Link>
              <Link href="/signup" className="bg-[#3A352F] text-white px-5 py-2.5 rounded-full hover:scale-105 transition-all shadow-md active:scale-95">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 md:pt-40 md:pb-32 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-sm border border-black/5 text-xs font-bold text-[#7C746B] mb-8"
        >
          <Sparkles size={14} className="text-[#5DB075]" />
          <span>MConnect is now in beta</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter leading-[1.05] mb-6 max-w-4xl text-[#3A352F]"
        >
          Connecting people, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5DB075] to-[#458C96]">beautifully.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-lg md:text-xl text-[#7C746B] font-medium mb-10 max-w-2xl"
        >
          A premium real-time messaging experience designed for speed, simplicity, and focus. Inspired by modern minimalist design.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <button onClick={handleStart} className="flex items-center gap-2 bg-[#3A352F] hover:bg-[#2A2520] text-white font-bold px-8 py-4 rounded-full transition-all shadow-lg shadow-black/10 hover:scale-105 active:scale-95">
            Start messaging
            <ArrowRight size={18} />
          </button>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full text-left"
        >
          <div className="bg-white/60 backdrop-blur-xl border border-white p-8 rounded-[2rem] hover:bg-white/80 transition-all shadow-xl shadow-black/5">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6">
              <Zap className="text-[#3A352F]" size={24} />
            </div>
            <h3 className="text-xl font-extrabold mb-3 text-[#3A352F]">Lightning Fast</h3>
            <p className="text-[#7C746B] font-medium leading-relaxed">Built on a robust real-time architecture that delivers messages instantly across all your devices with Prisma and Socket.IO.</p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-xl border border-white p-8 rounded-[2rem] hover:bg-white/80 transition-all shadow-xl shadow-black/5">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6">
              <Lock className="text-[#3A352F]" size={24} />
            </div>
            <h3 className="text-xl font-extrabold mb-3 text-[#3A352F]">Secure & Private</h3>
            <p className="text-[#7C746B] font-medium leading-relaxed">Your data is stored securely in PostgreSQL with JWT-based authentication to keep your conversations private.</p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl border border-white p-8 rounded-[2rem] hover:bg-white/80 transition-all shadow-xl shadow-black/5">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6">
              <Sparkles className="text-[#3A352F]" size={24} />
            </div>
            <h3 className="text-xl font-extrabold mb-3 text-[#3A352F]">Beautiful Design</h3>
            <p className="text-[#7C746B] font-medium leading-relaxed">A soft, glassmorphic aesthetic built with Framer Motion, completely overhauling the standard dark-mode chat look.</p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#EAE3D9]/60 py-8 mt-12 bg-white/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between text-sm text-[#968E85] font-bold">
          <p>© {new Date().getFullYear()} MConnect. All rights reserved.</p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-[#3A352F] transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-[#3A352F] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
