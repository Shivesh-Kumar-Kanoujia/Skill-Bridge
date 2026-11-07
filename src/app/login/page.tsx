'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSkillBridge } from '@/context/SkillBridgeContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Eye, EyeOff, Lock, Mail, ArrowRight, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useSkillBridge();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your university email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleDemoFill = () => {
    setEmail('aarav.sharma@apex.edu');
    setPassword('password123');
    setError('');
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F4F1E8]">
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#31594B] text-white flex items-center justify-center shadow-xs">
              <span className="font-serif font-bold text-lg">S</span>
            </div>
            <span className="font-serif font-bold text-xl text-[#31594B]">SkillBridge</span>
          </Link>
          <h1 className="text-2xl font-serif font-bold text-[#292F2B]">
            Sign in to your account
          </h1>
          <p className="text-xs sm:text-sm text-[#68716B] mt-1.5">
            Access your projects, team requests, and campus applications
          </p>
        </div>

        {/* Card Form */}
        <div className="clay-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="University Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student.name@apex.edu"
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#292F2B] uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[11px] text-[#8E9690] hover:text-[#31594B] cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full h-10 rounded-xl bg-white border border-[#E3E2D9] pl-10 pr-10 text-sm text-[#292F2B] focus:outline-none focus:ring-2 focus:ring-[#31594B] shadow-2xs"
                />
                <div className="absolute left-3.5 top-3 text-[#8E9690]">
                  <Lock className="w-4 h-4" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-[#8E9690] hover:text-[#292F2B] p-0.5 rounded cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#B5473C] font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Demo account quick login helper */}
          <div className="mt-5 pt-4 border-t border-[#ECE8DD] bg-[#FAF8F5] -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-4 rounded-b-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#68716B]">
              <KeyRound className="w-4 h-4 text-[#31594B]" />
              <span>Demo: Aarav Sharma</span>
            </div>
            <button
              type="button"
              onClick={handleDemoFill}
              className="text-[#31594B] font-semibold hover:underline text-xs cursor-pointer"
            >
              Autofill Demo
            </button>
          </div>
        </div>

        {/* Footnote */}
        <p className="text-center text-xs text-[#68716B] mt-6">
          Don&apos;t have an account yet?{' '}
          <Link href="/signup" className="font-semibold text-[#31594B] hover:underline">
            Create student profile
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
