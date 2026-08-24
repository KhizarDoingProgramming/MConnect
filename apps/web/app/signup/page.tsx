'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi, setAuthToken } from '@/lib/api';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetchApi('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Signup failed');
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
    <div className="min-h-screen bg-[#111b21] flex flex-col items-center justify-center px-4">
      {/* Logo area */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-[#25D366] flex items-center justify-center mb-4 shadow-2xl shadow-[#25D366]/30">
          <svg viewBox="0 0 32 32" fill="white" width="44" height="44">
            <path d="M16 2C8.268 2 2 8.268 2 16c0 2.387.557 4.647 1.557 6.657L2 30l7.55-1.535A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.5a11.44 11.44 0 01-5.834-1.6l-.418-.248-4.482.912.946-4.352-.272-.44A11.5 11.5 0 114.5 16C4.5 9.649 9.649 4.5 16 4.5S27.5 9.649 27.5 16 22.351 27.5 16 27.5zm6.29-8.64c-.344-.172-2.037-1.005-2.352-1.118-.316-.114-.546-.172-.775.172s-.889 1.118-1.09 1.348c-.2.23-.401.258-.745.086s-1.451-.535-2.764-1.706c-1.021-.913-1.71-2.04-1.912-2.384-.2-.344-.021-.53.151-.701.154-.154.344-.4.516-.601.172-.2.23-.344.344-.573.115-.23.058-.43-.029-.601-.086-.172-.775-1.868-1.062-2.556-.28-.67-.564-.578-.775-.589l-.66-.012a1.264 1.264 0 00-.917.43c-.316.344-1.203 1.176-1.203 2.867s1.232 3.327 1.404 3.556c.172.23 2.424 3.7 5.872 5.19.821.354 1.461.566 1.96.724.824.262 1.574.225 2.167.137.661-.099 2.037-.832 2.324-1.636.287-.803.287-1.492.2-1.636-.086-.143-.315-.23-.66-.4z" />
          </svg>
        </div>
        <h1 className="text-white text-2xl font-light tracking-wide">MConnect</h1>
        <p className="text-[#8696a0] text-sm mt-1">Create your account</p>
      </div>

      <div className="bg-[#202c33] rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <h2 className="text-[#e9edef] text-xl font-semibold mb-1">Get started</h2>
        <p className="text-[#8696a0] text-sm mb-6">Fill in your details below</p>

        {error && (
          <div className="bg-[#f15c6d]/10 border border-[#f15c6d]/20 rounded-lg px-3 py-2 mb-4">
            <p className="text-[#f15c6d] text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-[#8696a0] text-xs uppercase tracking-wider font-semibold block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-[#2a3942] text-[#d1d7db] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder-[#8696a0] transition-all"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-[#8696a0] text-xs uppercase tracking-wider font-semibold block mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full bg-[#2a3942] text-[#d1d7db] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder-[#8696a0] transition-all"
              placeholder="yourname"
            />
          </div>
          <div>
            <label className="text-[#8696a0] text-xs uppercase tracking-wider font-semibold block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-[#2a3942] text-[#d1d7db] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] placeholder-[#8696a0] transition-all"
              placeholder="Min. 6 characters"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#25D366] hover:bg-[#1da851] disabled:opacity-60 text-white font-semibold py-3 rounded-xl mt-2 transition-all shadow-lg shadow-[#25D366]/20"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-[#8696a0] text-sm text-center mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-[#25D366] hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}