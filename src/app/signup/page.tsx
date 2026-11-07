'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSkillBridge } from '@/context/SkillBridgeContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function SignupPage() {
  const router = useRouter();
  const { signup, isAuthenticated } = useSkillBridge();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Computer Science & Engineering',
    semester: 5,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const departments = [
    'Computer Science & Engineering',
    'Artificial Intelligence & Data Science',
    'Electronics & Communication',
    'Information Science & Engineering',
    'Design & Human-Computer Interaction',
    'Electrical & Electronics',
    'Mechanical Engineering',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please provide a valid institutional email address.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setIsLoading(true);
    const result = await signup({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      department: formData.department,
      semester: Number(formData.semester),
    });
    setIsLoading(false);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Registration failed. Please check your details.');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F4F1E8]">
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-lg"
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
            Create student profile
          </h1>
          <p className="text-xs sm:text-sm text-[#68716B] mt-1.5">
            Join the campus network to collaborate on hackathons and semester projects
          </p>
        </div>

        {/* Signup Form Card */}
        <div className="clay-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Diya Nair"
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="University Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="diya.nair@apex.edu"
              leftIcon={<Mail className="w-4 h-4" />}
              helperText="Institutional email for domain verification."
              required
            />

            <div>
              <label className="text-xs font-semibold text-[#292F2B] uppercase tracking-wider mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 6 characters"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#292F2B] uppercase tracking-wider mb-1.5 block">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-[#E3E2D9] bg-white text-sm text-[#292F2B] focus:outline-none focus:ring-2 focus:ring-[#31594B] cursor-pointer"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#292F2B] uppercase tracking-wider mb-1.5 block">
                  Current Semester
                </label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-xl border border-[#E3E2D9] bg-white text-sm text-[#292F2B] focus:outline-none focus:ring-2 focus:ring-[#31594B] cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
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
              Register & Continue
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[#68716B] mt-6">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[#31594B] hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
