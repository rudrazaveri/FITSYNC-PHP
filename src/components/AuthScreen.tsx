'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { UserRole, Gym } from '@/types';
import { haptics } from '@/lib/audio-haptics';
import { 
  NewUserRegistrationParams, 
  findRegisteredUser, 
  getRegisteredUsers 
} from '@/lib/store';
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
  Layers,
  Scale,
  HeartPulse,
  AlertCircle
} from 'lucide-react';

export interface AuthUserCredentials {
  email: string;
  role: UserRole;
  name?: string;
  password?: string;
  gym?: Gym;
  isDemo?: boolean;
  isNewRegistration?: boolean;
  registrationParams?: NewUserRegistrationParams;
}

interface AuthScreenProps {
  gyms: Gym[];
  onAuthenticate: (credentials: AuthUserCredentials) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ gyms, onAuthenticate }) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'demo'>('register');
  
  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [registeredAccounts, setRegisteredAccounts] = useState<{ email: string; name: string }[]>([]);

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [selectedGymId, setSelectedGymId] = useState<string>(gyms[0]?.id || 'gym_fitzone_vadodara');
  const [regGoal, setRegGoal] = useState<'Build Muscle' | 'Lose Weight' | 'Increase Strength' | 'Improve Endurance' | 'General Fitness'>('Build Muscle');
  
  // Biometrics for accurate Mifflin-St Jeor calculation (No pre-defined fake data!)
  const [regGender, setRegGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [regAge, setRegAge] = useState<number>(24);
  const [regHeightCm, setRegHeightCm] = useState<number>(175);
  const [regWeightKg, setRegWeightKg] = useState<number>(70);
  const [regActivity, setRegActivity] = useState<'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active'>('Moderately Active');
  const [regDiet, setRegDiet] = useState<'Non-Vegetarian' | 'Vegetarian' | 'Eggetarian' | 'Vegan'>('Non-Vegetarian');

  useEffect(() => {
    // Check locally registered accounts on this device
    try {
      const users = getRegisteredUsers();
      const accounts = Object.values(users).map(u => ({ email: u.email, name: u.name }));
      setRegisteredAccounts(accounts);
    } catch (e) {
      console.error(e);
    }
  }, [activeTab]);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const cleanEmail = loginEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setLoginError('Please enter your email address.');
      return;
    }

    // 1. Check if user is registered in local storage registry
    const registeredUser = findRegisteredUser(cleanEmail);
    if (registeredUser) {
      haptics.playSuccess();
      onAuthenticate({
        email: registeredUser.email,
        role: 'member',
        name: registeredUser.name,
        isDemo: false,
        isNewRegistration: false
      });
      return;
    }

    // 2. Check if user typed Aarav's demo email
    if (cleanEmail === 'aarav.shah@fitsync.health' || cleanEmail.includes('aarav') || cleanEmail.includes('demo')) {
      haptics.playSuccess();
      onAuthenticate({
        email: 'aarav.shah@fitsync.health',
        role: 'member',
        name: 'Aarav Shah',
        isDemo: true,
        isNewRegistration: false
      });
      return;
    }

    // 3. Email not registered yet
    haptics.playTap();
    setLoginError(
      `No account found for "${cleanEmail}". Click 'Register (New Athlete)' tab to create a fresh profile, or use '1-Click Demo'.`
    );
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!regName.trim() || !regEmail.trim()) {
      alert('Please fill in your name and email address.');
      return;
    }

    haptics.playSuccess();
    const gymObj = gyms.find(g => g.id === selectedGymId) || gyms[0];

    const registrationParams: NewUserRegistrationParams = {
      fullName: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      gym: gymObj,
      goal: regGoal,
      gender: regGender,
      age: Number(regAge) || 24,
      heightCm: Number(regHeightCm) || 175,
      weightKg: Number(regWeightKg) || 70,
      activity: regActivity,
      diet: regDiet
    };

    onAuthenticate({
      email: regEmail.trim().toLowerCase(),
      role: 'member',
      name: regName.trim(),
      gym: gymObj,
      isDemo: false,
      isNewRegistration: true,
      registrationParams
    });
  };

  const handleQuickDemo = (role: UserRole, email: string, name: string) => {
    haptics.playTap();
    onAuthenticate({
      email,
      role,
      name,
      isDemo: true,
      isNewRegistration: false
    });
  };

  return (
    <div className="min-h-screen bg-canvas-base text-gray-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-fitness-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-healthcare-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-xl z-10 space-y-6">

        {/* Platform Status Pill Banner */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-fitness-primary/10 border border-fitness-primary/30 text-fitness-primary text-xs font-semibold backdrop-blur-md shadow-glow-fitness">
            <span className="w-2 h-2 rounded-full bg-fitness-primary animate-pulse" />
            <span>Intelligent Multi-Gym Platform</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-300 font-normal">Clean Athlete Onboarding</span>
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
            Your Fitness. Your Health. Your Intelligence. Connect your gym membership with personalized biometrics & telemetry.
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-surface-1/90 backdrop-blur-xl border border-surface-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Tabs Selector */}
          <div className="grid grid-cols-3 gap-1.5 bg-surface-2 p-1.5 rounded-2xl border border-surface-border">
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

          {/* TAB 1: NEW MEMBER REGISTRATION & CLEAN ONBOARDING */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in duration-200">
              
              {/* Clean Account Notice */}
              <div className="p-3 rounded-2xl bg-fitness-primary/10 border border-fitness-primary/30 text-xs text-fitness-primary flex items-start gap-2">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Clean Slate Guarantee:</strong> New registrations start with 0 pre-filled meals, 0 hydration logs, 0 volume moved, and personalized BMR/TDEE calculated from your stats.
                </span>
              </div>

              {/* 1. Account Details */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-fitness-primary" /> Step 1: Athlete Account
                </div>

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

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Password</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="w-full bg-surface-2 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary transition"
                  />
                </div>
              </div>

              {/* 2. Biometrics & Goals (Calculates Mifflin-St Jeor Engine) */}
              <div className="space-y-3 pt-2 border-t border-surface-border/60">
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-healthcare-accent" /> Step 2: Biometrics & Training Goal
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400">Gender</label>
                    <select
                      value={regGender}
                      onChange={(e) => setRegGender(e.target.value as any)}
                      className="w-full bg-surface-2 border border-surface-border rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400">Age</label>
                    <input
                      type="number"
                      min="14"
                      max="90"
                      required
                      value={regAge}
                      onChange={(e) => setRegAge(parseInt(e.target.value) || 24)}
                      className="w-full bg-surface-2 border border-surface-border rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400">Height (cm)</label>
                    <input
                      type="number"
                      min="120"
                      max="230"
                      required
                      value={regHeightCm}
                      onChange={(e) => setRegHeightCm(parseInt(e.target.value) || 175)}
                      className="w-full bg-surface-2 border border-surface-border rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="35"
                      max="220"
                      required
                      value={regWeightKg}
                      onChange={(e) => setRegWeightKg(parseFloat(e.target.value) || 70)}
                      className="w-full bg-surface-2 border border-surface-border rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400">Primary Goal</label>
                    <select
                      value={regGoal}
                      onChange={(e) => setRegGoal(e.target.value as any)}
                      className="w-full bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                    >
                      <option value="Build Muscle">Build Muscle (Hypertrophy Surplus)</option>
                      <option value="Lose Weight">Lose Weight (Fat Loss Deficit)</option>
                      <option value="Increase Strength">Increase Strength</option>
                      <option value="General Fitness">General Fitness</option>
                      <option value="Improve Endurance">Improve Endurance</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-400">Activity Level</label>
                    <select
                      value={regActivity}
                      onChange={(e) => setRegActivity(e.target.value as any)}
                      className="w-full bg-surface-2 border border-surface-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fitness-primary"
                    >
                      <option value="Sedentary">Sedentary (1.2× BMR)</option>
                      <option value="Lightly Active">Lightly Active (1.375× BMR)</option>
                      <option value="Moderately Active">Moderately Active (1.55× BMR)</option>
                      <option value="Very Active">Very Active (1.725× BMR)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Gym Branch Selection */}
              <div className="space-y-2 pt-2 border-t border-surface-border/60">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-fitness-primary" /> Step 3: Select Home Gym Branch
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
                className="w-full py-3.5 bg-fitness-primary hover:bg-fitness-light text-gray-950 font-bold text-xs rounded-xl shadow-glow-fitness transition flex items-center justify-center gap-2 mt-3"
              >
                <span>Register & Open Clean Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 2: SIGN IN FORM */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4 animate-in fade-in duration-200">
              
              {loginError && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-fitness-primary" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. rohan@example.com"
                  className="w-full bg-surface-2 border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-fitness-primary transition"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-fitness-primary" /> Password
                  </label>
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

              {/* Quick Fill Registered Accounts On This Device */}
              {registeredAccounts.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] text-gray-400">Saved accounts on this device:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {registeredAccounts.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => {
                          setLoginEmail(acc.email);
                          setLoginPassword('password');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface-3 border border-surface-border text-[11px] text-gray-300 hover:text-white transition flex items-center gap-1"
                      >
                        <UserCheck className="w-3 h-3 text-fitness-primary" />
                        <span>{acc.name} ({acc.email})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('aarav.shah@fitsync.health');
                    setLoginPassword('password123');
                  }}
                  className="text-[11px] text-fitness-primary hover:underline cursor-pointer"
                >
                  ⚡ Fill Demo Account
                </button>
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

          {/* TAB 3: 1-CLICK QUICK DEMO ACCOUNTS */}
          {activeTab === 'demo' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="p-3 rounded-2xl bg-surface-2/80 border border-surface-border text-xs text-gray-400">
                The Demo mode loads a pre-populated profile (5-day streak, 2 recorded meals, completed sets, and attendance heatmap) for testing:
              </div>

              {/* Demo Account: Aarav Shah */}
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
                      Aarav Shah (Sample Demo Data)
                    </div>
                    <div className="text-xs text-gray-400">FitZone Vadodara • 5-day streak, 2 logged meals, 18 check-ins</div>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-fitness-primary text-gray-950 shadow-glow-fitness flex-shrink-0">
                  Launch Demo →
                </span>
              </div>
            </div>
          )}

          {/* Platform Feature Summary Card */}
          <div className="p-3.5 rounded-2xl bg-surface-2/60 border border-surface-border text-xs text-gray-400 flex items-start gap-2.5">
            <Layers className="w-4 h-4 text-fitness-primary flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-white">FitSync Platform:</strong> Multi-Gym Authentication, Live Telemetry Tracking, Workout Volume Analytics, and Nutrition Planning.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
