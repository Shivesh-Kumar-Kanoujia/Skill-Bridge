'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSkillBridge } from '@/context/SkillBridgeContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, resetPassword } = useSkillBridge();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Password reset modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your university email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    const result = await login(email.trim(), password);
    setIsLoading(false);

    if (result.success) {
      window.location.href = '/dashboard';
    } else {
      setError(result.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotMsg('');

    if (!forgotEmail.trim() || !newPassword) {
      setForgotError('Please provide both your registered email and new password.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('Password must contain at least 6 characters.');
      return;
    }

    setIsResetting(true);
    const res = await resetPassword(forgotEmail.trim(), newPassword);
    setIsResetting(false);

    if (res.success) {
      setForgotMsg(res.message || 'Password updated! You can now sign in.');
      setEmail(forgotEmail.trim());
      setPassword(newPassword);
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotMsg('');
      }, 1500);
    } else {
      setForgotError(res.error || 'Password reset failed.');
    }
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
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                  className="text-[11px] text-[#8E9690] hover:text-[#31594B] cursor-pointer transition-colors"
                >
                  Forgot password?
                </button>
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
        </div>

        {/* Footnote */}
        <p className="text-center text-xs text-[#68716B] mt-6">
          Don&apos;t have an account yet?{' '}
          <Link href="/signup" className="font-semibold text-[#31594B] hover:underline">
            Create student profile
          </Link>
        </p>
      </motion.div>

      {/* Forgot / Reset Password Dialog */}
      <Dialog
        isOpen={showForgotModal}
        onClose={() => {
          setShowForgotModal(false);
          setForgotError('');
          setForgotMsg('');
        }}
        title="Reset Account Password"
        description="Enter your registered academic email and choose a new password."
      >
        <form onSubmit={handleResetSubmit} className="flex flex-col gap-4 pt-2">
          <Input
            label="Registered Email"
            type="email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            placeholder="student.name@apex.edu"
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            leftIcon={<Lock className="w-4 h-4" />}
            helperText="Must be at least 6 characters long."
            required
          />

          {forgotError && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#B5473C]">
              {forgotError}
            </div>
          )}

          {forgotMsg && (
            <div className="p-2.5 rounded-xl bg-green-50 border border-green-200 text-xs text-[#31594B] font-medium">
              {forgotMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForgotModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isResetting}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
