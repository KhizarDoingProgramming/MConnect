'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare } from 'lucide-react';
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
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2A25] overflow-hidden selection:bg-[#2C2A25]/10 font-sans antialiased relative">
      
      {/* Decorative Ambient Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-[#E2EEDD]/60 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tl from-[#F4E3D7]/60 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2C2A25] shadow-md flex items-center justify-center transform -rotate-3 transition-transform hover:rotate-0">
            <MessageSquare size={18} className="text-[#FDFBF7]" />
          </div>
          <span className="font-extrabold text-xl tracking-tighter text-[#2C2A25]">MConnect.</span>
        </div>
        <div className="flex items-center gap-5 text-sm font-semibold">
          {isAuthenticated ? (
            <button onClick={handleStart} className="text-[#2C2A25] hover:text-[#5DB075] transition-colors">
              Open App
            </button>
          ) : (
            <>
              <Link href="/login" className="text-[#8C857B] hover:text-[#2C2A25] transition-colors hidden sm:block">Log in</Link>
              <Link href="/signup" className="group relative px-6 py-2.5 overflow-hidden rounded-full bg-[#2C2A25] text-[#FDFBF7] shadow-lg transition-transform hover:scale-105 active:scale-95">
                <span className="relative z-10 font-bold">Sign up</span>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-20 pb-20 md:pt-32 md:pb-32 px-6 md:px-12 max-w-5xl mx-auto flex flex-col items-center text-center">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#E8E2D9] bg-white/50 backdrop-blur-sm text-xs font-bold text-[#8C857B] mb-12 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-[#5DB075] animate-pulse" />
          <span>v2.0 is now live</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl md:text-8xl lg:text-[7rem] font-medium tracking-tighter leading-[0.95] mb-8 text-[#2C2A25]"
        >
          Talk to people, <br className="hidden md:block" />
          <span className="italic font-serif text-[#748C6B]">beautifully.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-2xl text-[#8C857B] font-light mb-14 max-w-2xl leading-relaxed"
        >
          A carefully crafted messaging experience. No noise, no clutter. Just you and the people that matter.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <button 
            onClick={handleStart} 
            className="group flex items-center gap-3 bg-[#2C2A25] text-[#FDFBF7] font-medium px-10 py-5 rounded-full transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 active:shadow-md"
          >
            <span className="text-lg">Start messaging</span>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-1">
              <ArrowRight size={16} />
            </div>
          </button>
        </motion.div>

        {/* Abstract Floating UI Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-24 relative w-full max-w-2xl mx-auto h-64 md:h-80"
        >
          {/* Main Chat Bubble */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="absolute top-10 left-[10%] md:left-[20%] bg-white p-6 rounded-[2rem] rounded-tl-sm shadow-xl border border-[#E8E2D9] max-w-[280px]"
          >
            <div className="w-12 h-2 bg-[#E8E2D9] rounded-full mb-3" />
            <div className="w-48 h-2 bg-[#F4E3D7] rounded-full mb-2" />
            <div className="w-32 h-2 bg-[#F4E3D7] rounded-full" />
          </motion.div>

          {/* Secondary Chat Bubble */}
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-10 right-[10%] md:right-[20%] bg-[#2C2A25] p-6 rounded-[2rem] rounded-br-sm shadow-2xl max-w-[240px]"
          >
            <div className="w-full h-2 bg-white/20 rounded-full mb-2" />
            <div className="w-24 h-2 bg-white/20 rounded-full" />
          </motion.div>

          {/* Mini Avatar */}
          <motion.div 
            animate={{ y: [0, -5, 0], rotate: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 2 }}
            className="absolute top-0 right-[25%] md:right-[35%] w-14 h-14 bg-[#E2EEDD] rounded-full shadow-lg border-4 border-white flex items-center justify-center text-[#748C6B]"
          >
            <MessageSquare size={20} />
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-10 mt-10">
        <div className="max-w-5xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between text-xs text-[#8C857B] font-medium tracking-wide uppercase">
          <p>© {new Date().getFullYear()} MConnect Studio.</p>
          <div className="flex items-center gap-8 mt-4 md:mt-0">
            <Link href="#" className="hover:text-[#2C2A25] transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-[#2C2A25] transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
