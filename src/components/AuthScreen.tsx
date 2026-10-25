'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { UserRole, Gym } from '@/types';
import { haptics } from '@/lib/audio-haptics';
import { 
  Dumbbell, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Building2, 
  UserCheck, 
  Flame, 
  CheckCircle2, 
  Lock, 
  Mail, 
  KeyRound, 
  Activity,
  Layers
} from 'lucide-react';

interface AuthScreenProps {
  gyms: Gym[];
  onLogin: (credentials: { email: string; role: UserRole; name?: string; gym?: Gym }) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ gyms, onLogin }) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'demo'>('signin');
  
  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('aarav.shah@fitsync.health');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGoal, setRegGoal] = useState<'Build Muscle' | 'Lose Weight' | 'Increase Strength' | 'General Fitness'>('Build Muscle');
  const [selectedGymId, setSelectedGymId] = useState<string>(gyms[0]?.id || 'gym_fitzone_vadodara');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    haptics.playSuccess();
    
    // Determine role based on email hint or default to member
    let role: UserRole = 'member';
    let name = 'Aarav Shah';
    if (loginEmail.toLowerCase().includes('trainer') || loginEmail.toLowerCase().includes('raj')) {
      role = 'trainer';
      name = 'Coach Raj Patel';
    } else if (loginEmail.toLowerCase().includes('admin')) {
      role = 'gym_admin';
      name = 'FitZone Admin';
    }

    onLogin({
      email: loginEmail.trim() || 'aarav.shah@fitsync.health',
      role,
      name
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      alert('Please fill in your name and email address.');
      return;
    }
    haptics.playSuccess();
    const gymObj = gyms.find(g => g.id === selectedGymId) || gyms[0];
    onLogin({
      email: regEmail.trim(),
      role: 'member',
      name: regName.trim(),
      gym: gymObj
    });
  };

  const handleQuickDemo = (role: UserRole, email: string, name: string) => {
    haptics.playTap();
    onLogin({
      email,
      role,
      name
    });
  };

  return (
    <div className="min-h-screen bg-canvas-base text-gray-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-fitness-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-healthcare-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-xl z-10 space-y-6">

        {/* Phase Scope Pill Banner */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-fitness-primary/10 border border-fitness-primary/30 text-fitness-primary text-xs font-semibold backdrop-blur-md shadow-glow-fitness">
            <span className="w-2 h-2 rounded-full bg-fitness-primary animate-pulse" />
            <span>Phase 1 Initial Release (40% Scope MVP)</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-300 font-normal">Auth & Core Member Dashboard</span>
          </div>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-surface-2 border border-fitness-primary/40 shadow-glow-fitness mb-1">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden">
              <Image 
                src="/assets/logo.jpg" 
                alt="FitSync AI Logo" 
                fill 
                className="object-cover"
                priority
              />
            </div>
          </div>
          <h1 className="font-headline font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
            FitSync <span className="bg-ai-gradient bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
            Your Fitness. Your Health. Your Intelligence. Single unified platform connecting athletes, gyms, and sports coaches.
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-surface-1/90 backdrop-blur-xl border border-surface-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Tabs Selector */}
          <div className="grid grid-cols-3 gap-1.5 bg-surface-2 p-1.5 rounded-2xl border border-surface-border">
            <button
              onClick={() => {
                haptics.playTap();
                setActiveTab('signin');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'signin'
                  ? 'bg-fitness-primary text-gray-950 shadow-glow-fitness'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                haptics.playTap();
                setActiveTab('register');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'register'
                  ? 'bg-fitness-primary text-gray-950 shadow-glow-fitness'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Register (New)
            </button>
            <button
              onClick={() => {
                haptics.playTap();
                setActiveTab('demo');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'demo'
                  ? 'bg-fitness-primary text-gray-950 shadow-glow-fitness'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ⚡ 1-Click Demo
            </button>
          </div>

          {/* TAB 1: SIGN IN FORM */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-fitness-primary" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-surface-2 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary transition"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-fitness-primary" /> Password
                  </label>
                  <span className="text-[11px] text-fitness-primary hover:underline cursor-pointer">
                    Demo Mode (Any password works)
                  </span>
                </div>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-2 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary transition"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-surface-2 border-surface-border text-fitness-primary focus:ring-0"
                  />
                  <span>Stay signed in</span>
                </label>
                <span className="text-[11px] text-gray-500">Initial Phase v1.0</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs rounded-xl shadow-glow-fitness transition flex items-center justify-center gap-2 mt-2"
              >
                <span>Sign In to FitSync Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 2: NEW MEMBER REGISTRATION & ONBOARDING */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Full Name</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Rohan Sharma"
                    className="w-full bg-surface-2 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Email Address</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="rohan@example.com"
                    className="w-full bg-surface-2 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Create Password</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface-2 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Primary Goal</label>
                  <select
                    value={regGoal}
                    onChange={(e) => setRegGoal(e.target.value as any)}
                    className="w-full bg-surface-2 border border-surface-border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary transition"
                  >
                    <option value="Build Muscle">Build Muscle (Hypertrophy)</option>
                    <option value="Lose Weight">Lose Weight (Fat Loss)</option>
                    <option value="Increase Strength">Increase Strength</option>
                    <option value="General Fitness">General Fitness</option>
                  </select>
                </div>
              </div>

              {/* Gym Branch Selection Onboarding */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-fitness-primary" /> Select Home Gym Branch
                </label>
                <div className="space-y-2">
                  {gyms.slice(0, 3).map((gym) => {
                    const isSelected = selectedGymId === gym.id;
                    return (
                      <div
                        key={gym.id}
                        onClick={() => {
                          haptics.playTap();
                          setSelectedGymId(gym.id);
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-fitness-primary/10 border-fitness-primary shadow-glow-fitness'
                            : 'bg-surface-2 border-surface-border hover:border-gray-500'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{gym.name}</span>
                            <span className="text-[10px] text-fitness-primary font-mono">{gym.rating} ★</span>
                          </div>
                          <div className="text-[11px] text-gray-400">{gym.location} • {gym.distance}</div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-fitness-primary" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs rounded-xl shadow-glow-fitness transition flex items-center justify-center gap-2 mt-2"
              >
                <span>Complete Registration & Open Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 3: 1-CLICK QUICK DEMO ACCOUNTS */}
          {activeTab === 'demo' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <p className="text-xs text-gray-400">
                Instantly enter the platform as any key stakeholder to evaluate Phase 1 core functionality:
              </p>

              {/* Demo Account 1: Member */}
              <div
                onClick={() => handleQuickDemo('member', 'aarav.shah@fitsync.health', 'Aarav Shah')}
                className="p-4 rounded-2xl bg-surface-2 border border-surface-border hover:border-fitness-primary/60 cursor-pointer transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden relative border border-fitness-primary/50">
                    <Image src="/assets/aarav.jpg" alt="Aarav Shah" fill className="object-cover" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-fitness-primary transition">
                      Aarav Shah (Elite Member)
                    </div>
                    <div className="text-xs text-gray-400">FitZone Vadodara • Daily Telemetry & Workouts</div>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-fitness-primary text-gray-950 shadow-glow-fitness">
                  Enter Dashboard →
                </span>
              </div>

            </div>
          )}

          {/* Scope Footer Card */}
          <div className="p-3.5 rounded-2xl bg-surface-2/60 border border-surface-border text-xs text-gray-400 flex items-start gap-2.5">
            <Layers className="w-4 h-4 text-fitness-primary flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-white">40% Initial Release:</strong> Authentication, Gym Onboarding, and Core Member Telemetry Dashboard.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
